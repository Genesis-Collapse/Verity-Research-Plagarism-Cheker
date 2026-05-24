"""
main.py — FastAPI Application Entry Point

The Originality Engine backend:
- Loads local HuggingFace ML models on startup
- Exposes /api/scan (SSE streaming) for PDF analysis
- Exposes /api/health for status checks
"""

import json
import logging
from contextlib import asynccontextmanager

import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from security.rate_limit import limiter
from security.upload_guard import enforce_upload_guard
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from scanner import scan_document

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ─── Global Model References ───────────────────────────────────────────────

_sentence_model = None
_ai_models = None  # Dict with classifier + perplexity models


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup, release on shutdown."""
    global _sentence_model, _ai_models

    logger.info("=" * 60)
    logger.info("LOADING ML MODELS — this may take a minute on first run...")
    logger.info("=" * 60)

    # 1. Load SentenceTransformer for semantic similarity
    logger.info("Loading SentenceTransformer (all-MiniLM-L6-v2)...")
    from sentence_transformers import SentenceTransformer
    _sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
    logger.info("✓ SentenceTransformer loaded")

    # 2. Load the modern AI classifier: Hello-SimpleAI/chatgpt-detector-roberta
    logger.info("Loading AI Classifier (Hello-SimpleAI/chatgpt-detector-roberta)...")
    from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoModelForCausalLM
    classifier_tokenizer = AutoTokenizer.from_pretrained("Hello-SimpleAI/chatgpt-detector-roberta")
    classifier_model = AutoModelForSequenceClassification.from_pretrained(
        "Hello-SimpleAI/chatgpt-detector-roberta"
    )
    classifier_model.eval()
    logger.info("✓ AI Classifier loaded")

    # 3. Load distilgpt2 for perplexity scoring
    logger.info("Loading Perplexity Model (distilgpt2)...")
    perplexity_tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
    perplexity_model = AutoModelForCausalLM.from_pretrained("distilgpt2")
    perplexity_model.eval()
    logger.info("✓ Perplexity Model loaded")

    # 4. Download NLTK data for sentence tokenization
    logger.info("Downloading NLTK punkt_tab tokenizer...")
    import nltk
    nltk.download("punkt_tab", quiet=True)
    logger.info("✓ NLTK punkt_tab downloaded")

    # Pack all AI models into a dict for scanner.py
    _ai_models = {
        "classifier_tokenizer": classifier_tokenizer,
        "classifier_model": classifier_model,
        "perplexity_tokenizer": perplexity_tokenizer,
        "perplexity_model": perplexity_model,
    }

    logger.info("=" * 60)
    logger.info("ALL MODELS LOADED — Server ready!")
    logger.info("=" * 60)

    yield

    # Cleanup
    logger.info("Shutting down — releasing models...")
    _sentence_model = None
    _ai_models = None


# ─── FastAPI App ────────────────────────────────────────────────────────────

app = FastAPI(
    title="The Originality Engine",
    description="Federated plagiarism & AI-text detection engine",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# CORS — strict CORS using FRONTEND_URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response

app.add_middleware(SecurityHeadersMiddleware)


# ─── Health Endpoint ────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    """Check if the server and models are loaded."""
    return {
        "status": "ok",
        "models_loaded": all([
            _sentence_model is not None,
            _ai_models is not None,
        ]),
    }


# ─── Scan Endpoint (SSE Streaming) ─────────────────────────────────────────

@app.post("/api/scan")
@limiter.limit("5/hour")
async def scan(
    request: Request,
    file: UploadFile = File(...),
    student_papers: str = Form(None),
    config: str = Form(None)
):
    """
    Upload a PDF and receive Server-Sent Events (SSE) with
    per-chunk analysis results streamed in real time.

    Each SSE event is a JSON object containing:
    - chunk_index, total_chunks
    - text (preview), full_text
    - ai_probability, ai_label
    - is_plagiarized, max_similarity
    - matches (list of {title, doi, doi_url, source, similarity})
    - sanitization (only on first chunk)
    """
    # Security checks
    await enforce_upload_guard(file)

    # Validate models are loaded
    if not all([_sentence_model, _ai_models]):
        raise HTTPException(
            status_code=503,
            detail="Models are still loading. Please try again in a moment.",
        )

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    # Max file size handled by upload_guard
        
    # Parse config
    sources = None
    if config:
        try:
            config_dict = json.loads(config)
            sources = config_dict.get("sources")
        except json.JSONDecodeError:
            logger.warning("Failed to parse config JSON")

    async def event_stream():
        """Generate SSE events from the scanning pipeline."""
        try:
            async for chunk_result in scan_document(
                file_bytes, _sentence_model, _ai_models, sources, student_papers
            ):
                data = json.dumps(chunk_result.to_dict())
                yield f"data: {data}\n\n"
        except Exception as e:
            logger.error(f"Scan error: {e}", exc_info=True)
            error_data = json.dumps({
                "error": str(e),
                "chunk_index": -1,
                "total_chunks": 0,
            })
            yield f"data: {error_data}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Run directly ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
