"""
scanner.py — Core Scanning Engine

Orchestrates PDF text extraction, chunking, AI detection,
federated plagiarism search, and semantic similarity scoring.
Yields results chunk-by-chunk for SSE streaming.
"""

import logging
import asyncio
import re
from dataclasses import dataclass, field
from typing import AsyncGenerator, Optional

import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter

from sanitize import sanitize, SanitizationReport
from search import federated_search, SearchResult
from ai_engine import detect_ai_hybrid

logger = logging.getLogger(__name__)

# ─── Configuration ──────────────────────────────────────────────────────────

CHUNK_SIZE = 1500  # ~300 words ≈ 1500 characters
CHUNK_OVERLAP = 200
SIMILARITY_THRESHOLD = 0.60  # Lowered from 0.75 to catch more matches


@dataclass
class MatchInfo:
    """A single plagiarism match for a chunk."""
    title: str
    doi: Optional[str]
    doi_url: Optional[str]
    source: str
    similarity: float


@dataclass
class ChunkResult:
    """The full analysis result for a single text chunk."""
    chunk_index: int
    total_chunks: int
    text: str
    # AI Detection
    ai_probability: float
    ai_label: str
    # Plagiarism Detection
    is_plagiarized: bool
    max_similarity: float
    matches: list[MatchInfo] = field(default_factory=list)
    # Sanitization report for the first chunk
    sanitization: Optional[dict] = None

    def to_dict(self) -> dict:
        return {
            "chunk_index": self.chunk_index,
            "total_chunks": self.total_chunks,
            "text": self.text[:200] + ("..." if len(self.text) > 200 else ""),
            "full_text": self.text,
            "ai_probability": round(self.ai_probability, 4),
            "ai_label": self.ai_label,
            "is_plagiarized": self.is_plagiarized,
            "max_similarity": round(self.max_similarity, 4),
            "matches": [
                {
                    "title": m.title,
                    "doi": m.doi,
                    "doi_url": m.doi_url,
                    "source": m.source,
                    "similarity": round(m.similarity, 4),
                }
                for m in self.matches
            ],
            "sanitization": self.sanitization,
        }


# ─── PDF Extraction ────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file using PyMuPDF."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_text = []
    for page in doc:
        pages_text.append(page.get_text())
    doc.close()
    return "\n".join(pages_text)


# ─── Text Chunking ─────────────────────────────────────────────────────────

def chunk_text(text: str) -> list[str]:
    """Split text into ~300-word chunks with overlap for context."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_text(text)


# ─── Similarity Scoring ────────────────────────────────────────────────────

def compute_similarities(
    chunk_text: str,
    candidate_abstracts: list[str],
    sentence_model,
) -> list[float]:
    """
    Compute cosine similarities between a chunk and candidate abstracts
    using the SentenceTransformer model.
    """
    if not candidate_abstracts:
        return []

    try:
        # Encode all texts in a single batch for efficiency
        all_texts = [chunk_text] + candidate_abstracts
        embeddings = sentence_model.encode(all_texts, convert_to_tensor=True)

        # Cosine similarity between chunk (index 0) and each candidate
        from sentence_transformers.util import cos_sim

        chunk_embedding = embeddings[0:1]
        candidate_embeddings = embeddings[1:]
        similarities = cos_sim(chunk_embedding, candidate_embeddings)[0]

        return [s.item() for s in similarities]

    except Exception as e:
        logger.error(f"Similarity computation failed: {e}")
        return [0.0] * len(candidate_abstracts)


# ─── Main Scanning Pipeline ────────────────────────────────────────────────

async def scan_document(
    file_bytes: bytes,
    sentence_model,
    ai_models: dict,
    sources: Optional[list[str]] = None,
    student_papers_json: Optional[str] = None,
) -> AsyncGenerator[ChunkResult, None]:
    """
    Full scanning pipeline: extract → sanitize → chunk → analyze → yield.

    This is an async generator that yields ChunkResult objects
    one at a time for SSE streaming to the frontend.

    ai_models is a dict containing:
      - classifier_tokenizer: tokenizer for chatgpt-detector-roberta
      - classifier_model: the classifier model
      - perplexity_tokenizer: tokenizer for distilgpt2
      - perplexity_model: the distilgpt2 model
    """
    # Step 1: Extract text from PDF
    logger.info("Extracting text from PDF...")
    # Wrap CPU bound extraction in thread
    raw_text = await asyncio.to_thread(extract_text_from_pdf, file_bytes)

    if not raw_text.strip():
        yield ChunkResult(
            chunk_index=0,
            total_chunks=0,
            text="",
            ai_probability=0.0,
            ai_label="Error",
            is_plagiarized=False,
            max_similarity=0.0,
            sanitization={"error": "No text could be extracted from the PDF"},
        )
        return

    # Step 2: Sanitize
    logger.info("Sanitizing text...")
    report: SanitizationReport = await asyncio.to_thread(sanitize, raw_text)
    clean_text = report.cleaned_text

    sanitization_info = {
        "unicode_normalized": report.unicode_normalized,
        "zero_width_chars_removed": report.zero_width_chars_removed,
        "whitespace_normalized": report.whitespace_normalized,
        "total_chars": len(clean_text),
    }

    # Step 3: Chunk
    logger.info("Chunking text...")
    chunks = chunk_text(clean_text)
    total_chunks = len(chunks)
    logger.info(f"Created {total_chunks} chunks")

    if total_chunks == 0:
        return

    import json
    student_chunks = []
    student_paper_titles = []
    if sources and "student_papers" in sources and student_papers_json:
        try:
            papers = json.loads(student_papers_json)
            for p in papers:
                p_text = p.get("text", "")
                p_title = p.get("title", "Unknown Internal Paper")
                if p_text:
                    p_chunks = chunk_text(p_text)
                    for c in p_chunks:
                        student_chunks.append(c)
                        student_paper_titles.append(p_title)
        except Exception as e:
            logger.error(f"Failed to parse student_papers JSON: {e}")

    # Fire a title search task for the first chunk to find the main paper
    title_search_task = asyncio.create_task(federated_search(chunks[0][:500], sources, is_title_search=True))

    # Pre-fire the search task for chunk 0
    next_search_task = asyncio.create_task(federated_search(chunks[0], sources))

    # Unpack AI models
    classifier_tokenizer = ai_models["classifier_tokenizer"]
    classifier_model = ai_models["classifier_model"]
    perplexity_tokenizer = ai_models["perplexity_tokenizer"]
    perplexity_model = ai_models["perplexity_model"]

    # Step 4: Analyze each chunk
    for i, chunk in enumerate(chunks):
        logger.info(f"Analyzing chunk {i + 1}/{total_chunks}...")

        # Get the search task for the current chunk
        search_task = next_search_task

        # Pre-fire the search task for the next chunk (pipeline parallelism)
        if i + 1 < total_chunks:
            next_search_task = asyncio.create_task(federated_search(chunks[i + 1], sources))
        else:
            next_search_task = None

        # 4a: AI Detection (runs in thread pool to not block asyncio loop)
        ai_task = asyncio.to_thread(
            detect_ai_hybrid,
            chunk,
            classifier_tokenizer,
            classifier_model,
            perplexity_tokenizer,
            perplexity_model,
        )

        # Wait for both CPU AI task and I/O Search task
        (ai_prob, ai_label), search_response = await asyncio.gather(ai_task, search_task)

        # Include title search results in chunk 0 if available
        if i == 0 and title_search_task:
            title_search_response = await title_search_task
            search_response.results.extend(title_search_response.results)

        # 4c: Similarity scoring
        matches: list[MatchInfo] = []
        max_sim = 0.0

        if search_response.results:
            abstracts = [r.abstract for r in search_response.results]
            similarities = await asyncio.to_thread(compute_similarities, chunk, abstracts, sentence_model)

            for search_result, sim_score in zip(search_response.results, similarities):
                if sim_score >= SIMILARITY_THRESHOLD:
                    matches.append(MatchInfo(
                        title=search_result.title,
                        doi=search_result.doi,
                        doi_url=search_result.doi_url,
                        source=search_result.source,
                        similarity=sim_score,
                    ))
                max_sim = max(max_sim, sim_score)

        if student_chunks:
            student_similarities = await asyncio.to_thread(compute_similarities, chunk, student_chunks, sentence_model)
            for s_title, sim_score in zip(student_paper_titles, student_similarities):
                if sim_score >= SIMILARITY_THRESHOLD:
                    matches.append(MatchInfo(
                        title=s_title,
                        doi=None,
                        doi_url=None,
                        source="Internal Repo",
                        similarity=sim_score,
                    ))
                max_sim = max(max_sim, sim_score)

        if matches:
            # Sort matches by similarity descending
            matches.sort(key=lambda m: m.similarity, reverse=True)
            
            # Deduplicate matches by DOI to avoid redundant reporting from title + regular search
            unique_matches = []
            seen_dois = set()
            for m in matches:
                if m.doi:
                    if m.doi in seen_dois:
                        continue
                    seen_dois.add(m.doi)
                unique_matches.append(m)
            matches = unique_matches

        yield ChunkResult(
            chunk_index=i,
            total_chunks=total_chunks,
            text=chunk,
            ai_probability=ai_prob,
            ai_label=ai_label,
            is_plagiarized=len(matches) > 0,
            max_similarity=max_sim,
            matches=matches,
            sanitization=sanitization_info if i == 0 else None,
        )
