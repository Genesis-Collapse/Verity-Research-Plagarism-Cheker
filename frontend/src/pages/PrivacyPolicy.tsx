import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="h-16 border-b border-border/60 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              Originality Engine
            </span>
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-foreground/85">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Overview</h2>
            <p>
              Originality Engine is a free, open-source document analysis tool. We are committed to
              protecting your privacy. This policy explains what data we collect (and don't collect)
              when you use our software.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Data Collection</h2>
            <p className="mb-3">
              <strong>We do not store your documents permanently.</strong> When you upload a PDF for
              analysis:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>The document is processed entirely in memory during the analysis session.</li>
              <li>Text is extracted, chunked, and analyzed in real-time.</li>
              <li>Once the analysis is complete and your session ends, the uploaded document and
                  extracted text are discarded from server memory.</li>
              <li>No copy of your document is written to disk or retained in any database.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Processing</h2>
            <p className="mb-3">Analysis is performed using:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Local ML Models:</strong> AI text detection uses a RoBERTa model that runs
                entirely on the server hosting Originality Engine. No text is sent to OpenAI,
                Google, or any other AI provider.
              </li>
              <li>
                <strong>Semantic Similarity:</strong> Text embeddings are computed using a
                SentenceTransformer model running locally. No embeddings are stored after the session.
              </li>
              <li>
                <strong>Text Sanitization:</strong> Unicode normalization and zero-width character
                removal are performed locally in memory.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Third-Party APIs</h2>
            <p className="mb-3">
              To perform plagiarism checks, we query the following public academic databases:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>OpenAlex</strong> (openalex.org) — Open academic metadata.
                We send extracted keywords, not your full text.
              </li>
              <li>
                <strong>Crossref</strong> (crossref.org) — DOI and publication metadata.
                We send extracted keywords, not your full text.
              </li>
              <li>
                <strong>Semantic Scholar</strong> (semanticscholar.org) — Academic paper search.
                We send extracted keywords, not your full text.
              </li>
              <li>
                <strong>CORE</strong> (core.ac.uk) — Open access research outputs.
                We send extracted keywords, not your full text.
              </li>
            </ul>
            <p className="mt-3">
              These services receive only short keyword queries derived from your document — never
              the full document text. Please refer to each service's own privacy policy for their
              data handling practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Cookies & Tracking</h2>
            <p>
              Originality Engine does not use cookies, analytics trackers, or any form of user
              tracking. There are no ads, no telemetry, and no third-party tracking scripts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Your Rights</h2>
            <p>
              Since we do not store any personal data or documents, there is nothing to delete.
              You can use Originality Engine without creating an account, providing an email, or
              identifying yourself in any way.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Any changes will be reflected on
              this page with an updated "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Contact</h2>
            <p>
              If you have questions about this privacy policy, please open an issue on the project's
              GitHub repository.
            </p>
          </section>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 Originality Engine. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-foreground transition-colors font-medium text-foreground">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
