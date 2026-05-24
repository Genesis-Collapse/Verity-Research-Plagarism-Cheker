import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DocumentPanel from "@/components/DocumentPanel";
import IconDock from "@/components/IconDock";
import SourcesPanel from "@/components/SourcesPanel";
import SubmissionDetailsModal from "@/components/SubmissionDetailsModal";
import DownloadMenu from "@/components/DownloadMenu";
import { computeMockStats } from "@/data/mockData";
import type { ChunkResult, ScanStatus, FilterMode, ScanConfig } from "@/types";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function FeedbackStudio() {
  const navigate = useNavigate();
  const location = useLocation();
  const file: File | undefined = location.state?.file;
  const scanConfig: ScanConfig | undefined = location.state?.config;
  const { currentUser } = useAuth();

  const [chunks, setChunks] = useState<ChunkResult[]>([]);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Page tracking
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [details, setDetails] = useState({
    submissionId: "N/A",
    dateTime: new Date().toLocaleString(),
    fileName: file?.name || "Unknown",
    fileExtension: file?.name.split('.').pop() || "pdf",
    fileSize: file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "0 MB",
    pageCount: 0,
    wordCount: 0,
    characterCount: 0,
    userName: "User",
  });

  useEffect(() => {
    if (!file) {
      navigate("/configure");
      return;
    }

    const abortController = new AbortController();

    async function startScan(validFile: File) {
      setScanStatus("uploading");
      const formData = new FormData();
      formData.append("file", validFile);

      // Build sources list from scan config
      if (scanConfig) {
        const sources: string[] = [];
        if (scanConfig.searchJournals) sources.push("periodicals");
        if (scanConfig.searchInternet) sources.push("internet");
        if (scanConfig.searchStudentPapers) {
          sources.push("student_papers");
          try {
            const submissionsSnapshot = await getDocs(collection(db, "submissions"));
            const studentPapers = submissionsSnapshot.docs.map(d => d.data());
            formData.append("student_papers", JSON.stringify(studentPapers));
          } catch (e) {
            console.error("Failed to fetch student papers", e);
          }
        }
        if (scanConfig.searchInstitution && scanConfig.institutionName) {
          sources.push("institution");
        }
        formData.append("config", JSON.stringify({ sources }));
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const response = await fetch(`${apiUrl}/api/scan`, {
          method: "POST",
          body: formData,
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        setScanStatus("scanning");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (!reader) throw new Error("No readable stream");
        const localChunks: ChunkResult[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          
          buffer = events.pop() || "";

          for (const event of events) {
            if (event.startsWith("data: ")) {
              const dataStr = event.slice(6);
              if (dataStr === "[DONE]") {
                setScanStatus("complete");

                return;
              }

              try {
                const chunkData = JSON.parse(dataStr);
                if (chunkData.error) {
                  throw new Error(chunkData.error);
                }
                localChunks.push(chunkData);
                setChunks((prev) => {
                  if (prev.find(c => c.chunk_index === chunkData.chunk_index)) return prev;
                  return [...prev, chunkData];
                });
                
                // Update character count from sanitization data
                if (chunkData.sanitization) {
                  setDetails(prev => ({
                    ...prev,
                    characterCount: chunkData.sanitization.total_chars
                  }));
                }
                // Note: page count is set by PdfViewer's onPageCountChange
                // callback using the real PDF page count from pdfjs-dist
              } catch (e) {
                console.error("Error parsing SSE JSON:", e);
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Scan failed:", err);
          const message =
            err.message === "Failed to fetch"
              ? "Could not connect to the analysis server. Please ensure the backend is running on port 8000."
              : err.message || "An unknown error occurred.";
          setError(message);
          setScanStatus("error");
        }
      }
    }

    startScan(file);

    return () => abortController.abort();
  }, [file, navigate, scanConfig]);

  const stats = computeMockStats(chunks);

  // Panel / modal state
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [activeChunkIndex, setActiveChunkIndex] = useState<number | null>(null);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [excludeQuotes, setExcludeQuotes] = useState(false);
  const [excludeBibliography, setExcludeBibliography] = useState(false);
  const [ignoreCitations, setIgnoreCitations] = useState(false);

  const togglePanel = (panel: string) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
    setShowDownloadMenu(false);
  };

  const handleChunkClick = (index: number) => {
    setActiveChunkIndex((prev) => (prev === index ? null : index));
  };

  // Compute AI display value with asterisk rule
  const overallAiPercent = stats.overallAiPercent;
  const aiDisplay = overallAiPercent < 10 ? "* %" : `${overallAiPercent}%`;

  // Page navigation
  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages || 1, p + 1));

  // Callbacks for PdfViewer to report page count and scroll-based page changes
  const handlePageCountChange = useCallback((count: number) => {
    setTotalPages(count);
    setDetails(prev => ({ ...prev, pageCount: count }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 bg-white shrink-0 z-40">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
          
          <span className="text-lg font-bold text-foreground tracking-tight hidden sm:block">
            Verity
          </span>

          {/* User label */}
          <div className="h-6 w-px bg-border/60 ml-2" />
          <span className="text-sm font-semibold text-foreground">
            {currentUser?.email || "User"}
          </span>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-slate-100 px-2.5 py-1 rounded-md font-medium">
            Page {currentPage} of {totalPages || "--"}
          </span>
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-muted-foreground transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= (totalPages || 1)}
            className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-muted-foreground transition-colors disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Document Panel — 85% */}
        <div
          className="flex-1 flex flex-col overflow-hidden relative"
          style={{ width: "85%" }}
        >
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive/10 border border-destructive text-destructive text-sm px-4 py-2 rounded-md shadow-sm">
              Error during analysis: {error}
            </div>
          )}
          <DocumentPanel
            chunks={chunks}
            activeChunkIndex={activeChunkIndex}
            onChunkClick={handleChunkClick}
            activePanel={activePanel}
            filterMode={filterMode}
            excludeQuotes={excludeQuotes}
            excludeBibliography={excludeBibliography}
            ignoreCitations={ignoreCitations}
            pdfFile={file}
            currentPage={currentPage}
            totalPages={totalPages || 0}
            onPageCountChange={handlePageCountChange}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Icon Dock — 15% */}
        <div
          className="shrink-0 border-l border-border/60 bg-slate-50 flex flex-col"
          style={{ width: "72px" }}
        >
          <IconDock
            similarityScore={stats.overallSimilarityPercent}
            aiDisplay={aiDisplay}
            activePanel={activePanel}
            onTogglePanel={togglePanel}
            onOpenInfo={() => setShowInfoModal(true)}
            onToggleDownload={() => setShowDownloadMenu((p) => !p)}
            filterMode={filterMode}
            onFilterModeChange={setFilterMode}
            excludeQuotes={excludeQuotes}
            excludeBibliography={excludeBibliography}
            ignoreCitations={ignoreCitations}
            onToggleExcludeQuotes={() => setExcludeQuotes((p) => !p)}
            onToggleExcludeBibliography={() => setExcludeBibliography((p) => !p)}
            onToggleIgnoreCitations={() => setIgnoreCitations((p) => !p)}
            scanStatus={scanStatus}
          />
        </div>

        {/* ── Slide-out Sources Panel ──────────────────────────── */}
        {activePanel === "sources" && (
          <SourcesPanel
            chunks={chunks}
            onClose={() => setActivePanel(null)}
          />
        )}

        {/* ── Download Menu ───────────────────────────────────── */}
        {showDownloadMenu && (
          <DownloadMenu
            onClose={() => setShowDownloadMenu(false)}
            chunks={chunks}
            file={file}
            stats={stats}
          />
        )}
      </div>

      {/* ── Submission Details Modal ──────────────────────────── */}
      {showInfoModal && (
        <SubmissionDetailsModal
          details={details}
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </div>
  );
}
