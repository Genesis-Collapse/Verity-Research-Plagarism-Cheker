import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-foreground/85">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Originality Engine, you agree to be bound by these Terms of
              Service. If you do not agree to these terms, please do not use the software.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p>
              Originality Engine is a free, open-source document analysis tool that performs
              plagiarism detection and AI-generated text identification. The software is provided
              for educational and research purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. No Warranties</h2>
            <p className="mb-3">
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
              INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE AND NONINFRINGEMENT.
            </p>
            <p>
              Specifically, we make no guarantees regarding:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
              <li>The accuracy of plagiarism detection results</li>
              <li>The accuracy of AI-generated text detection</li>
              <li>The completeness of database coverage</li>
              <li>Continuous availability of the service</li>
              <li>The correctness of similarity percentages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Accuracy Disclaimer</h2>
            <p className="mb-3">
              Originality Engine uses machine learning models and federated academic database
              searches to provide its analysis. These methods have inherent limitations:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>AI Detection:</strong> The RoBERTa model was trained on GPT-2 era text and
                may produce false positives on formal academic writing. Results should be
                interpreted as probabilistic indicators, not definitive judgments.
              </li>
              <li>
                <strong>Plagiarism Detection:</strong> The tool searches publicly available academic
                databases (OpenAlex, Crossref, CORE). It cannot access paywalled full-text databases,
                unpublished works, or student paper repositories used by commercial services.
              </li>
              <li>
                <strong>Results should not be the sole basis</strong> for academic integrity
                decisions. Always use human judgment in conjunction with automated analysis.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Acceptable Use</h2>
            <p className="mb-3">You agree to use Originality Engine only for lawful purposes. You may not:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Use the tool to harass, defame, or discriminate against individuals</li>
              <li>Attempt to reverse-engineer or exploit the detection algorithms to evade
                  plagiarism or AI detection in submitted work</li>
              <li>Overload the service with excessive automated requests</li>
              <li>Misrepresent the results of the analysis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Intellectual Property</h2>
            <p>
              You retain all rights to documents you upload. Originality Engine does not claim any
              ownership or license over your uploaded content. As stated in our Privacy Policy,
              uploaded documents are not stored after the analysis session ends.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
              OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
              FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
              THE SOFTWARE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Open Source License</h2>
            <p>
              Originality Engine is released under the MIT License. You are free to use, modify,
              and distribute the software in accordance with the terms of that license.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be posted on this
              page with an updated "Last updated" date. Continued use of the service after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Contact</h2>
            <p>
              If you have questions about these terms, please open an issue on the project's
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
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors font-medium text-foreground">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
