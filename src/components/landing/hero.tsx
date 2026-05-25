"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-[13px] font-medium uppercase tracking-[0.12em] text-stone-500"
        >
          AI Verification · GEO Intelligence
        </motion.p>

        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="editorial-heading text-balance text-[2.75rem] leading-[1.08] text-stone-900 md:text-[3.5rem]"
            >
              Verify Information Before The Internet Believes It.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600"
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
              className="mt-14 flex gap-10 text-[13px] text-stone-500"
            >
              <div>
                <p className="font-mono text-2xl text-stone-900">2.4M+</p>
                <p className="mt-1">Claims analyzed</p>
              </div>
              <div>
                <p className="font-mono text-2xl text-stone-900">94%</p>
                <p className="mt-1">Source match rate</p>
              </div>
              <div className="hidden sm:block">
                <p className="font-mono text-2xl text-stone-900">4</p>
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="relative"
    >
      <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-stone-100">
            <FileText className="h-4 w-4 text-stone-600" />
          </div>
          <div>
            <p className="text-sm font-medium">annual-report-2024.pdf</p>
            <p className="text-xs text-stone-500">Processing · 12 claims found</p>
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
              className="rounded-lg border border-border/80 bg-stone-50/50 p-3"
            >
              <p className="text-[13px] text-stone-700">{item.claim}</p>
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
                <div className="h-1 w-24 overflow-hidden rounded-full bg-stone-200">
                  <motion.div
                    className="h-full bg-stone-800"
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
          className="mt-4 font-mono text-[11px] text-stone-400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          {steps[Math.floor(Date.now() / 2000) % steps.length] || steps[0]}
        </motion.p>
      </div>
    </motion.div>
  );
}
