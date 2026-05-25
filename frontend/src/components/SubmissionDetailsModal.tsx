import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { SubmissionDetails } from "@/types";

interface SubmissionDetailsModalProps {
  details: SubmissionDetails;
  onClose: () => void;
}

export default function SubmissionDetailsModal({
  details,
  onClose,
}: SubmissionDetailsModalProps) {
  const rows: [string, string][] = [
    ["User", details.userName],
    ["Encryption ID", details.encryptionId],
    ["Submission Date", details.dateTime],
    ["File Name", details.fileName],
    ["File Extension", details.fileExtension],
    ["File Size", details.fileSize],
    ["Page Count", String(details.pageCount)],
    ["Word Count", details.wordCount.toLocaleString()],
    ["Character Count", details.characterCount.toLocaleString()],
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-lg shadow-2xl border border-border/60 overflow-hidden"
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
              Info
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              Document Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-muted-foreground transition-colors"
            id="info-modal-close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content — two-column table */}
        <div className="px-6 py-5">
          <table className="w-full">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-b border-border/30 last:border-0">
                  <td className="py-2.5 pr-6 text-sm text-muted-foreground font-medium whitespace-nowrap">
                    {label}
                  </td>
                  <td className="py-2.5 text-sm text-foreground font-medium">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
