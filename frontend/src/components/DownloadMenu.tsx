import { useState } from "react";
import { motion } from "framer-motion";
import { X, FileText, Receipt, File as FileIcon, Download, Loader2 } from "lucide-react";
import { generateReport, generateReceipt } from "@/lib/reportGenerator";
import type { ChunkResult } from "@/types";

interface DownloadMenuProps {
  onClose: () => void;
  chunks: ChunkResult[];
  file?: File;
  stats: {
    totalChunks: number;
    plagiarizedCount: number;
    aiCount: number;
    overallSimilarityPercent: number;
    overallAiPercent: number;
  };
}

export default function DownloadMenu({ onClose, chunks, file, stats }: DownloadMenuProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleCurrentView = async () => {
    if (chunks.length === 0) return;
    setGeneratingId("download-current-view");
    try {
      await generateReport(chunks, stats, file?.name || "document.pdf");
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGeneratingId(null);
      onClose();
    }
  };

  const handleReceipt = async () => {
    if (!file || chunks.length === 0) return;
    setGeneratingId("download-receipt");
    try {
      await generateReceipt(chunks, stats, file);
    } catch (err) {
      console.error("Failed to generate receipt:", err);
    } finally {
      setGeneratingId(null);
      onClose();
    }
  };

  const handleOriginal = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  const options = [
    {
      icon: FileText,
      label: "Current View",
      description: "PDF snapshot of the highlighted document",
      id: "download-current-view",
      onClick: handleCurrentView,
      disabled: chunks.length === 0,
    },
    {
      icon: Receipt,
      label: "Digital Receipt",
      description: "Watermarked verification receipt",
      id: "download-receipt",
      onClick: handleReceipt,
      disabled: !file || chunks.length === 0,
    },
    {
      icon: FileIcon,
      label: "Originally Submitted File",
      description: "Download the uploaded PDF",
      id: "download-original",
      onClick: handleOriginal,
      disabled: !file,
    },
  ];

  return (
    <motion.div
      className="absolute bottom-20 right-[84px] z-50"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop to catch outside clicks */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu card */}
      <div className="relative z-50 bg-white border border-border rounded-xl shadow-xl w-72 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Download
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-muted-foreground transition-colors"
            id="download-menu-close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Options */}
        <div className="py-1">
          {options.map((option) => (
            <button
              key={option.id}
              id={option.id}
              onClick={option.onClick}
              disabled={option.disabled || generatingId !== null}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${
                option.disabled ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                {generatingId === option.id ? (
                  <Loader2 className="w-4.5 h-4.5 text-blue-600 animate-spin" />
                ) : (
                  <option.icon className="w-4.5 h-4.5 text-blue-600" />
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-primary block">
                  {generatingId === option.id ? "Generating..." : option.label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
