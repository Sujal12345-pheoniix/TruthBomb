"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const demoClaims = [
  {
    claim: "Global renewable energy accounted for 30% of electricity in 2023",
    status: "VERIFIED",
    confidence: 0.91,
    icon: CheckCircle2,
    color: "text-emerald-600",
  },
  {
    claim: "Tesla delivered 2.5 million vehicles in 2023",
    status: "FALSE",
    confidence: 0.88,
    icon: XCircle,
    color: "text-red-600",
    correction: "Actual figure: ~1.8 million vehicles",
  },
  {
    claim: "WHO reports 1 in 8 people live with mental disorders",
    status: "VERIFIED",
    confidence: 0.94,
    icon: CheckCircle2,
    color: "text-emerald-600",
  },
  {
    claim: "NASA Artemis Moon landing scheduled for 2024",
    status: "INACCURATE",
    confidence: 0.82,
    icon: AlertTriangle,
    color: "text-amber-600",
    correction: "Timeline revised to 2026",
  },
];

export function DemoSection() {
  return (
    <section className="border-b border-border/70 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#55728e]">
            Live demonstration
          </p>
          <h2 className="editorial-heading mt-3 text-3xl text-[#0c2d4d] md:text-4xl">
            See fact-checking in motion
          </h2>
          <p className="mt-4 leading-relaxed text-[#3f6382]">
            Upload any research PDF. Our pipeline extracts claims, searches live
            sources, and returns evidence-ranked verdicts.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {demoClaims.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.claim}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-lg border border-border bg-white/92 p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${item.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-snug text-[#143b60]">{item.claim}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="font-mono text-[11px] uppercase tracking-wide text-[#64819d]">
                        {item.status}
                      </span>
                      <span className="text-[11px] text-[#8aa4be]">
                        {Math.round(item.confidence * 100)}% confidence
                      </span>
                    </div>
                    {item.correction && (
                      <p className="mt-2 border-l-2 border-amber-200 pl-3 text-[13px] text-[#64819d]">
                        {item.correction}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
