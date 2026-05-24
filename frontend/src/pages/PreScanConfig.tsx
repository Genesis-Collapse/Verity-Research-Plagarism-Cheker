import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Upload,
  FileText,
  X,
  Loader2,
  Globe,
  Users,
  BookOpen,
  Building2,
  ArrowLeft,
} from "lucide-react";
import type { ScanConfig } from "@/types";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/AuthModal";

export default function PreScanConfig() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { currentUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(!currentUser);

  const [config, setConfig] = useState<ScanConfig>({
    searchInternet: true,
    searchStudentPapers: true,
    searchJournals: true,
    searchInstitution: true,
    institutionName: "",
    submitTo: "none",
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    disabled: isUploading,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (!selectedFile) return;
    setIsUploading(true);

    navigate("/studio", { state: { file: selectedFile, config } });
  };

  const toggleConfig = (key: keyof ScanConfig) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-border/60 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              Verity
            </span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main className="flex-1 flex items-start justify-center pt-10 pb-20 px-6">
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Customize Your Search
            </h1>
            <p className="text-muted-foreground">
              Select the databases to include when analyzing your document.
              Then upload your document to begin analysis.
            </p>
          </div>

          {/* ── Config Card ──────────────────────────────────────── */}
          <div className="card-elevated bg-white p-8 mb-6">
            <div className="space-y-6">
              <ConfigCheckbox
                checked={config.searchInternet}
                onChange={() => toggleConfig("searchInternet")}
                icon={<Globe className="w-5 h-5 text-blue-600" />}
                label="Search the internet"
                description="Includes the current content of relevant internet sources."
                id="config-internet"
              />

              <hr className="border-border/50" />

              <ConfigCheckbox
                checked={config.searchStudentPapers}
                onChange={() => toggleConfig("searchStudentPapers")}
                icon={<Users className="w-5 h-5 text-emerald-600" />}
                label="Search user-submitted papers (Internal Repo)"
                description="Includes papers submitted to the internal repository. This database contains previously submitted work for cross-referencing."
                id="config-student-papers"
              />

              <hr className="border-border/50" />

              {/* Search periodicals */}
              <ConfigCheckbox
                checked={config.searchJournals}
                onChange={() => toggleConfig("searchJournals")}
                icon={<BookOpen className="w-5 h-5 text-purple-600" />}
                label="Search periodicals, journals, & publications"
                description="Includes content contained within licensed commercial databases via OpenAlex and Crossref; includes many popular periodicals, publications, and academic journals."
                id="config-journals"
              />

              <hr className="border-border/50" />

              {/* Search specific institution */}
              <div>
                <ConfigCheckbox
                  checked={config.searchInstitution}
                  onChange={() => toggleConfig("searchInstitution")}
                  icon={<Building2 className="w-5 h-5 text-amber-600" />}
                  label="Search specific institution"
                  description="Includes all papers submitted to the specified institution's repository."
                  id="config-institution"
                />
                {config.searchInstitution && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 ml-10"
                  >
                    <input
                      type="text"
                      value={config.institutionName}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          institutionName: e.target.value,
                        }))
                      }
                      placeholder="Enter institution name (e.g., University of Mumbai)"
                      className="w-full px-4 py-2.5 rounded-md border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                      id="institution-name-input"
                    />
                  </motion.div>
                )}
              </div>
            </div>


          </div>

          {/* ── Upload Zone ──────────────────────────────────────── */}
          <div className="card-elevated bg-white p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Upload Document
            </h2>

            <div
              {...getRootProps()}
              id="pdf-dropzone"
              className={`
                relative w-full cursor-pointer rounded-xl border-2 border-dashed
                transition-all duration-300 ease-out
                ${
                  isDragActive
                    ? "border-primary/60 bg-primary/[0.03]"
                    : isUploading
                    ? "border-border cursor-not-allowed opacity-60"
                    : "border-border hover:border-primary/40 hover:bg-primary/[0.02]"
                }
              `}
            >
              <input {...getInputProps()} />

              <div className="flex flex-col items-center justify-center py-12 px-6">
                <AnimatePresence mode="wait">
                  {selectedFile ? (
                    <motion.div
                      key="selected"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <FileText className="w-7 h-7 text-emerald-600" />
                        </div>
                        <button
                          onClick={clearFile}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors text-muted-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          {isDragActive
                            ? "Drop your PDF here"
                            : "Drag & drop a research paper"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          or{" "}
                          <span className="text-primary underline underline-offset-2 cursor-pointer">
                            click to browse
                          </span>{" "}
                          — PDF files up to 50MB
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || isUploading}
                className={`btn-primary px-8 py-2.5 ${
                  !selectedFile || isUploading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                id="submit-scan-button"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
      
      <AuthModal 
        isOpen={showAuthModal && !currentUser} 
        onClose={() => {
          setShowAuthModal(false);
          if (!currentUser) navigate("/");
        }} 
      />
    </div>
  );
}

// ─── Checkbox Component ─────────────────────────────────────────────────────

function ConfigCheckbox({
  checked,
  onChange,
  icon,
  label,
  description,
  id,
  comingSoon = false,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
  id: string;
  comingSoon?: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3.5 cursor-pointer group ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="pt-0.5 shrink-0">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
            checked && !disabled
              ? "bg-primary border-primary"
              : "border-border group-hover:border-primary/40"
          } ${disabled ? "bg-slate-100 border-border" : ""}`}
        >
          {checked && !disabled && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="sr-only"
          disabled={disabled}
        />
      </div>
      <div className="flex items-start gap-3 flex-1">
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div>
          <span className="text-sm font-semibold text-foreground block">
            {label}
            {comingSoon && (
              <span className="badge-coming-soon ml-2">Coming soon</span>
            )}
          </span>
          <span className="text-sm text-muted-foreground leading-relaxed mt-1 block">
            {description}
          </span>
        </div>
      </div>
    </label>
  );
}
