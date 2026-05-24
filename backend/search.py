"""
search.py — 8-API Federated Academic Search Engine

Concurrently queries 8 free academic and general databases:
  1. OpenAlex
  2. Crossref
  3. Semantic Scholar
  4. CORE
  5. arXiv (XML response)
  6. Europe PMC
  7. Wikipedia
  8. BASE

Results are deduplicated by DOI and returned as a flat list of
candidate texts for similarity comparison.
"""

import re
import logging
import xml.etree.ElementTree as ET
from collections import Counter
from dataclasses import dataclass, field
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ─── Configuration ──────────────────────────────────────────────────────────

MAILTO = "hackathon@example.com"
OPENALEX_BASE = "https://api.openalex.org/works"
CROSSREF_BASE = "https://api.crossref.org/works"
SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1/paper/search"
CORE_BASE = "https://api.core.ac.uk/v3/search/works"
ARXIV_BASE = "http://export.arxiv.org/api/query"
EUROPEPMC_BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
WIKIPEDIA_BASE = "https://en.wikipedia.org/w/api.php"
BASE_SEARCH_BASE = "https://api.base-search.net/cgi-bin/BaseHttpSearchInterface.fcgi"

REQUEST_TIMEOUT = 20.0  # seconds per API call
MAX_RESULTS_PER_SOURCE = 10

# Common English stop words for keyword extraction
_STOP_WORDS = frozenset({
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "not", "no", "nor",
    "so", "if", "then", "than", "that", "this", "these", "those", "it",
    "its", "as", "into", "about", "up", "out", "also", "very", "just",
    "more", "most", "such", "each", "every", "all", "any", "both", "few",
    "other", "some", "our", "we", "they", "them", "their", "which", "what",
    "when", "where", "how", "who", "whom", "there", "here", "after",
    "before", "between", "through", "during", "above", "below", "over",
    "under", "again", "further", "once", "only", "own", "same", "too",
    "while", "because", "until", "upon", "however", "although", "yet",
    "since", "whether", "among", "within", "without", "across", "against",
    "along", "around", "well", "still", "even", "much", "many", "several",
    "often", "never", "always", "already", "rather", "quite", "using",
    "based", "used", "using", "study", "paper", "research", "results",
    "method", "approach", "proposed", "show", "shown", "shows",
})


@dataclass
class SearchResult:
    """A single academic work returned from a federated search."""
    title: str
    abstract: str
    doi: Optional[str]
    source: str  # Name of the source API

    @property
    def doi_url(self) -> Optional[str]:
        if self.doi:
            return f"https://doi.org/{self.doi}"
        return None


@dataclass
class FederatedSearchResponse:
    """Aggregated, deduplicated results from all queried APIs."""
    results: list[SearchResult] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def extract_keywords(text: str, top_n: int = 5) -> list[str]:
    """
    Extract the top N keywords from a chunk of text using
    simple term-frequency analysis (no external dependencies).

    Filters out stop words and short tokens, then returns
    the most frequent meaningful terms.
    """
    # Tokenize: lowercase, keep only alphabetic tokens >= 4 chars
    tokens = re.findall(r"[a-zA-Z]{4,}", text.lower())
    # Filter stop words
    meaningful = [t for t in tokens if t not in _STOP_WORDS]

    if not meaningful:
        # Fallback: use first few long words from original text
        fallback = re.findall(r"[a-zA-Z]{3,}", text.lower())
        return fallback[:top_n]

    # Count frequencies and return top N
    freq = Counter(meaningful)
    return [word for word, _ in freq.most_common(top_n)]


# ─── API Fetchers (Original 4) ──────────────────────────────────────────────

async def _fetch_openalex(
    client: httpx.AsyncClient, query: str
) -> list[SearchResult]:
    """Query OpenAlex for works matching the given keywords."""
    params = {
        "search": query,
        "mailto": MAILTO,
        "per_page": MAX_RESULTS_PER_SOURCE,
    }
    try:
        resp = await client.get(OPENALEX_BASE, params=params, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for work in data.get("results", []):
            abstract = _reconstruct_openalex_abstract(
                work.get("abstract_inverted_index")
            )
            if not abstract:
                continue

            doi_raw = work.get("doi", "") or ""
            doi = doi_raw.replace("https://doi.org/", "").strip() or None

            results.append(SearchResult(
                title=work.get("title", "Untitled") or "Untitled",
                abstract=abstract,
                doi=doi,
                source="OpenAlex",
            ))
        return results

    except Exception as e:
        logger.warning(f"OpenAlex query failed: {e}")
        return []


def _reconstruct_openalex_abstract(
    inverted_index: Optional[dict],
) -> str:
    if not inverted_index:
        return ""
    word_positions: list[tuple[int, str]] = []
    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))
    word_positions.sort(key=lambda x: x[0])
    return " ".join(word for _, word in word_positions)


async def _fetch_crossref(
    client: httpx.AsyncClient, query: str
) -> list[SearchResult]:
    """Query Crossref for works matching the given keywords."""
    params = {
        "query": query,
        "mailto": MAILTO,
        "rows": MAX_RESULTS_PER_SOURCE,
    }
    try:
        resp = await client.get(CROSSREF_BASE, params=params, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("message", {}).get("items", []):
            abstract = item.get("abstract", "")
            if not abstract:
                continue

            abstract = re.sub(r"<[^>]+>", "", abstract).strip()
            if not abstract:
                continue

            doi = item.get("DOI")
            title_list = item.get("title", ["Untitled"])
            title = title_list[0] if title_list else "Untitled"

            results.append(SearchResult(
                title=title,
                abstract=abstract,
                doi=doi,
                source="Crossref",
            ))
        return results

    except Exception as e:
        logger.warning(f"Crossref query failed: {e}")
        return []


async def _fetch_semantic_scholar(
    client: httpx.AsyncClient, query: str
) -> list[SearchResult]:
    """Query Semantic Scholar for works matching the given keywords."""
    params = {
        "query": query,
        "limit": MAX_RESULTS_PER_SOURCE,
        "fields": "title,abstract,externalIds"
    }
    try:
        resp = await client.get(SEMANTIC_SCHOLAR_BASE, params=params, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("data", []):
            abstract = item.get("abstract")
            if not abstract:
                continue

            doi = item.get("externalIds", {}).get("DOI")
            title = item.get("title", "Untitled")

            results.append(SearchResult(
                title=title,
                abstract=abstract,
                doi=doi,
                source="Semantic Scholar",
            ))
        return results

    except Exception as e:
        logger.warning(f"Semantic Scholar query failed: {e}")
        return []


async def _fetch_core(
    client: httpx.AsyncClient, query: str
) -> list[SearchResult]:
    """Query CORE for works matching the given keywords."""
    params = {
        "q": query,
        "limit": MAX_RESULTS_PER_SOURCE,
    }
    try:
        resp = await client.get(CORE_BASE, params=params, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("results", []):
            abstract = item.get("abstract")
            if not abstract:
                continue

            doi = item.get("doi")
            title = item.get("title", "Untitled")

            results.append(SearchResult(
                title=title,
                abstract=abstract,
                doi=doi,
                source="CORE",
            ))
        return results

    except Exception as e:
        logger.warning(f"CORE query failed: {e}")
        return []


# ─── API Fetchers (New 4) ───────────────────────────────────────────────────

async def _fetch_arxiv(
    client: httpx.AsyncClient, query: str
) -> list[SearchResult]:
    """
    Query arXiv API (Atom XML response).
    Parses the XML to extract title, abstract (summary), and DOI.
    """
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": MAX_RESULTS_PER_SOURCE,
    }
    try:
        resp = await client.get(ARXIV_BASE, params=params, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()

        # Parse XML
        root = ET.fromstring(resp.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}

        results = []
        for entry in root.findall("atom:entry", ns):
            title_el = entry.find("atom:title", ns)
            summary_el = entry.find("atom:summary", ns)

            title = title_el.text.strip() if title_el is not None and title_el.text else "Untitled"
            abstract = summary_el.text.strip() if summary_el is not None and summary_el.text else ""

            if not abstract:
                continue

            # Clean up multiline title/abstract
            title = re.sub(r"\s+", " ", title)
            abstract = re.sub(r"\s+", " ", abstract)

            # Extract arXiv ID as pseudo-DOI
            id_el = entry.find("atom:id", ns)
            arxiv_id = None
            if id_el is not None and id_el.text:
                # e.g., "http://arxiv.org/abs/2301.12345v1"
                arxiv_id = id_el.text.strip().split("/abs/")[-1]

            # Check for actual DOI in links
            doi = None
            for link in entry.findall("atom:link", ns):
                href = link.get("href", "")
                if "doi.org" in href:
                    doi = href.replace("https://doi.org/", "").replace("http://doi.org/", "")
                    break

            results.append(SearchResult(
                title=title,
                abstract=abstract,
                doi=doi or (f"arXiv:{arxiv_id}" if arxiv_id else None),
                source="arXiv",
            ))

        return results

    except Exception as e:
        logger.warning(f"arXiv query failed: {e}")
        return []


async def _fetch_europepmc(
    client: httpx.AsyncClient, query: str
) -> list[SearchResult]:
    """Query Europe PMC for works matching the given keywords."""
    params = {
        "query": query,
        "format": "json",
        "pageSize": MAX_RESULTS_PER_SOURCE,
        "resultType": "core",  # Include abstracts
    }
    try:
        resp = await client.get(EUROPEPMC_BASE, params=params, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("resultList", {}).get("result", []):
            abstract = item.get("abstractText", "")
            if not abstract:
                continue

            doi = item.get("doi")
            title = item.get("title", "Untitled")

            results.append(SearchResult(
                title=title,
                abstract=abstract,
                doi=doi,
                source="Europe PMC",
            ))
        return results

    except Exception as e:
        logger.warning(f"Europe PMC query failed: {e}")
        return []


async def _fetch_wikipedia(
    client: httpx.AsyncClient, query: str
) -> list[SearchResult]:
    """
    Query Wikipedia's search API.
    Returns search result snippets as 'abstracts' for comparison.
    """
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "format": "json",
        "srlimit": MAX_RESULTS_PER_SOURCE,
        "srprop": "snippet|titlesnippet",
    }
    try:
        resp = await client.get(WIKIPEDIA_BASE, params=params, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("query", {}).get("search", []):
            snippet = item.get("snippet", "")
            if not snippet:
                continue

            # Remove HTML tags from snippet
            abstract = re.sub(r"<[^>]+>", "", snippet).strip()
            if len(abstract) < 50:
                continue

            title = item.get("title", "Untitled")

            results.append(SearchResult(
                title=f"Wikipedia: {title}",
                abstract=abstract,
                doi=None,
                source="Wikipedia",
            ))
        return results

    except Exception as e:
        logger.warning(f"Wikipedia query failed: {e}")
        return []


async def _fetch_base(
    client: httpx.AsyncClient, query: str
) -> list[SearchResult]:
    """Query BASE (Bielefeld Academic Search Engine) for matching works."""
    params = {
        "func": "PerformSearch",
        "query": query,
        "format": "json",
        "hits": MAX_RESULTS_PER_SOURCE,
    }
    try:
        resp = await client.get(BASE_SEARCH_BASE, params=params, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        results = []
        response_data = data.get("response", {})
        docs = response_data.get("docs", [])

        for item in docs:
            # BASE uses different field names
            abstract = ""
            if "dcdescription" in item:
                desc = item["dcdescription"]
                if isinstance(desc, list):
                    abstract = " ".join(desc)
                else:
                    abstract = str(desc)

            if not abstract or len(abstract) < 50:
                continue

            title = ""
            if "dctitle" in item:
                t = item["dctitle"]
                title = t[0] if isinstance(t, list) else str(t)
            title = title or "Untitled"

            doi = None
            if "dcidentifier" in item:
                ids = item["dcidentifier"]
                if isinstance(ids, list):
                    for id_val in ids:
                        if isinstance(id_val, str) and "doi.org" in id_val:
                            doi = id_val.replace("https://doi.org/", "").replace("http://doi.org/", "")
                            break

            results.append(SearchResult(
                title=title,
                abstract=abstract[:2000],  # Cap abstract length
                doi=doi,
                source="BASE",
            ))
        return results

    except Exception as e:
        logger.warning(f"BASE query failed: {e}")
        return []


# ─── Main Federated Search ──────────────────────────────────────────────────

async def federated_search(
    text_chunk: str, 
    sources: Optional[list[str]] = None,
    is_title_search: bool = False
) -> FederatedSearchResponse:
    """
    Execute a federated search across up to 8 databases.

    1. Extract keywords or use the full chunk if it's a title search.
    2. Fire concurrent requests to all selected APIs.
    3. Deduplicate results by DOI.
    4. Return the combined result set.
    """
    import asyncio

    if is_title_search:
        query = text_chunk
        logger.info(f"Federated title search: {query}")
    else:
        keywords = extract_keywords(text_chunk, top_n=8)  # Increased top_n for better recall
        if not keywords:
            return FederatedSearchResponse(
                errors=["No meaningful keywords extracted from chunk"]
            )
        query = " ".join(keywords)
        logger.info(f"Federated search keywords: {query}")

    response = FederatedSearchResponse()

    async with httpx.AsyncClient() as client:
        tasks = []
        
        # Default sources if none specified
        if not sources or len(sources) == 0:
            sources = [
                "openalex", "crossref", "semantic_scholar", "core",
                "arxiv", "europepmc", "wikipedia", "base"
            ]
            
        sources_lower = [s.lower() for s in sources]
        
        # Original 4 sources
        if "openalex" in sources_lower or "periodicals" in sources_lower:
            tasks.append(_fetch_openalex(client, query))
        if "crossref" in sources_lower or "periodicals" in sources_lower:
            tasks.append(_fetch_crossref(client, query))
        if "semantic_scholar" in sources_lower or "periodicals" in sources_lower:
            tasks.append(_fetch_semantic_scholar(client, query))
        if "core" in sources_lower or "periodicals" in sources_lower:
            tasks.append(_fetch_core(client, query))
        
        # New 4 sources
        if "arxiv" in sources_lower or "periodicals" in sources_lower:
            tasks.append(_fetch_arxiv(client, query))
        if "europepmc" in sources_lower or "periodicals" in sources_lower:
            tasks.append(_fetch_europepmc(client, query))
        if "wikipedia" in sources_lower or "internet" in sources_lower:
            tasks.append(_fetch_wikipedia(client, query))
        if "base" in sources_lower or "periodicals" in sources_lower:
            tasks.append(_fetch_base(client, query))
            
        if not tasks:
            return response

        results = await asyncio.gather(*tasks, return_exceptions=True)

    # Collect results and errors
    seen_dois: set[str] = set()
    for result_or_error in results:
        if isinstance(result_or_error, Exception):
            response.errors.append(str(result_or_error))
            continue
        for sr in result_or_error:
            # Deduplicate by DOI
            if sr.doi:
                if sr.doi in seen_dois:
                    continue
                seen_dois.add(sr.doi)
            response.results.append(sr)

    logger.info(
        f"Federated search returned {len(response.results)} results "
        f"({len(response.errors)} errors)"
    )
    return response
