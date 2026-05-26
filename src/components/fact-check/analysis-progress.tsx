"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Check, Loader2 } from "lucide-react";

const PIPELINE_STEPS = [
  { label: "PDF Upload", icon: "📄" },
  { label: "Text Extraction", icon: "📝" },
  { label: "Claim Detection", icon: "🔍" },
  { label: "Query Generation", icon: "💡" },
  { label: "Live Web Search", icon: "🌐" },
  { label: "Evidence Ranking", icon: "⚖️" },
  { label: "AI Verification", icon: "🤖" },
  { label: "Report Generation", icon: "📊" },
];

interface AnalysisProgressProps {
  currentStep: number;
  streamingText?: string;
}

export function AnalysisProgress({ currentStep, streamingText }: AnalysisProgressProps) {
  const progress = Math.round(((currentStep + 1) / PIPELINE_STEPS.length) * 100);

  return (
    <div className="section-shell p-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[14px] font-semibold text-[#0e2746]">Fact-checking in progress</p>
          <p className="text-[12px] text-[#6a839c] mt-0.5">Processing your document through the AI pipeline</p>
        </div>
        <span className="font-mono text-[13px] text-[#0e2f54] font-semibold">{progress}%</span>
      </div>

      <Progress value={progress} className="h-1.5" />

      {/* Steps list */}
      <ul className="mt-5 space-y-1.5">
        {PIPELINE_STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          const isPending = i > currentStep;

          return (
            <motion.li
              key={step.label}
              initial={false}
              animate={{
                opacity: isPending ? 0.4 : 1,
              }}
              className="flex items-center gap-3 rounded-md px-2 py-1.5"
              style={{
                background: isActive ? "rgb(238 246 255 / 0.8)" : "transparent",
              }}
            >
              {/* Step indicator */}
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {isDone ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
                ) : isActive ? (
                  <Loader2 className="h-3.5 w-3.5 text-[#1f5a95] animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#bdd0e5]" />
                )}
              </span>

              <span
                className={`text-[13px] ${
                  isDone
                    ? "text-[#5d7a96]"
                    : isActive
                    ? "font-semibold text-[#0e2746]"
                    : "text-[#8ea4bc]"
                }`}
              >
                {step.label}
              </span>

              {isActive && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-auto font-mono text-[10.5px] text-[#6a839c]"
                  style={{ animationDelay: "0.3s" }}
                >
                  running…
                </motion.span>
              )}
            </motion.li>
          );
        })}
      </ul>

      {/* Streaming status text */}
      {streamingText && (
        <motion.div
          key={streamingText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-4 border-t border-border/60 pt-4 flex items-center gap-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#e8460a] animate-pulse-dot shrink-0" />
          <p className="font-mono text-[11px] text-[#6a839c]">{streamingText}</p>
        </motion.div>
      )}
    </div>
  );
}
