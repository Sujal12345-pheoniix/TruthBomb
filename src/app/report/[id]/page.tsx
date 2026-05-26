"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ClaimCard } from "@/components/report/claim-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FactCheckReportContent } from "@/types";

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<FactCheckReportContent | null>(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: id }),
        });
        const data = await res.json();
        if (res.ok) {
          setReport(data.report);
          setSummary(data.summary ?? "");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <DashboardShell>
      <div className="max-w-5xl p-6 lg:p-8">
        <Link href="/dashboard" className="text-[13px] text-[#597692] hover:text-[#1d476d]">
          ← Back to dashboard
        </Link>

        {loading ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : report ? (
          <>
            <header className="section-shell mt-6 p-7 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f7c98]">
                Fact Check Report
              </p>
              <h1 className="editorial-heading mt-2 text-2xl text-[#0b2d4d] md:text-3xl">
                {report.fileName}
              </h1>
              {summary && (
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#3f6382]">
                  {summary}
                </p>
              )}
            </header>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: "Total", value: report.totalClaims },
                { label: "Verified", value: report.verifiedCount, color: "text-emerald-700" },
                {
                  label: "Inaccurate",
                  value: report.inaccurateCount,
                  color: "text-amber-700",
                },
                { label: "False", value: report.falseCount, color: "text-red-700" },
                {
                  label: "Confidence",
                  value: `${Math.round(report.overallConfidence * 100)}%`,
                  color: "text-[#0f355b]",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-border bg-white/90 px-4 py-3 shadow-sm"
                >
                  <p className="text-[11px] uppercase tracking-wide text-[#5f7c98]">{s.label}</p>
                  <p className={`mt-1 font-mono text-xl ${s.color ?? ""}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <section className="mt-12 space-y-6">
              <h2 className="text-sm font-medium text-stone-900">Claim analysis</h2>
              {report.claims.map((c) => (
                <ClaimCard
                  key={c.id}
                  claim={c.claim}
                  category={c.category}
                  status={c.status}
                  confidence={c.confidence}
                  reasoning={c.reasoning}
                  correction={c.correction}
                  evidence={c.evidence}
                />
              ))}
            </section>
          </>
        ) : (
          <p className="mt-8 text-stone-600">Report not found. Run analysis first.</p>
        )}
      </div>
    </DashboardShell>
  );
}
