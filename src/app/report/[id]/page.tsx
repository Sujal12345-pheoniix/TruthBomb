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
      <div className="p-6 lg:p-8 max-w-5xl">
        <Link href="/dashboard" className="text-[13px] text-stone-500 hover:text-stone-800">
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
            <header className="mt-6 border-b border-border pb-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
                Fact Check Report
              </p>
              <h1 className="editorial-heading mt-2 text-2xl text-stone-900 md:text-3xl">
                {report.fileName}
              </h1>
              {summary && (
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-600">
                  {summary}
                </p>
              )}
            </header>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: "Total", value: report.totalClaims },
                { label: "Verified", value: report.verifiedCount, color: "text-emerald-700" },
                { label: "False", value: report.falseCount, color: "text-red-700" },
                { label: "Outdated", value: report.outdatedCount, color: "text-amber-700" },
                {
                  label: "Confidence",
                  value: `${Math.round(report.overallConfidence * 100)}%`,
                  color: "text-stone-900",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-border bg-card px-4 py-3"
                >
                  <p className="text-[11px] uppercase tracking-wide text-stone-500">{s.label}</p>
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
