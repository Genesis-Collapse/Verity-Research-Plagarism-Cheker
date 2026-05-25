import { motion } from "framer-motion";
import { ArrowLeft, Shield, Search, Bot, Database, Server, Lock, Github, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InfoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border/60 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
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

      {/* Main Content */}
      <main className="flex-1 py-16 px-6">
        <motion.div 
          className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Banner */}
          <div className="bg-primary px-10 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Behind the Scenes of Verity
            </h1>
            <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
              Verity is an advanced, open-source platform designed to safeguard academic integrity through deterministic AI analysis and federated database searching.
            </p>
          </div>

          <div className="p-10 md:p-14 space-y-16">
            {/* Section 1: Federated Search */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Search className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Federated Plagiarism Search</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                Unlike traditional plagiarism checkers that rely on a single proprietary database, Verity utilizes a <strong>Federated Search Architecture</strong>. When a document is analyzed, it is broken down into overlapping semantic chunks. These chunks are then queried concurrently across massive open-access academic databases:
              </p>
              <ul className="grid sm:grid-cols-2 gap-4">
                {[
                  "OpenAlex (250M+ Works)",
                  "Crossref Metadata",
                  "CORE (Open Access Repos)",
                  "Internal Document Repository"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <Database className="w-5 h-5 text-primary/60" />
                    <span className="font-medium text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 2: AI Detection */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Deterministic AI Detection</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                To combat the rise of AI-generated academic submissions, Verity does not rely on third-party black-box APIs like OpenAI or Turnitin. Instead, we run locally-hosted, fine-tuned transformer models.
              </p>
              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
                <p className="text-blue-800/80 leading-relaxed">
                  We utilize a custom <strong>RoBERTa</strong> sequence classification model trained specifically on academic text and LLM outputs (ChatGPT, Claude, etc.). The model evaluates the <em>perplexity</em> and <em>burstiness</em> of the text. Human writing tends to have high variance (burstiness), while AI writing maintains a mathematically uniform predictability (low perplexity).
                </p>
              </div>
            </section>

            {/* Section 3: Architecture & Privacy */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Privacy by Design</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                Verity was built from the ground up to respect user data and institutional privacy.
              </p>
              <div className="grid gap-4">
                {[
                  { title: "No Permanent Storage", desc: "By default, documents are analyzed entirely in memory and immediately discarded. Nothing is saved to a database unless you explicitly opt-in." },
                  { title: "Hardware Isolation", desc: "Our machine learning inference engine runs on isolated Hugging Face Docker containers, ensuring compute environments are ephemeral." },
                  { title: "Open Source Code", desc: "Our entire architecture—frontend, backend, and machine learning pipeline—is open-source and auditable on GitHub." }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <CheckCircle2 className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900">{feature.title}</h4>
                      <p className="text-slate-600 mt-1">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tech Stack */}
            <section className="border-t border-border/50 pt-10">
              <h2 className="text-xl font-bold text-center text-foreground mb-8">Built With Modern Technologies</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {["React & Vite", "Tailwind CSS", "Framer Motion", "FastAPI (Python)", "PyTorch & Transformers", "Firebase Auth"].map((tech) => (
                  <span key={tech} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200">
                    {tech}
                  </span>
                ))}
              </div>
            </section>

          </div>
        </motion.div>
      </main>
    </div>
  );
}
