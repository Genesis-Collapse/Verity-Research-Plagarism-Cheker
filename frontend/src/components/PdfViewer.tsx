/**
 * PdfViewer.tsx — Page-by-page PDF renderer with in-document highlighting
 *
 * Uses pdfjs-dist to render every PDF page as a <canvas> with a text layer
 * overlay. After rendering, searches the text layer spans for chunk text
 * matches and applies CSS highlight classes (red = plagiarism, blue = AI).
 *
 * Key design decisions:
 * - Renders ALL pages eagerly (most academic PDFs are <50 pages) to avoid
 *   janky scroll caused by lazy height mismatches.
 * - Sets each page container to the exact aspect ratio from the PDF viewport
 *   BEFORE rendering, so scroll position stays stable.
 * - Uses IntersectionObserver purely for page tracking, not lazy loading.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { TextLayer } from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type { ChunkResult, FilterMode } from "@/types";

// Configure the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  file: File;
  chunks: ChunkResult[];
  filterMode: FilterMode;
  ignoreCitations: boolean;
  excludeQuotes: boolean;
  excludeBibliography: boolean;
  activeChunkIndex: number | null;
  onChunkClick: (index: number) => void;
  currentPage: number;
  onPageCountChange: (count: number) => void;
  onPageChange: (page: number) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Normalize text for fuzzy substring matching between chunk text
 * and PDF text layer content.
 */
function normalizeText(text: string): string {
  return text
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Given a list of text layer <span> elements and a search string,
 * find spans whose combined text contains a substring match.
 * Returns the matched DOM spans.
 */
function findMatchingSpans(
  spans: HTMLElement[],
  searchText: string,
  minMatchLength = 30
): HTMLElement[] {
  if (!searchText || searchText.length < minMatchLength) return [];

  const normalizedSearch = normalizeText(searchText);
  if (normalizedSearch.length < 20) return [];

  // Use first ~80 chars as the search key (enough to uniquely identify)
  const searchKey = normalizedSearch.slice(0, 80);
  const matched: HTMLElement[] = [];

  // Build a running text from consecutive spans and check for matches
  for (let start = 0; start < spans.length; start++) {
    let combinedText = "";
    for (let end = start; end < Math.min(start + 40, spans.length); end++) {
      combinedText += normalizeText(spans[end].textContent || "") + " ";
      if (combinedText.includes(searchKey)) {
        // Found match — collect all spans in this range
        for (let k = start; k <= end; k++) {
          matched.push(spans[k]);
        }
        return matched;
      }
      // Early exit if combined text is already much longer than search
      if (combinedText.length > searchKey.length + 200) break;
    }
  }

  return matched;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function PdfViewer({
  file,
  chunks,
  filterMode,
  ignoreCitations,
  excludeQuotes,
  excludeBibliography,
  activeChunkIndex,
  onChunkClick,
  currentPage,
  onPageCountChange,
  onPageChange,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPagesRendered, setAllPagesRendered] = useState(false);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const textLayerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const lastScrolledPage = useRef(currentPage);

  // ── Load PDF document ──────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        setIsLoading(true);
        setError(null);

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: "/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (cancelled) return;

        setPdfDoc(doc);
        onPageCountChange(doc.numPages);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load PDF:", err);
        setError("Failed to render PDF. Falling back to text view.");
        setIsLoading(false);
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [file, onPageCountChange]);

  // ── Render ALL pages eagerly ───────────────────────────────────────────

  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;

    async function renderAllPages(doc: PDFDocumentProxy) {
      const scale = 1.5;

      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        if (cancelled) return;

        const pageContainer = pageRefs.current.get(pageNum);
        if (!pageContainer || pageContainer.querySelector("canvas")) continue;

        try {
          const page: PDFPageProxy = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          // Set exact dimensions on the container BEFORE rendering
          pageContainer.style.width = `${viewport.width}px`;
          pageContainer.style.height = `${viewport.height}px`;
          pageContainer.style.maxWidth = "100%";
          pageContainer.style.aspectRatio = `${viewport.width} / ${viewport.height}`;

          // Create canvas
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "100%";

          pageContainer.appendChild(canvas);

          // Render the page to canvas
          await page.render({ canvasContext: context, viewport }).promise;

          // Create text layer for selection + highlighting
          const textLayerDiv = document.createElement("div");
          textLayerDiv.className = "pdf-text-layer";
          textLayerDiv.style.width = `${viewport.width}px`;
          textLayerDiv.style.height = `${viewport.height}px`;
          pageContainer.appendChild(textLayerDiv);

          const textContent = await page.getTextContent();
          const textLayer = new TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport,
          });
          await textLayer.render();

          textLayerRefs.current.set(pageNum, textLayerDiv);
        } catch (err) {
          console.error(`Failed to render page ${pageNum}:`, err);
        }
      }

      if (!cancelled) {
        setAllPagesRendered(true);
      }
    }

    renderAllPages(pdfDoc);
    return () => {
      cancelled = true;
    };
  }, [pdfDoc]);

  // ── Apply text highlights based on chunk results ───────────────────────

  useEffect(() => {
    if (!allPagesRendered || !pdfDoc || chunks.length === 0) return;

    // Clear all previous highlights
    textLayerRefs.current.forEach((layerDiv) => {
      const highlighted = layerDiv.querySelectorAll(
        ".pdf-highlight-plag, .pdf-highlight-ai"
      );
      highlighted.forEach((el) => {
        el.classList.remove("pdf-highlight-plag", "pdf-highlight-ai");
        (el as HTMLElement).style.removeProperty("cursor");
        (el as HTMLElement).style.removeProperty("opacity");
      });
    });

    // For each chunk, determine if it should be highlighted
    for (const chunk of chunks) {
      const isPlagiarized = chunk.is_plagiarized;
      const isAI = chunk.ai_probability > 0.5;
      const hasCitations = /(\[[\d,\s]+\]|\([A-Za-z\s]+,\s\d{4}\)|et al\.)/.test(
        chunk.full_text
      );

      if (ignoreCitations && hasCitations) continue;

      let showPlag =
        isPlagiarized &&
        (filterMode === "all" || filterMode === "plagiarism-only");
      let showAi =
        isAI && (filterMode === "all" || filterMode === "ai-only");

      if (excludeQuotes && chunk.max_similarity > 0.8) showPlag = false;
      if (
        excludeBibliography &&
        chunk.max_similarity > 0.7 &&
        chunk.max_similarity <= 0.8
      )
        showPlag = false;

      if (!showPlag && !showAi) continue;

      const highlightClass = showPlag
        ? "pdf-highlight-plag"
        : "pdf-highlight-ai";

      // Search across all text layers to find matching spans
      const textToSearch = chunk.full_text || chunk.text;

      textLayerRefs.current.forEach((layerDiv) => {
        const spans = Array.from(
          layerDiv.querySelectorAll("span")
        ) as HTMLElement[];
        const matchedSpans = findMatchingSpans(spans, textToSearch);

        for (const span of matchedSpans) {
          span.classList.add(highlightClass);
          span.style.opacity = "1";
          span.style.cursor = "pointer";
          span.title = showPlag
            ? `Plagiarism: ${Math.round(chunk.max_similarity * 100)}% match`
            : `AI-Generated: ${Math.round(chunk.ai_probability * 100)}%`;
        }
      });
    }
  }, [
    allPagesRendered,
    pdfDoc,
    chunks,
    filterMode,
    ignoreCitations,
    excludeQuotes,
    excludeBibliography,
  ]);

  // ── IntersectionObserver for page tracking ─────────────────────────────

  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the largest intersection ratio
        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio)
          ) {
            bestEntry = entry;
          }
        }
        if (bestEntry) {
          const pageNum = parseInt(
            (bestEntry.target as HTMLElement).dataset.page || "0"
          );
          if (pageNum > 0) {
            lastScrolledPage.current = pageNum;
            onPageChange(pageNum);
          }
        }
      },
      {
        root: containerRef.current,
        rootMargin: "0px 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Observe after a short delay to let refs populate
    const timer = setTimeout(() => {
      pageRefs.current.forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pdfDoc, onPageChange]);

  // ── Scroll to page when header nav arrows are clicked ──────────────────

  useEffect(() => {
    // Only scroll when page changes from header nav (not from scroll observer)
    if (currentPage === lastScrolledPage.current) return;
    lastScrolledPage.current = currentPage;

    const pageEl = pageRefs.current.get(currentPage);
    if (pageEl && containerRef.current) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentPage]);

  // ── Render ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Rendering PDF…</p>
        </div>
      </div>
    );
  }

  if (error || !pdfDoc) {
    return null; // Parent falls back to text view
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100/60"
      style={{ scrollBehavior: "smooth" }}
    >
      <div className="py-6 flex flex-col items-center gap-6">
        {Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map(
          (pageNum) => (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNum, el);
              }}
              data-page={pageNum}
              className="pdf-page-container"
              style={{
                // Initial placeholder height — replaced when page renders
                minHeight: 600,
                maxWidth: "90%",
                width: "100%",
              }}
            >
              {/* Canvas + text layer injected by renderAllPages */}
            </div>
          )
        )}
      </div>
    </div>
  );
}
