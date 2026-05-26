"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/header";
import { UploadZone } from "@/components/fact-check/upload-zone";
import { AnalysisProgress } from "@/components/fact-check/analysis-progress";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";

const PIPELINE_STEPS = [
  { label: "Uploading document", detail: "Saving PDF to secure storage…" },
  { label: "Extracting text", detail: "Parsing PDF structure and content…" },
  { label: "Detecting claims", detail: "AI identifying verifiable factual statements…" },
  { label: "Generating queries", detail: "Building targeted search queries per claim…" },
  { label: "Searching live web", detail: "Querying Tavily for current evidence…" },
  { label: "Ranking evidence", detail: "Scoring source quality and relevance…" },
  { label: "Running verification", detail: "GPT-4o cross-referencing claims against evidence…" },
  { label: "Generating report", detail: "Compiling executive summary and findings…" },
];

export default function FactCheckPage() {
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const [done, setDone] = useState(false);

  const handleUploaded = useCallback((id: string, name: string) => {
    setDocumentId(id);
    setFileName(name);
    setStep(0);
    setError(null);
    setDone(false);
  }, []);

  const runAnalysis = async () => {
    if (!documentId) return;
    setAnalyzing(true);
    setStep(0);
    setError(null);
    setStreamText(PIPELINE_STEPS[0].label + "…");

    // Advance progress steps at natural-feeling intervals
    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, PIPELINE_STEPS.length - 1);
      setStep(stepIdx);
      setStreamText(PIPELINE_STEPS[stepIdx].label + "…");
    }, 3500);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) {
        throw { message: data.error ?? "Analysis failed", hint: data.hint };
      }

      // Success!
      setStep(PIPELINE_STEPS.length - 1);
      setStreamText("Analysis complete!");
      setDone(true);

      // Brief pause then redirect to report
      setTimeout(() => router.push(`/report/${documentId}`), 1200);
    } catch (e) {
      clearInterval(interval);
      setAnalyzing(false);

      if (e && typeof e === "object" && "message" in e) {
        setError({
          message: (e as { message: string }).message,
          hint: (e as { hint?: string }).hint,
        });
      } else {
        setError({
          message: "Analysis failed due to an unexpected error.",
          hint: "Please try again. If the issue persists, try a different PDF.",
        });
      }
    }
  };

  const reset = () => {
    setDocumentId(null);
    setFileName(null);
    setAnalyzing(false);
    setStep(0);
    setStreamText("");
    setError(null);
    setDone(false);
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12 lg:py-16">
        {/* Page header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-[13px] text-[#527090] hover:text-[#1d476d] transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="editorial-heading mt-4 text-3xl text-[#07253f] md:text-4xl">
            AI Fact-Check
          </h1>
          <p className="mt-3 max-w-xl text-[#406381] leading-relaxed">
            Upload a PDF document. TruthBomb will extract factual claims, search live sources, and
            generate a professional verification report.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!documentId ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <UploadZone onUploaded={handleUploaded} />

              {/* Info cards */}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: "📄", title: "PDF Only", desc: "Max 10MB. Text-based PDFs work best." },
                  { icon: "🔍", title: "Live Verification", desc: "Claims checked against real web sources." },
                  { icon: "📊", title: "Professional Report", desc: "Executive summary + per-claim analysis." },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-lg border border-border/70 bg-white/70 p-4"
                  >
                    <span className="text-xl">{card.icon}</span>
                    <p className="mt-2 text-[13px] font-semibold text-[#113556]">{card.title}</p>
                    <p className="mt-1 text-[12px] text-[#6a839c] leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* File info card */}
              <div className="section-shell p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e9f1fb]">
                    <FileText className="h-5 w-5 text-[#2d5f91]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#0e2746]">{fileName}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#6a839c]">{documentId}</p>
                  </div>
                </div>
                {!analyzing && (
                  <Button variant="ghost" size="sm" onClick={reset} className="shrink-0">
                    Change file
                  </Button>
                )}
              </div>

              {/* Error state */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3"
                  >
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[14px] font-semibold text-red-800">{error.message}</p>
                      {error.hint && (
                        <p className="mt-1 text-[13px] text-red-700">{error.hint}</p>
                      )}
                      <button
                        onClick={runAnalysis}
                        className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-red-700 hover:text-red-900 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Try again
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success state */}
              <AnimatePresence>
                {done && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[14px] font-semibold text-emerald-800">
                        Analysis complete! Redirecting to your report…
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress or start button */}
              {analyzing ? (
                <AnalysisProgress currentStep={step} streamingText={streamText} />
              ) : !error && !done ? (
                <div className="section-shell p-6">
                  <p className="text-[14px] text-[#3f6180] mb-4 leading-relaxed">
                    Ready to analyze <strong>{fileName}</strong>. The pipeline will extract claims,
                    search live sources, and generate a full verification report.
                    <br />
                    <span className="text-[13px] text-[#7a97b6]">Estimated time: 30–60 seconds</span>
                  </p>
                  <Button onClick={runAnalysis} size="lg" className="gap-2">
                    <span>Start Fact-Check Pipeline</span>
                    <span className="text-white/70">→</span>
                  </Button>
                </div>
              ) : null}

              {/* Timeout notice */}
              {analyzing && step >= 5 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-[12px] text-[#7a97b6]"
                >
                  Complex documents may take up to 60 seconds. Please don&apos;t close this page.
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
