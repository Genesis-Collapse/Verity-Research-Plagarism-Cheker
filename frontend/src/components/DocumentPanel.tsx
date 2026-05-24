import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChunkResult, FilterMode } from "@/types";
import PdfViewer from "@/components/PdfViewer";

interface DocumentPanelProps {
  chunks: ChunkResult[];
  activeChunkIndex: number | null;
  onChunkClick: (index: number) => void;
  activePanel: string | null;
  filterMode: FilterMode;
  excludeQuotes: boolean;
  excludeBibliography: boolean;
  ignoreCitations: boolean;
  pdfFile?: File | null;
  currentPage: number;
  totalPages: number;
  onPageCountChange?: (count: number) => void;
  onPageChange?: (page: number) => void;
}

/**
 * Skeleton loading UI — YouTube-style shimmer blocks
 * that match the real studio layout to prime the user's brain.
 */
function SkeletonLoading() {
  return (
    <div className="flex flex-col h-full bg-white animate-[fadeIn_0.3s_ease-out]">
      <div className="flex-1 overflow-hidden">
        <div className="max-w-3xl mx-auto px-10 py-10">
          {/* Title skeleton */}
          <div className="flex flex-col items-center mb-6">
            <div className="skeleton h-5 w-96 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
          <div className="h-px bg-border/40 my-6" />

          {/* Score panel skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="skeleton-dark h-12 w-24 rounded-lg" />
            <div className="skeleton-dark h-12 w-24 rounded-lg" />
            <div className="flex-1" />
            <div className="skeleton h-8 w-32 rounded-md" />
          </div>

          {/* Text lines skeleton — varies widths for realism */}
          {[100, 95, 88, 92, 78, 96, 84, 90, 72, 98, 85, 77, 93, 88, 60].map(
            (width, i) => (
              <div
                key={i}
                className="skeleton h-4 mb-3 rounded"
                style={{
                  width: `${width}%`,
                  animationDelay: `${i * 0.06}s`,
                }}
              />
            )
          )}

          {/* Source cards skeleton */}
          <div className="mt-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-lg border border-border/40"
              >
                <div className="skeleton-dark h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
                <div className="skeleton-dark h-6 w-12 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="h-10 border-t border-border/40 flex items-center justify-between px-6 bg-slate-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-3 w-28" />
        </div>
        <div className="skeleton h-3 w-40" />
      </div>
    </div>
  );
}

/**
 * Text-only chunk view — the original fallback view when PDF rendering
 * fails or is not available.
 */
function TextChunkView({
  processedChunks,
  activeChunkIndex,
  onChunkClick,
  filterMode,
  excludeQuotes,
  excludeBibliography,
  ignoreCitations,
}: {
  processedChunks: Array<{
    index: number;
    text: string;
    isPlagiarized: boolean;
    isAI: boolean;
    aiProb: number;
    maxSim: number;
    hasCitations: boolean;
    isQuote: boolean;
    isBibliography: boolean;
  }>;
  activeChunkIndex: number | null;
  onChunkClick: (index: number) => void;
  filterMode: FilterMode;
  excludeQuotes: boolean;
  excludeBibliography: boolean;
  ignoreCitations: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-10 py-10">
        <div className="text-[15px] leading-[1.85] text-foreground/90 font-normal">
          <AnimatePresence>
            {processedChunks.map((chunk) => {
              const isActive = activeChunkIndex === chunk.index;

              let highlightClass = "";
              let tooltipText = "Clean text — no issues detected";

              // Apply citation ignore filter
              if (ignoreCitations && chunk.hasCitations) {
                return (
                  <motion.span
                    key={chunk.index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: chunk.index * 0.05,
                    }}
                    onClick={() => onChunkClick(chunk.index)}
                    className={`
                      inline cursor-pointer transition-all duration-200
                      ${isActive ? "ring-2 ring-primary/40 rounded-sm shadow-sm" : ""}
                    `}
                    title="Clean text — citations ignored"
                  >
                    {chunk.text}{" "}
                  </motion.span>
                );
              }

              // Backend filter flags
              let showCopied = chunk.isPlagiarized;
              if (excludeQuotes && chunk.isQuote) showCopied = false;
              if (excludeBibliography && chunk.isBibliography) showCopied = false;

              // Filter mode logic
              const showPlagiarism = filterMode === "all" || filterMode === "plagiarism-only";
              const showAI = filterMode === "all" || filterMode === "ai-only";

              if (showCopied && showPlagiarism && (!chunk.isAI || filterMode === "plagiarism-only" || !showAI)) {
                highlightClass = "highlight-plagiarism";
                tooltipText = `Possible Copied Content: ${Math.round(chunk.maxSim * 100)}% similarity`;
              } else if (chunk.isAI && showAI && (!showCopied || filterMode === "ai-only" || !showPlagiarism)) {
                highlightClass = "highlight-ai";
                tooltipText = `AI-Generated: ${Math.round(chunk.aiProb * 100)}% probability`;
              } else if (showCopied && showPlagiarism) {
                // If both are true but the priority went to AI (which shouldn't happen with the strict checks above, but just in case)
                highlightClass = "highlight-plagiarism";
                tooltipText = `Possible Copied Content: ${Math.round(chunk.maxSim * 100)}% similarity`;
              } else if (chunk.isAI && showAI) {
                highlightClass = "highlight-ai";
                tooltipText = `AI-Generated: ${Math.round(chunk.aiProb * 100)}% probability`;
              }

              return (
                <motion.span
                  key={chunk.index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: chunk.index * 0.05,
                  }}
                  onClick={() => onChunkClick(chunk.index)}
                  className={`
                    inline cursor-pointer transition-all duration-200
                    ${highlightClass}
                    ${isActive ? "ring-2 ring-primary/40 rounded-sm shadow-sm" : ""}
                  `}
                  title={tooltipText}
                >
                  {chunk.text}{" "}
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function DocumentPanel({
  chunks,
  activeChunkIndex,
  onChunkClick,
  filterMode,
  excludeQuotes,
  excludeBibliography,
  ignoreCitations,
  pdfFile,
  currentPage,
  totalPages,
  onPageCountChange,
  onPageChange,
}: DocumentPanelProps) {
  const [pdfFailed, setPdfFailed] = useState(false);

  const processedChunks = useMemo(() => {
    return chunks.map((r) => ({
      index: r.chunk_index,
      text: r.full_text,
      isPlagiarized: r.is_plagiarized,
      isAI: r.ai_probability > 0.5,
      aiProb: r.ai_probability,
      maxSim: r.max_similarity,
      hasCitations: /(\[[\d,\s]+\]|\([A-Za-z\s]+,\s\d{4}\)|et al\.)/.test(r.full_text),
      isQuote: r.is_quote || false,
      isBibliography: r.is_bibliography || false,
    }));
  }, [chunks]);

  if (processedChunks.length === 0) {
    return <SkeletonLoading />;
  }

  // Determine if we should show the PDF viewer
  const showPdfViewer = pdfFile && !pdfFailed;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Main content area — either PDF viewer or text chunk view */}
      {showPdfViewer ? (
        <PdfViewer
          file={pdfFile}
          chunks={chunks}
          filterMode={filterMode}
          ignoreCitations={ignoreCitations}
          excludeQuotes={excludeQuotes}
          excludeBibliography={excludeBibliography}
          activeChunkIndex={activeChunkIndex}
          onChunkClick={onChunkClick}
          currentPage={currentPage}
          onPageCountChange={onPageCountChange || (() => {})}
          onPageChange={onPageChange || (() => {})}
        />
      ) : (
        <TextChunkView
          processedChunks={processedChunks}
          activeChunkIndex={activeChunkIndex}
          onChunkClick={onChunkClick}
          filterMode={filterMode}
          excludeQuotes={excludeQuotes}
          excludeBibliography={excludeBibliography}
          ignoreCitations={ignoreCitations}
        />
      )}

      {/* Footer bar & Legend */}
      {/* Footer bar & Legend — elevated for visibility */}
      <div
        className="h-12 flex items-center justify-between px-6 bg-white shrink-0 z-30 border-t border-border/30"
        style={{ boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.08), 0 -1px 4px rgba(0, 0, 0, 0.04)" }}
      >
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500 rounded-[3px]"></div>
            <span className="text-xs font-semibold text-foreground/70">
              Possible Copied Content
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-500 rounded-[3px]"></div>
            <span className="text-xs font-semibold text-foreground/70">
              AI-Generated
            </span>
          </div>
          {showPdfViewer && (
            <button
              onClick={() => setPdfFailed(true)}
              className="text-[11px] text-primary hover:text-primary/80 underline underline-offset-2 transition-colors ml-2 font-medium"
            >
              Switch to text view
            </button>
          )}
          {pdfFailed && pdfFile && (
            <button
              onClick={() => setPdfFailed(false)}
              className="text-[11px] text-primary hover:text-primary/80 underline underline-offset-2 transition-colors ml-2 font-medium"
            >
              Switch to PDF view
            </button>
          )}
        </div>
        <span className="text-xs font-medium text-foreground/60">
          Page {currentPage} of {totalPages} · {chunks.length} text segments
          analyzed
        </span>
      </div>
    </div>
  );
}
