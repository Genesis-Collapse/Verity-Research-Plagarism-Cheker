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
              Verity
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
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Effective Date: May 25, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-foreground/85">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction and Scope</h2>
            <p>
              This Privacy Policy ("Policy") constitutes a legally binding agreement between you ("User", "You") and the operators of Verity ("Company", "We", "Us"). By accessing or utilizing the Verity software and services ("Services"), you expressly consent to the data collection, processing, and storage practices delineated herein. If you do not agree with these terms, you must immediately cease all use of the Services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Data Collection and Retention</h2>
            <p className="mb-3">
              We operate on a strictly ephemeral processing model to ensure the privacy and sovereignty of your intellectual property:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Ephemeral Processing:</strong> Your document is processed ephemerally. The file is temporarily loaded into volatile server memory (RAM) strictly for the duration of the analysis session. Upon conclusion of the session, the document and all associated extracted text are permanently purged from memory. We retain no persistent copy of your document on any disk or database.
              </li>
              <li>
                <strong>User Account Data:</strong> If you authenticate with our Services, we collect and store basic profile information (such as your User ID) necessary for session management.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Processing Methodologies</h2>
            <p className="mb-3">All analytical processing is conducted in accordance with the following protocols:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Proprietary Machine Learning Models:</strong> Artificial Intelligence (AI) authorship detection and semantic similarity scoring are executed utilizing localized inference models (e.g., RoBERTa and SentenceTransformer variants).
              </li>
              <li>
                <strong>Third-Party Vendor Exclusion:</strong> Your verbatim text is never transmitted to third-party generative AI providers (e.g., OpenAI, Anthropic, or Google) for analysis.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Third-Party Integrations and Data Sharing</h2>
            <p className="mb-3">
              To facilitate comprehensive academic integrity verification, the Services interface with external, publicly accessible academic databases including, but not limited to, OpenAlex, Crossref, Semantic Scholar, and CORE.
            </p>
            <p className="mt-3">
              We transmit solely extracted, anonymized keyword strings to these third-party Application Programming Interfaces (APIs). Under no circumstances is the complete corpus of your submitted document transmitted to these external entities. Your data is subject to the respective privacy policies and terms of service of these third-party vendors.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Disclaimer of Warranties and Limitation of Liability</h2>
            <p>
              While we implement industry-standard cryptographic and security protocols to safeguard your data, no method of transmission over the Internet or electronic storage is completely secure. We disclaim all liability for unauthorized access, data breaches, or inadvertent disclosures to the maximum extent permitted by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. User Rights and Data Subject Requests</h2>
            <p>
              Pursuant to applicable data protection regulations, you reserve the right to request access to, or deletion of, your personal data stored within our internal repositories. Such requests must be submitted in writing. We reserve the right to verify your identity prior to executing any data subject request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Modifications to Policy</h2>
            <p>
              We reserve the unilateral right to amend, modify, or revise this Policy at any time. Continued utilization of the Services following any such modification constitutes your binding acceptance of the revised Policy.
            </p>
          </section>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 Verity. All rights reserved.</span>
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
