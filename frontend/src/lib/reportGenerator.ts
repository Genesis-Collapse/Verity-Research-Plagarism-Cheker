/**
 * reportGenerator.ts — PDF Report & Receipt Generation
 *
 * Uses jspdf to generate:
 * 1. Full analysis report with highlights and sources
 * 2. Watermarked digital receipt with embedded metadata
 * 3. File hash computation via Web Crypto API
 */

import { jsPDF } from "jspdf";
import type { ChunkResult } from "@/types";

// ─── SHA-256 File Hash ────────────────────────────────────────────────────

export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Stats type ───────────────────────────────────────────────────────────

interface ReportStats {
  totalChunks: number;
  plagiarizedCount: number;
  aiCount: number;
  overallSimilarityPercent: number;
  overallAiPercent: number;
}

// ─── Generate Full Analysis Report ────────────────────────────────────────

export async function generateReport(
  chunks: ChunkResult[],
  stats: ReportStats,
  fileName: string
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Header ──
  doc.setFillColor(24, 70, 139); // primary blue
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Originality Engine", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Document Analysis Report", margin, 28);
  doc.text(new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  }), pageWidth - margin, 28, { align: "right" });

  y = 55;

  // ── File Info ──
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Document:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(fileName, margin + 30, y);

  y += 12;

  // ── Score Summary ──
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 30, 3, 3, "F");

  // Plagiarism Score
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 38, 38); // red
  doc.text(`${stats.overallSimilarityPercent}%`, margin + 15, y + 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Similarity", margin + 15, y + 24);

  // AI Score
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235); // blue
  doc.text(`${stats.overallAiPercent}%`, margin + 55, y + 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("AI-Generated", margin + 55, y + 24);

  // Stats
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${stats.totalChunks} segments analyzed · ${stats.plagiarizedCount} flagged for plagiarism · ${stats.aiCount} flagged as AI`,
    pageWidth - margin, y + 18, { align: "right" }
  );

  y += 40;

  // ── Per-Chunk Results ──
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Detailed Results", margin, y);
  y += 8;

  for (const chunk of chunks) {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    const isPlagiarized = chunk.is_plagiarized;
    const isAI = chunk.ai_probability > 0.5;

    // Chunk header bar
    if (isPlagiarized) {
      doc.setFillColor(254, 242, 242); // red bg
      doc.setDrawColor(220, 38, 38);
    } else if (isAI) {
      doc.setFillColor(239, 246, 255); // blue bg
      doc.setDrawColor(37, 99, 235);
    } else {
      doc.setFillColor(248, 250, 252); // grey bg
      doc.setDrawColor(200, 200, 200);
    }

    doc.roundedRect(margin, y, contentWidth, 8, 1, 1, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(`Segment ${chunk.chunk_index + 1} / ${chunk.total_chunks}`, margin + 3, y + 5.5);

    // Labels
    const labels: string[] = [];
    if (isPlagiarized) labels.push(`Plagiarism: ${Math.round(chunk.max_similarity * 100)}%`);
    if (isAI) labels.push(`AI: ${Math.round(chunk.ai_probability * 100)}%`);
    if (labels.length === 0) labels.push("Clean");

    doc.text(labels.join(" · "), pageWidth - margin - 3, y + 5.5, { align: "right" });
    y += 10;

    // Chunk text
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const textLines = doc.splitTextToSize(chunk.full_text || chunk.text, contentWidth - 6);
    const maxLines = Math.min(textLines.length, 6);
    doc.text(textLines.slice(0, maxLines), margin + 3, y + 4);
    y += maxLines * 4 + 4;

    // Sources
    if (chunk.matches.length > 0) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(140, 140, 140);
      for (const match of chunk.matches.slice(0, 3)) {
        if (y > 270) { doc.addPage(); y = margin; }
        const sourceText = `→ ${match.title} (${match.source}, ${Math.round(match.similarity * 100)}%)`;
        doc.text(sourceText, margin + 6, y + 3);
        y += 4;
      }
    }

    y += 4;
  }

  // ── Footer ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Generated by Originality Engine · Page ${i} of ${totalPages}`,
      pageWidth / 2, 290, { align: "center" }
    );
  }

  doc.save(`${fileName.replace(/\.[^.]+$/, "")}_report.pdf`);
}


// ─── Generate Digital Receipt ─────────────────────────────────────────────

export async function generateReceipt(
  _chunks: ChunkResult[],
  stats: ReportStats,
  file: File
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;

  // Compute file hash
  const fileHash = await computeFileHash(file);

  // ── Diagonal Watermark ──
  doc.setTextColor(230, 230, 230);
  doc.setFontSize(40);
  doc.setFont("helvetica", "bold");

  // Draw multiple watermark lines
  for (let i = -2; i < 6; i++) {
    const xStart = -20;
    const yStart = 40 + i * 55;

    doc.text(
      "ORIGINALITY ENGINE — VERIFIED",
      xStart, yStart,
      { angle: 35 }
    );
  }

  // ── Content (over watermark) ──
  let y = margin + 10;

  // Header
  doc.setFillColor(24, 70, 139);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Digital Receipt", margin, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Originality Engine — Document Verification", margin, 26);

  y = 50;

  // Receipt details
  const details: [string, string][] = [
    ["Document", file.name],
    ["File Size", `${(file.size / 1024 / 1024).toFixed(2)} MB`],
    ["SHA-256 Hash", fileHash.substring(0, 32) + "..."],
    ["Submission Date", new Date().toISOString()],
    ["Similarity Score", `${stats.overallSimilarityPercent}%`],
    ["AI Detection Score", `${stats.overallAiPercent}%`],
    ["Segments Analyzed", `${stats.totalChunks}`],
    ["Plagiarism Flags", `${stats.plagiarizedCount}`],
    ["AI Flags", `${stats.aiCount}`],
  ];

  doc.setFontSize(11);
  for (const [label, value] of details) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(value, margin + 55, y);

    y += 8;

    // Light separator
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  }

  y += 10;

  // Full hash
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Full SHA-256 Hash:", margin, y);
  y += 5;
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(fileHash, margin, y);

  y += 15;

  // Verification note
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 25, 3, 3, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  const verifyText = doc.splitTextToSize(
    "This receipt confirms that the above document was submitted to Originality Engine for analysis. " +
    "The SHA-256 hash uniquely identifies the exact file that was scanned. " +
    "To verify this receipt, re-upload the same file and compare the hash values.",
    pageWidth - margin * 2 - 10
  );
  doc.text(verifyText, margin + 5, y + 7);

  // ── Embed C2PA-style metadata in PDF properties ──
  const metadata = {
    tool: "Originality Engine v1.0",
    timestamp: new Date().toISOString(),
    file_name: file.name,
    file_sha256: fileHash,
    file_size_bytes: file.size,
    scores: {
      similarity_percent: stats.overallSimilarityPercent,
      ai_percent: stats.overallAiPercent,
      segments_analyzed: stats.totalChunks,
      plagiarism_flags: stats.plagiarizedCount,
      ai_flags: stats.aiCount,
    },
  };

  doc.setProperties({
    title: `Digital Receipt — ${file.name}`,
    subject: "Originality Engine Document Verification Receipt",
    author: "Originality Engine v1.0",
    keywords: `sha256:${fileHash}`,
    creator: "Originality Engine",
  });

  // Embed the C2PA-style JSON as a text annotation (machine-readable)
  doc.setFontSize(1);
  doc.setTextColor(255, 255, 255); // invisible white text
  doc.text(`C2PA_METADATA:${JSON.stringify(metadata)}`, 0, pageHeight);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(
    "Generated by Originality Engine · This receipt is for verification purposes only",
    pageWidth / 2, pageHeight - 10, { align: "center" }
  );

  doc.save(`${file.name.replace(/\.[^.]+$/, "")}_receipt.pdf`);
}
