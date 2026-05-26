"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileText, CheckCircle2, XCircle, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const CLAIMS_DEMO = [
  { claim: "Global AI market reached $196.6B in 2023", status: "VERIFIED", conf: 94 },
  { claim: "India GDP grew 15% in Q1 2025", status: "FALSE", conf: 21 },
  { claim: "OpenAI GPT-5 launched February 2024", status: "OUTDATED", conf: 48 },
  { claim: "Tesla revenue doubled in 3 months 2024", status: "FALSE", conf: 18 },
  { claim: "GDPR enacted on 25 May 2018", status: "VERIFIED", conf: 99 },
];

const STEPS = [
  "Parsing PDF structure…",
  "Extracting factual claims…",
  "Querying Tavily live web…",
  "Running AI verification…",
  "Generating report…",
];

function StatusIcon({ status }: { status: string }) {
  if (status === "VERIFIED")
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  if (status === "FALSE") return <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />;
  return <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
}

function statusColor(status: string) {
  if (status === "VERIFIED") return "text-emerald-700";
  if (status === "FALSE") return "text-red-700";
  return "text-amber-700";
}

function ConfBar({ conf, status }: { conf: number; status: string }) {
  const color =
    status === "VERIFIED"
      ? "from-emerald-500 to-emerald-400"
      : status === "FALSE"
      ? "from-red-500 to-red-400"
      : "from-amber-500 to-amber-400";

  return (
    <div className="h-1 w-20 overflow-hidden rounded-full bg-[#e0e8f2]">
      <motion.div
        className={`h-full bg-gradient-to-r ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${conf}%` }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
      />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Background textures */}
      <div className="absolute inset-0 grid-pattern opacity-35" />
      <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#e8460a]/8 blur-3xl pointer-events-none" />
      <div className="absolute -right-16 top-0 h-96 w-96 rounded-full bg-[#0e2f54]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-40 w-[70%] rounded-full bg-[#0e2f54]/5 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
        {/* Eyebrow label */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-7 flex items-center gap-2"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#e8460a]">
            <Zap className="h-3 w-3 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[#526e8a]">
            AI Fact-Checking · GEO Intelligence Platform
          </span>
        </motion.div>

        <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          {/* Left: Copy */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.06 }}
              className="editorial-heading text-balance text-[2.6rem] text-[#07253f] md:text-[3.5rem]"
            >
              Verify Information<br />
              Before The Internet<br />
              <span className="text-[#e8460a]">Believes It.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.14 }}
              className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-[#3d6180]"
            >
              AI-powered fact verification and GEO intelligence for modern research
              and marketing teams. Upload any PDF — get a professional fact-check
              report in under 60 seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Button asChild size="lg" className="gap-1.5 shadow-sm">
                <Link href="/fact-check">
                  Upload PDF to Fact-Check
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/geo">Explore GEO Dashboard</Link>
              </Button>
            </motion.div>

          </div>

          {/* Right: Live preview animation */}
          <PdfPreviewAnimation />
        </div>
      </div>
    </section>
  );
}

function PdfPreviewAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleClaims, setVisibleClaims] = useState(1);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setActiveStep((s) => (s + 1) % STEPS.length);
    }, 2000);
    const claimTimer = setInterval(() => {
      setVisibleClaims((v) => Math.min(v + 1, CLAIMS_DEMO.length));
    }, 800);
    return () => {
      clearInterval(stepTimer);
      clearInterval(claimTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.18 }}
      className="relative"
    >
      {/* Main card */}
      <div className="rounded-xl border border-border/80 bg-white shadow-[0_8px_32px_rgba(14,47,84,0.13)] overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 border-b border-border/60 bg-[#f7fbff] px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#e9f1fb]">
            <FileText className="h-4 w-4 text-[#2d5f91]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-[#102b44]">annual-report-2025.pdf</p>
            <p className="text-[11.5px] text-[#6a839c]">{CLAIMS_DEMO.length} claims detected · Analyzing…</p>
          </div>
          {/* Scanning pulse */}
          <span className="flex h-2 w-2 rounded-full bg-[#e8460a] animate-pulse-dot" />
        </div>

        {/* Claims list */}
        <div className="p-4 space-y-2.5">
          {CLAIMS_DEMO.slice(0, visibleClaims).map((item, i) => (
            <motion.div
              key={item.claim}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.35 }}
              className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-[#f8fbff] p-3"
            >
              <StatusIcon status={item.status} />
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] leading-snug text-[#3f6382] line-clamp-1">
                  {item.claim}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className={`text-[10.5px] font-semibold uppercase tracking-wide ${statusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <ConfBar conf={item.conf} status={item.status} />
                    <span className="font-mono text-[10px] text-[#7a97b6]">{item.conf}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Processing indicator */}
        <div className="border-t border-border/50 bg-[#f7fbff] px-5 py-3">
          <motion.p
            className="font-mono text-[11px] text-[#68829b]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            ⟳ {STEPS[activeStep]}
          </motion.p>
        </div>
      </div>

      {/* Floating accuracy badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-2 right-2 sm:-bottom-4 sm:-right-4 rounded-xl border border-border bg-white px-4 py-3 shadow-lg"
      >
        <p className="text-[10.5px] uppercase tracking-wide text-[#687fa0]">Accuracy Score</p>
        <p className="mt-0.5 font-mono text-2xl font-semibold text-[#0e2f54]">
          78<span className="text-base text-[#7a97b6]">%</span>
        </p>
        <p className="text-[10px] text-[#95b0c8]">2/5 claims verified</p>
      </motion.div>
    </motion.div>
  );
}
