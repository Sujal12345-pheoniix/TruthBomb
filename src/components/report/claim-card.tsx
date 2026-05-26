/* eslint-disable @next/next/no-img-element */
"use client";


import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import type { ReportVerificationStatus } from "@/types";
import { useState } from "react";

// Map all possible verdict types to badge variants
function getVariant(status: ReportVerificationStatus): "verified" | "falsified" | "inaccurate" | "outdated" | "partial" | "noevidence" {
  switch (status) {
    case "VERIFIED": return "verified";
    case "FALSE": return "falsified";
    case "INACCURATE": return "inaccurate";
    default: return "noevidence";
  }
}

function getStatusLabel(status: ReportVerificationStatus): string {
  switch (status) {
    case "VERIFIED": return "✓ Verified";
    case "FALSE": return "✗ False";
    case "INACCURATE": return "~ Inaccurate";
    default: return "? No Evidence";
  }
}

function getStatusBorderColor(status: ReportVerificationStatus): string {
  switch (status) {
    case "VERIFIED": return "border-l-emerald-400";
    case "FALSE": return "border-l-red-400";
    case "INACCURATE": return "border-l-amber-400";
    default: return "border-l-slate-300";
  }
}

function getConfidenceColor(status: ReportVerificationStatus): string {
  switch (status) {
    case "VERIFIED": return "bg-emerald-500";
    case "FALSE": return "bg-red-500";
    case "INACCURATE": return "bg-amber-500";
    default: return "bg-slate-400";
  }
}

interface ClaimCardProps {
  claim: string;
  category: string;
  status: ReportVerificationStatus;
  confidence: number;
  reasoning: string;
  correction?: string;
  evidence: Array<{ title: string; url: string; snippet: string; source: string; publishedAt?: string }>;
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
  const [expanded, setExpanded] = useState(false);
  const confPct = Math.round(confidence * 100);

  return (
    <article
      className={`overflow-hidden rounded-xl border border-border bg-white shadow-sm border-l-4 ${getStatusBorderColor(status)}`}
    >
      {/* Header */}
      <div className="bg-[#f7fbff] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-2xl text-[14.5px] leading-snug font-medium text-[#0e2746]">{claim}</p>
          <Badge variant={getVariant(status)}>{getStatusLabel(status)}</Badge>
        </div>

        {/* Metadata row */}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <span className="rounded-full bg-[#e8eef8] px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#4a6882]">
            {category}
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#d9e6f4]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getConfidenceColor(status)}`}
                style={{ width: `${confPct}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-[#5f7c98]">{confPct}% confidence</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Reasoning */}
        <div>
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[#64819d]">
            AI Reasoning
          </p>
          <p className="text-[13.5px] leading-relaxed text-[#3d6080]">{reasoning}</p>
        </div>

        {/* Correction box */}
        {correction && (
          <div className="rounded-lg border-l-2 border-amber-400 bg-amber-50/60 px-4 py-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-amber-800 mb-1.5">
              ⚡ Suggested Correction
            </p>
            <p className="text-[13.5px] text-amber-900 leading-relaxed">{correction}</p>
          </div>
        )}

        {/* Evidence sources */}
        {evidence.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#64819d]">
                Evidence Sources ({evidence.length})
              </p>
              {evidence.length > 2 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-[11px] text-[#5278a0] hover:text-[#0e2f54] transition-colors"
                >
                  {expanded ? "Show less" : `Show all ${evidence.length}`}
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {(expanded ? evidence : evidence.slice(0, 2)).map((src) => {
                let hostname = "";
                try {
                  hostname = new URL(src.url).hostname;
                } catch {
                  hostname = "";
                }

                return (
                  <a
                    key={src.url}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-lg border border-border/80 bg-white p-3 transition-all hover:border-[#a0b8d4] hover:bg-[#f5f9ff] hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {hostname && (
                          <img
                            src={`https://www.google.com/s2/favicons?sz=32&domain=${hostname}`}
                            alt=""
                            className="h-3.5 w-3.5 rounded shrink-0 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <p className="line-clamp-1 text-[12.5px] font-semibold text-[#143b60] group-hover:underline">
                          {src.title}
                        </p>
                      </div>
                      <ExternalLink className="h-3 w-3 shrink-0 text-[#89a4be] mt-0.5" />
                    </div>
                  <p className="mt-1 truncate font-mono text-[10.5px] text-[#89a4be]">
                    {src.url.replace(/^https?:\/\//, "").slice(0, 50)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[12px] text-[#4a6b89] leading-relaxed">
                    {src.snippet}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-block rounded px-1.5 py-0.5 text-[9.5px] uppercase font-semibold tracking-wide bg-[#eef4fb] text-[#5278a0]">
                      {src.source}
                    </span>
                    {src.publishedAt && (
                      <span className="text-[9.5px] text-[#89a4be]">{src.publishedAt}</span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

        {evidence.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/60 bg-[#f8fbff] px-4 py-3">
            <p className="text-[12px] text-[#7a97b6]">
              No web sources were found for this claim. This may indicate the claim is too specific,
              uses proprietary data, or the search returned no relevant results.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
