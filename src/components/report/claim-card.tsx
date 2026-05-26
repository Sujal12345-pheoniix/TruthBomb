"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink } from "lucide-react";
import type { ReportVerificationStatus } from "@/types";

const statusVariant: Record<
  ReportVerificationStatus,
  "verified" | "falsified" | "inaccurate"
> = {
  VERIFIED: "verified",
  FALSE: "falsified",
  INACCURATE: "inaccurate",
};

interface ClaimCardProps {
  claim: string;
  category: string;
  status: ReportVerificationStatus;
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
    <article className="overflow-hidden rounded-lg border border-border bg-white/92 shadow-sm">
      <div className="border-b border-border bg-[#f4f9ff] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-2xl text-[15px] leading-snug text-[#12375a]">{claim}</p>
          <Badge variant={statusVariant[status]}>{status.replace("_", " ")}</Badge>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-wide text-[#63809d]">{category}</span>
          <div className="flex max-w-50 flex-1 items-center gap-2">
            <Progress value={confidence * 100} className="flex-1" />
            <span className="font-mono text-[11px] text-[#5f7c98]">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#64819d]">
            AI Reasoning
          </p>
          <p className="text-[14px] leading-relaxed text-[#3f6180]">{reasoning}</p>
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
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-[#64819d]">
              Sources ({evidence.length})
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {evidence.slice(0, 4).map((src) => (
                <a
                  key={src.url}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-md border border-border bg-white p-3 transition-colors hover:bg-[#f5f9ff]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-[13px] font-medium text-[#143b60] group-hover:underline">
                      {src.title}
                    </p>
                    <ExternalLink className="h-3 w-3 shrink-0 text-[#89a4be]" />
                  </div>
                  <p className="mt-1 truncate font-mono text-[11px] text-[#89a4be]">{src.url}</p>
                  <p className="mt-2 line-clamp-2 text-[12px] text-[#4a6b89]">{src.snippet}</p>
                  <span className="mt-2 inline-block text-[10px] uppercase text-[#89a4be]">
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
