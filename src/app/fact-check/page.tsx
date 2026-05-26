"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { UploadZone } from "@/components/fact-check/upload-zone";
import { AnalysisProgress } from "@/components/fact-check/analysis-progress";
import { Button } from "@/components/ui/button";

export default function FactCheckPage() {
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [streamText, setStreamText] = useState("");

  const handleUploaded = useCallback((id: string, name: string) => {
    setDocumentId(id);
    setFileName(name);
    setStep(0);
  }, []);

  const runAnalysis = async () => {
    if (!documentId) return;
    setAnalyzing(true);
    setStep(0);

    const steps = [
      "Uploading document…",
      "Extracting text from PDF…",
      "Identifying factual claims…",
      "Generating search queries…",
      "Searching Tavily and web sources…",
      "Ranking evidence quality…",
      "Running verification engine…",
      "Generating professional report…",
    ];

    const interval = setInterval(() => {
      setStep((s) => {
        const next = Math.min(s + 1, steps.length - 1);
        setStreamText(steps[next] ?? "");
        return next;
      });
    }, 2200);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) throw new Error(data.error ?? "Analysis failed");

      setStep(steps.length - 1);
      setStreamText("Complete — redirecting to report…");
      setTimeout(() => router.push(`/report/${documentId}`), 800);
    } catch (e) {
      clearInterval(interval);
      setStreamText(e instanceof Error ? e.message : "Analysis failed");
      setAnalyzing(false);
    }
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-14">
        <div className="mb-10 section-shell p-7 sm:p-9">
          <Link
            href="/dashboard"
            className="text-[13px] text-[#54708b] hover:text-[#21486d]"
          >
            ← Dashboard
          </Link>
          <h1 className="editorial-heading mt-4 text-4xl text-[#0c2d4d]">Fact Check</h1>
          <p className="mt-3 max-w-2xl text-[#406381]">
            Upload a PDF to extract claims, verify against live sources, and generate a
            research-grade report.
          </p>
        </div>

        {!documentId ? (
          <UploadZone onUploaded={handleUploaded} />
        ) : (
          <div className="space-y-6 section-shell p-6 sm:p-7">
            <div className="rounded-lg border border-border bg-white/85 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#113556]">{fileName}</p>
                <p className="text-[12px] text-[#6a839c] font-mono">{documentId}</p>
              </div>
              {!analyzing && (
                <Button variant="ghost" size="sm" onClick={() => setDocumentId(null)}>
                  Change file
                </Button>
              )}
            </div>

            {analyzing ? (
              <AnalysisProgress currentStep={step} streamingText={streamText} />
            ) : (
              <Button onClick={runAnalysis} size="lg" className="w-full sm:w-auto">
                Start verification pipeline
              </Button>
            )}
          </div>
        )}
      </main>
    </>
  );
}
