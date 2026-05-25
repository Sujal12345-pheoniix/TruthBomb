"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";

const PIPELINE_STEPS = [
  "PDF Upload",
  "Text Extraction",
  "Claim Extraction",
  "Search Query Generation",
  "Live Web Search",
  "Evidence Ranking",
  "Verification Engine",
  "AI Report Generation",
];

interface AnalysisProgressProps {
  currentStep: number;
  streamingText?: string;
}

export function AnalysisProgress({ currentStep, streamingText }: AnalysisProgressProps) {
  const progress = ((currentStep + 1) / PIPELINE_STEPS.length) * 100;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-900">Analysis pipeline</p>
        <span className="font-mono text-[12px] text-stone-500">
          Step {Math.min(currentStep + 1, PIPELINE_STEPS.length)} of {PIPELINE_STEPS.length}
        </span>
      </div>
      <Progress value={progress} className="mt-4" />

      <ul className="mt-6 space-y-2">
        {PIPELINE_STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <li
              key={step}
              className={`flex items-center gap-2 text-[13px] ${
                done
                  ? "text-stone-500"
                  : active
                    ? "text-stone-900 font-medium"
                    : "text-stone-400"
              }`}
            >
              {done ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-stone-800 animate-pulse" : "bg-stone-200"
                  }`}
                />
              )}
              {step}
            </li>
          );
        })}
      </ul>

      {streamingText && (
        <motion.p
          key={streamingText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 font-mono text-[11px] text-stone-400 border-t border-border pt-4"
        >
          {streamingText}
        </motion.p>
      )}
    </div>
  );
}
