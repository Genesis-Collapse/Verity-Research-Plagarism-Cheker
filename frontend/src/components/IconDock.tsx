import { useState } from "react";
import {
  Filter,
  Info,
  Download,
  Bot,
  Loader2,
} from "lucide-react";

import type { ScanStatus, FilterMode } from "@/types";

interface IconDockProps {
  similarityScore: number;
  aiDisplay: string;
  activePanel: string | null;
  onTogglePanel: (panel: string) => void;
  onOpenInfo: () => void;
  onToggleDownload: () => void;
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  excludeQuotes: boolean;
  excludeBibliography: boolean;
  ignoreCitations: boolean;
  onToggleExcludeQuotes: () => void;
  onToggleExcludeBibliography: () => void;
  onToggleIgnoreCitations: () => void;
  scanStatus?: ScanStatus;
}

export default function IconDock({
  similarityScore,
  aiDisplay,
  activePanel,
  onTogglePanel,
  onOpenInfo,
  onToggleDownload,
  filterMode,
  onFilterModeChange,
  excludeQuotes,
  excludeBibliography,
  ignoreCitations,
  onToggleExcludeQuotes,
  onToggleExcludeBibliography,
  onToggleIgnoreCitations,
  scanStatus = "complete",
}: IconDockProps) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  return (
    <div className="flex flex-col items-center py-3 gap-2 h-full custom-scrollbar">
      {/* ── Similarity Score (RED) ────────────────────────────── */}
      <DockIcon
        tooltip="Copied Content Report — Click to view sources"
        active={activePanel === "sources"}
        onClick={() => onTogglePanel("sources")}
        variant="red"
        id="dock-similarity"
      >
        <div className="text-center leading-tight">
          {scanStatus === "scanning" || scanStatus === "uploading" ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            <div className="text-[13px] font-bold">{similarityScore}%</div>
          )}
        </div>
      </DockIcon>

      {/* ── Filter (RED) ─────────────────────────────────────── */}
      <div className="relative">
        <DockIcon
          tooltip="Filter — View mode & exclusions"
          active={showFilterDropdown}
          onClick={() => setShowFilterDropdown((p) => !p)}
          variant="red"
          id="dock-filter"
        >
          <Filter className="w-5 h-5" />
        </DockIcon>

        {/* Filter dropdown */}
        {showFilterDropdown && (
          <div className="absolute right-full top-0 mr-2 w-64 bg-white border border-border rounded-lg shadow-lg py-2 z-50">
            {/* View Mode Section */}
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              View Mode
            </div>
            {([
              { value: "all" as FilterMode, label: "View All" },
              { value: "plagiarism-only" as FilterMode, label: "View Plagiarism Only" },
              { value: "ai-only" as FilterMode, label: "View AI Only" },
            ]).map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="filterMode"
                  checked={filterMode === option.value}
                  onChange={() => onFilterModeChange(option.value)}
                  className="w-4 h-4 border-border text-primary focus:ring-primary/30 cursor-pointer accent-primary"
                />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            ))}

            <hr className="my-2 border-border/50" />

            {/* Exclusions Section */}
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Exclude from results
            </div>
            <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={excludeQuotes}
                onChange={onToggleExcludeQuotes}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer accent-primary"
              />
              <span className="text-sm text-foreground">Quotes</span>
            </label>
            <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={excludeBibliography}
                onChange={onToggleExcludeBibliography}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer accent-primary"
              />
              <span className="text-sm text-foreground">Bibliography</span>
            </label>
            <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={ignoreCitations}
                onChange={onToggleIgnoreCitations}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer accent-primary"
              />
              <span className="text-sm text-foreground">Ignore citations</span>
            </label>
          </div>
        )}
      </div>

      <div className="h-px w-8 bg-border/60 my-1" />

      {/* ── AI Detection (BLUE) ──────────────────────────────── */}
      <DockIcon
        tooltip={
          aiDisplay === "* %"
            ? "AI Detection — Score below 10%, displayed as asterisk per policy"
            : `AI Detection — ${aiDisplay} AI probability`
        }
        active={activePanel === "ai"}
        onClick={() => onTogglePanel("ai")}
        variant="blue"
        id="dock-ai"
      >
        <div className="text-center leading-tight">
          {scanStatus === "scanning" || scanStatus === "uploading" ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            <>
              <Bot className="w-4 h-4 mx-auto mb-0.5" />
              <div className="text-[11px] font-bold">{aiDisplay}</div>
            </>
          )}
        </div>
      </DockIcon>

      <div className="h-px w-8 bg-border/60 my-1" />

      {/* ── Document Info (GREY) ─────────────────────────────── */}
      <DockIcon
        tooltip="Document Details"
        active={false}
        onClick={onOpenInfo}
        variant="grey"
        id="dock-info"
      >
        <Info className="w-5 h-5" />
      </DockIcon>

      {/* ── Download / Receipts (GREY) ────────────────────────── */}
      <DockIcon
        tooltip="Download / Receipts"
        active={false}
        onClick={onToggleDownload}
        variant="grey"
        id="dock-download"
      >
        <Download className="w-5 h-5" />
      </DockIcon>
    </div>
  );
}

// ─── Dock Icon Button ───────────────────────────────────────────────────────

function DockIcon({
  children,
  tooltip,
  active,
  onClick,
  variant,
  id,
}: {
  children: React.ReactNode;
  tooltip: string;
  active: boolean;
  onClick: () => void;
  variant: "red" | "blue" | "grey";
  id: string;
}) {
  const baseClasses =
    "w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 relative group";

  const variantClasses = {
    red: active
      ? "bg-red-600 text-white shadow-md"
      : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/60",
    blue: active
      ? "bg-blue-600 text-white shadow-md"
      : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60",
    grey: active
      ? "bg-slate-700 text-white shadow-md"
      : "bg-white text-slate-500 hover:bg-slate-100 border border-border",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
      title={tooltip}
      id={id}
    >
      {children}
      {/* Tooltip */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-foreground text-white text-xs px-3 py-2 rounded-md shadow-lg w-max max-w-xs text-left">
          {tooltip}
        </div>
      </div>
    </button>
  );
}
