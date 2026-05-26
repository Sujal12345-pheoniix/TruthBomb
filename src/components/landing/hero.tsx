"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/70">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#ff6b35]/10 blur-3xl" />
      <div className="absolute -right-20 top-4 h-80 w-80 rounded-full bg-[#1f5a95]/15 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#54708b]"
        >
          AI Verification · GEO Intelligence
        </motion.p>

        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="editorial-heading text-balance text-[2.75rem] leading-[1.05] text-[#082742] md:text-[3.7rem]"
            >
              Verify Information Before The Internet Believes It.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-[#3d6180]"
            >
              AI-powered fact verification and GEO intelligence platform for modern
              brands and researchers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Button asChild size="lg">
                <Link href="/fact-check">
                  Upload PDF
                  <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/geo">Explore GEO Dashboard</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-14 flex gap-10 text-[13px] text-[#5d7a96]"
            >
              <div>
                <p className="font-mono text-2xl text-[#0f355b]">2.4M+</p>
                <p className="mt-1">Claims analyzed</p>
              </div>
              <div>
                <p className="font-mono text-2xl text-[#0f355b]">94%</p>
                <p className="mt-1">Source match rate</p>
              </div>
              <div className="hidden sm:block">
                <p className="font-mono text-2xl text-[#0f355b]">4</p>
                <p className="mt-1">AI engines tracked</p>
              </div>
            </motion.div>
          </div>

          <PdfPreviewAnimation />
        </div>
      </div>
    </section>
  );
}

function PdfPreviewAnimation() {
  const steps = [
    "Extracting claims…",
    "Searching Tavily, Brave, Exa…",
    "Ranking evidence…",
    "Generating report…",
  ];

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((s) => (s + 1) % steps.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="relative"
    >
      <div className="rounded-xl border border-border bg-white/92 p-5 shadow-[0_8px_28px_rgba(15,53,91,0.14)]">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e8f1fb]">
            <FileText className="h-4 w-4 text-[#2f5f8f]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#12395f]">annual-report-2024.pdf</p>
            <p className="text-xs text-[#6a839c]">Processing · 12 claims found</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {[
            { claim: "AI market reached $196B in 2023", status: "VERIFIED", w: 92 },
            { claim: "GDPR enacted May 2018", status: "VERIFIED", w: 98 },
            { claim: "Bitcoin exceeded $69K Nov 2021", status: "OUTDATED", w: 71 },
          ].map((item, i) => (
            <motion.div
              key={item.claim}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="rounded-lg border border-border/80 bg-[#f6faff] p-3"
            >
              <p className="text-[13px] text-[#3f6382]">{item.claim}</p>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`text-[11px] font-medium uppercase tracking-wide ${
                    item.status === "VERIFIED"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {item.status}
                </span>
                <div className="h-1 w-24 overflow-hidden rounded-full bg-[#d9e6f4]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#1f5a95] to-[#ff6b35]"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.w}%` }}
                    transition={{ delay: 0.8 + i * 0.2, duration: 0.6 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="mt-4 font-mono text-[11px] text-[#68829b]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          {steps[activeStep]}
        </motion.p>
      </div>
    </motion.div>
  );
}
