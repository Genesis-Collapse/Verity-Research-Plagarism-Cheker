# Project: The Originality Engine (Federated Enterprise Edition)
**Objective:** Build a Turnitin-style web app capable of analyzing full research papers for plagiarism and AI-generation. 
**Strict Constraints:** 
1. Use only deterministic, locally hosted open-source models for ML analysis (NO black-box LLMs). 
2. Use a **Federated Search Architecture**: concurrently query OpenAlex, Crossref, and CORE APIs to cross-reference text without relying on a single point of failure or hitting rate limits.

## 1. Tech Stack
*   **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
*   **UI/Animations:** shadcn/ui, Framer Motion, `react-dropzone`
*   **Backend:** FastAPI, Python 3.10+
*   **Async Networking:** `httpx` and `asyncio` (Crucial for concurrent API fetching)
*   **Document Processing:** `PyMuPDF` (fitz), `langchain-text-splitters`
*   **ML Models (Local & Deterministic):** 
    *   `sentence-transformers` (`all-MiniLM-L6-v2`) for semantic similarity math.
    *   `transformers` (`roberta-base-openai-detector`) for robust AI-generation classification.

## 2. Project Architecture & Layout
*   **Left Panel (Input & Viewer):**
    *   Drag-and-drop zone for PDF files.
    *   Transitions into a minimalist PDF text viewer highlighting flagged sentences in red (Plagiarism) or purple (AI-Generated).
*   **Right Panel (Live Auto-Scanner Dashboard):**
    *   **Defense Module:** Live checklist showing sanitization (Unicode Normalization, Zero-Width stripping).
    *   **Live Scanning Feed:** Streams results chunk-by-chunk using Server-Sent Events (SSE). 
    *   **Detection Cards:** Shows exact cosine similarity scores mapped to real-world DOIs, indicating which database (OpenAlex/Crossref/CORE) found the match.

## 3. Backend Specification (FastAPI)
Create a `backend/` directory.

**A. Initialization & Local Models:**
*   Initialize FastAPI with CORS and `python-multipart`.
*   On startup, load the local Hugging Face models into memory (`all-MiniLM-L6-v2` and `roberta-base-openai-detector`).

**B. The Sanitizer Utility:**
*   Create `sanitize(text)`: Normalize Unicode (NFKC) and strip zero-width spaces (`\u200B-\u200D`) to crush adversarial homoglyph injections.

**C. The Federated Search Engine (`search.py`):**
*   Create an async function that extracts the top 5 keywords from a chunk of text.
*   Use `httpx.AsyncClient` and `asyncio.gather()` to fire concurrent requests to:
    1.  **OpenAlex:** `https://api.openalex.org/works?search={keywords}&mailto=hackathon@example.com`
    2.  **Crossref:** `https://api.crossref.org/works?query={keywords}&mailto=hackathon@example.com`
    3.  **CORE:** `https://api.core.ac.uk/v3/search/works?q={keywords}` (if a free API key was obtained, otherwise skip to 1 and 2).
*   Parse the JSON responses, extract the abstracts and DOIs, and combine them into a single, deduplicated list of target texts.

**D. The Core Scanning Endpoint (SSE Streaming):**
*   `POST /api/scan`: 
    *   *Step 1:* Extract text via `PyMuPDF` and sanitize.
    *   *Step 2:* Use LangChain's `RecursiveCharacterTextSplitter` to chunk the text into 300-word blocks.
    *   *Step 3 (For each chunk - ASYNC):* 
        *   **AI Detection:** Pass chunk to the local `roberta-base-openai-detector`. Get probability score.
        *   **Plagiarism Search:** Call the Federated Search Engine to get real-world abstracts.
        *   **Similarity Math:** Use the `SentenceTransformer` to encode the chunk and the retrieved abstracts. Calculate Cosine Similarity. If similarity > 0.75, flag as plagiarized.
    *   *Step 4:* Yield the JSON payload for the chunk via `StreamingResponse` (SSE) back to the frontend.

## 4. Frontend Specification (React/Vite)
Create a `frontend/` directory.

**A. Core Components:**
*   `App.tsx`: Manages the split-screen layout.
*   `Uploader.tsx`: Uses `react-dropzone`.
*   `ScannerDashboard.tsx`: Listens to the SSE stream.

**B. The Streaming UI Experience:**
*   Do not wait for the whole file to process. As FastAPI yields results for each chunk, use Framer Motion to slide new "Result Cards" into the right panel.
*   Each Result Card must show the exact math: e.g., *"Similarity: 82% | Match found via OpenAlex | [DOI Link]"* or *"AI Probability: 94%"*.
*   Map the chunk's index back to the left panel to apply red/purple highlight overlays dynamically.

## 5. Execution Plan for AI Agent
1.  **Initialize Project:** Scaffold Vite frontend and FastAPI backend. Install dependencies: `fastapi`, `uvicorn`, `python-multipart`, `pymupdf`, `langchain-text-splitters`, `sentence-transformers`, `transformers`, `torch`, `httpx`, `asyncio`.
2.  **Build Local ML Engine:** Write the startup events in `main.py` to cache the local Hugging Face models.
3.  **Build Federated Search:** Implement the async fetching logic in `search.py` using `httpx.AsyncClient` to hit OpenAlex and Crossref concurrently.
4.  **Create the Streaming Endpoint:** Wire the `/api/scan` route to tie together the chunking, ML inference, and federated search, returning a `StreamingResponse`. 
5.  **Build Frontend UI:** Setup Tailwind, Shadcn components, and the drag-and-drop zone.
6.  **Consume the Stream:** Implement the frontend SSE listener (`EventSource` or Fetch API with a reader) to dynamically highlight text and spawn result cards.
