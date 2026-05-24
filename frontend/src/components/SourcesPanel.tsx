import { motion } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import type { ChunkResult } from "@/types";

interface SourcesPanelProps {
  chunks: ChunkResult[];
  onClose: () => void;
}

export default function SourcesPanel({ chunks, onClose }: SourcesPanelProps) {
  // Collect all matches from all chunks
  const allMatches = chunks.flatMap((chunk) =>
    chunk.matches.map((match) => ({
      ...match,
      chunkIndex: chunk.chunk_index,
      chunkText: chunk.text,
    }))
  );

  // Deduplicate by DOI (or title if no DOI)
  const uniqueMatches = allMatches.reduce(
    (acc, match) => {
      const key = match.doi || match.title;
      if (!acc.seen.has(key)) {
        acc.seen.add(key);
        acc.list.push(match);
      }
      return acc;
    },
    { seen: new Set<string>(), list: [] as typeof allMatches }
  ).list;

  // Sort by similarity descending
  uniqueMatches.sort((a, b) => b.similarity - a.similarity);

  return (
    <motion.div
      className="absolute top-0 right-[72px] bottom-0 w-[380px] bg-white border-l border-border shadow-xl z-30 flex flex-col"
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <h3 className="text-base font-semibold text-foreground">
          Match Overview
        </h3>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-muted-foreground transition-colors"
          id="sources-panel-close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {uniqueMatches.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            No matches found in the scanned databases.
          </div>
        ) : (
          <div className="space-y-4">
            {uniqueMatches.map((match, i) => (
              <motion.div
                key={`${match.doi || match.title}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg border border-border/60 hover:border-border hover:shadow-sm transition-all duration-200"
              >
                {/* Source header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-sm font-medium text-foreground leading-snug flex-1">
                    {match.title}
                  </h4>
                  <span className="shrink-0 text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                    {Math.round(match.similarity * 100)}%
                  </span>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Source badge */}
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      match.source === "OpenAlex"
                        ? "bg-orange-50 text-orange-700"
                        : match.source === "Crossref"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-violet-50 text-violet-700"
                    }`}
                  >
                    {match.source}
                  </span>

                  {/* DOI link */}
                  {match.doi_url && (
                    <a
                      href={match.doi_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {match.doi}
                    </a>
                  )}
                </div>

                {/* Matched chunk preview */}
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed italic">
                  "...{match.chunkText}..."
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer summary */}
      <div className="px-5 py-3 border-t border-border/60 bg-slate-50">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {uniqueMatches.length}
          </span>{" "}
          unique sources identified across{" "}
          {chunks.filter((c) => c.is_plagiarized).length} flagged text segments
        </p>
      </div>
    </motion.div>
  );
}
