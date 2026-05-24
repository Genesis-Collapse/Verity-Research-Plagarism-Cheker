// ─── Types for Verity ──────────────────────────────────────

export interface MatchInfo {
  title: string;
  doi: string | null;
  doi_url: string | null;
  source: string; // "OpenAlex" | "Crossref" | "CORE"
  similarity: number;
}

export interface SanitizationInfo {
  unicode_normalized: boolean;
  zero_width_chars_removed: number;
  whitespace_normalized: boolean;
  total_chars: number;
  error?: string;
}

export interface ChunkResult {
  chunk_index: number;
  total_chunks: number;
  text: string;       // truncated preview
  full_text: string;  // complete chunk text
  ai_probability: number;
  ai_label: string;   // "AI-Generated" | "Human-Written" | "Error"
  is_plagiarized: boolean;
  max_similarity: number;
  matches: MatchInfo[];
  is_quote: boolean;
  is_bibliography: boolean;
  sanitization: SanitizationInfo | null;
  error?: string;
}

export type ScanStatus =
  | "idle"
  | "uploading"
  | "scanning"
  | "complete"
  | "error";

// ─── New Types for the Refactored UI ───────────────────────────────────────

export interface SubmissionDetails {
  submissionId: string;
  dateTime: string;
  fileName: string;
  fileExtension: string;
  fileSize: string;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  userName: string;
}

export type FilterMode = "all" | "ai-only" | "plagiarism-only";

export interface ScanConfig {
  searchInternet: boolean;
  searchStudentPapers: boolean;
  searchJournals: boolean;
  searchInstitution: boolean;
  institutionName: string;
  submitTo: "standard" | "none";
}
