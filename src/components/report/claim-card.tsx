"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink } from "lucide-react";
import type { VerificationStatus } from "@/types";

const statusVariant: Record<
  VerificationStatus,
  "verified" | "falsified" | "outdated" | "partial" | "none"
> = {
  VERIFIED: "verified",
  FALSE: "falsified",
  OUTDATED: "outdated",
  PARTIALLY_TRUE: "partial",
  NO_EVIDENCE: "none",
};

interface ClaimCardProps {
  claim: string;
  category: string;
  status: VerificationStatus;
  confidence: number;
  reasoning: string;
  correction?: string;
  evidence: Array<{ title: string; url: string; snippet: string; source: string }>;
}

export function ClaimCard({
  claim,
  category,
  status,
  confidence,
  reasoning,
  correction,
  evidence,
}: ClaimCardProps) {
  return (
    <article className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-stone-50/50 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-[15px] leading-snug text-stone-900 max-w-2xl">{claim}</p>
          <Badge variant={statusVariant[status]}>{status.replace("_", " ")}</Badge>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-wide text-stone-500">{category}</span>
          <div className="flex items-center gap-2 flex-1 max-w-[200px]">
            <Progress value={confidence * 100} className="flex-1" />
            <span className="font-mono text-[11px] text-stone-500">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 mb-1">
            AI Reasoning
          </p>
          <p className="text-[14px] leading-relaxed text-stone-700">{reasoning}</p>
        </div>

        {correction && (
          <div className="rounded-md border-l-2 border-amber-400 bg-amber-50/50 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800 mb-1">
              Suggested correction
            </p>
            <p className="text-[14px] text-amber-900">{correction}</p>
          </div>
        )}

        {evidence.length > 0 && (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 mb-3">
              Sources ({evidence.length})
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {evidence.slice(0, 4).map((src) => (
                <a
                  key={src.url}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-md border border-border p-3 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-stone-800 line-clamp-1 group-hover:underline">
                      {src.title}
                    </p>
                    <ExternalLink className="h-3 w-3 shrink-0 text-stone-400" />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-400 font-mono truncate">{src.url}</p>
                  <p className="mt-2 text-[12px] text-stone-600 line-clamp-2">{src.snippet}</p>
                  <span className="mt-2 inline-block text-[10px] uppercase text-stone-400">
                    via {src.source}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
