import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Search,
  Bot,
  Database,
  ArrowRight,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/AuthModal";

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-border/60 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              Verity
            </span>
          </div>

          {/* Nav */}
          <div className="flex items-center gap-4">
            <a
              href="mailto:ragingtempest20@gmail.com"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
            <button
              className="btn-primary text-sm px-4 py-2"
              onClick={() => currentUser ? logout() : setShowAuthModal(true)}
              id="login-button"
            >
              {currentUser ? "Log Out" : "Log In"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium mb-8">
              <Shield className="w-4 h-4" />
              Free & Open-Source Document Analysis
            </div>

            <h1 className="text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-6 text-balance">
              Empowering Academic Integrity
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
              Enterprise-grade document analysis powered by federated database
              scanning. Cross-reference submissions against OpenAlex, Crossref,
              and CORE to detect plagiarism and AI-generated content with
              transparent, auditable results.
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                className="btn-primary text-base px-8 py-3"
                onClick={() => navigate("/configure")}
                id="cta-dashboard"
              >
                Go to Dashboard
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
              <button
                className="btn-outline text-base px-8 py-3"
                onClick={() => {}}
                id="cta-learn-more"
              >
                Learn More
              </button>
            </div>
          </motion.div>

          {/* ── Trust indicators ────────────────────────────────────── */}
          <motion.div
            className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {[
              "No black-box LLMs",
              "Locally-hosted ML models",
              "Open-source & transparent",
              "No data stored permanently",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── Features ──────────────────────────────────────────────── */}
        <section className="bg-slate-50 border-t border-border/40">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-foreground tracking-tight mb-3">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                A comprehensive analysis pipeline that combines federated
                academic search with local machine learning inference.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className="card-elevated p-6 bg-white hover:shadow-md transition-shadow duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${feature.iconBg}`}
                  >
                    <feature.icon
                      className={`w-5 h-5 ${feature.iconColor}`}
                    />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────────── */}
        <section className="bg-primary">
          <div className="max-w-7xl mx-auto px-6 py-14 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Ready to safeguard academic integrity?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
              Upload your first document and see the engine in action — no
              setup required.
            </p>
            <button
              className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3 rounded-md text-base hover:bg-slate-50 transition-colors"
              onClick={() => navigate("/configure")}
              id="cta-bottom"
            >
              Get Started
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 Verity. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="https://github.com/Genesis-Collapse/Verity-Research-Plagarism-Cheker" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

// ─── Feature data ────────────────────────────────────────────────────────────

const features = [
  {
    icon: Search,
    title: "Similarity Detection",
    description:
      "Cross-reference documents against millions of academic publications through federated search across OpenAlex, Crossref, and CORE databases.",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    icon: Bot,
    title: "AI Writing Detection",
    description:
      "Identify AI-generated text using a locally-hosted RoBERTa model. Deterministic, auditable, and free from third-party API dependencies.",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Database,
    title: "Federated Search",
    description:
      "No single point of failure. Concurrently query multiple academic databases with deduplication and DOI-level source attribution.",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: Shield,
    title: "Anti-Evasion Defense",
    description:
      "Built-in sanitization strips homoglyphs, zero-width characters, and Unicode tricks used to defeat naive plagiarism checkers.",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];
