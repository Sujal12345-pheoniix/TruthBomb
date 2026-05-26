"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ClaimCard } from "@/components/report/claim-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FactCheckReportContent } from "@/types";
import { RefreshCw, Download, Share2, CheckCircle2, XCircle, AlertCircle, HelpCircle } from "lucide-react";

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-4 shadow-sm">
      {icon && <div className="mb-2 text-current opacity-70">{icon}</div>}
      <p className="text-[10.5px] uppercase tracking-wider font-semibold text-[#526e8a]">{label}</p>
      <p className={`mt-1.5 font-mono text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function SkeletonReport() {
  return (
    <div className="max-w-5xl p-6 lg:p-8">
      <Skeleton className="h-4 w-28 mb-8" />
      <Skeleton className="h-10 w-72 mb-4" />
      <Skeleton className="h-20 w-full mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [report, setReport] = useState<FactCheckReportContent | null>(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id }),
      });
      const data = await res.json();
      if (res.ok && data.report) {
        setReport(data.report);
        setSummary(data.summary ?? "");
      } else {
        setError(data.error ?? "Report not found");
      }
    } catch {
      setError("Failed to load report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert("Report link copied to clipboard!");
    }
  };

  const filteredClaims = report?.claims.filter((c) => {
    if (activeFilter === "ALL") return true;
    return c.status === activeFilter;
  }) ?? [];

  const accuracyColor =
    !report
      ? "text-[#0e2f54]"
      : report.overallConfidence >= 0.75
      ? "text-emerald-700"
      : report.overallConfidence >= 0.5
      ? "text-amber-700"
      : "text-red-700";

  return (
    <DashboardShell>
      {loading ? (
        <SkeletonReport />
      ) : error ? (
        <div className="max-w-5xl p-6 lg:p-8">
          <Link href="/dashboard" className="text-[13px] text-[#597692] hover:text-[#1d476d]">
            ← Back to dashboard
          </Link>
          <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <XCircle className="mx-auto h-10 w-10 text-red-400 mb-4" />
            <h2 className="text-[18px] font-semibold text-red-800 mb-2">Report Not Available</h2>
            <p className="text-[14px] text-red-700 mb-6">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={load}
                className="flex items-center gap-2 rounded-md bg-red-100 px-4 py-2 text-[13px] font-medium text-red-800 hover:bg-red-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
              <button
                onClick={() => router.push(`/fact-check`)}
                className="rounded-md bg-[#0e2f54] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#123860] transition-colors"
              >
                Run Analysis First
              </button>
            </div>
          </div>
        </div>
      ) : report ? (
        <div className="max-w-5xl p-6 lg:p-8 print:p-4">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <Link href="/dashboard" className="text-[13px] text-[#597692] hover:text-[#1d476d] transition-colors">
              ← Back to dashboard
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-[12px] text-[#526e8a] hover:bg-[#f5f9ff] transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-[12px] text-[#526e8a] hover:bg-[#f5f9ff] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Report header */}
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="section-shell p-7 sm:p-8 mb-6"
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5f7c98]">
              Fact Check Report · TruthBomb
            </p>
            <h1 className="editorial-heading mt-2 text-2xl text-[#07253f] md:text-3xl break-all">
              {report.fileName}
            </h1>
            {summary && (
              <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-[#3f6382] border-t border-border/50 pt-4">
                {summary}
              </p>
            )}
          </motion.header>

          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-8"
          >
            <StatCard
              label="Total Claims"
              value={report.totalClaims}
              color="text-[#0e2f54]"
            />
            <StatCard
              label="Verified"
              value={report.verifiedCount}
              color="text-emerald-700"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            />
            <StatCard
              label="Inaccurate"
              value={report.inaccurateCount}
              color="text-amber-700"
              icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
            />
            <StatCard
              label="False"
              value={report.falseCount}
              color="text-red-700"
              icon={<XCircle className="h-4 w-4 text-red-600" />}
            />
            <StatCard
              label="Confidence"
              value={`${Math.round(report.overallConfidence * 100)}%`}
              color={accuracyColor}
              icon={<HelpCircle className="h-4 w-4 text-[#7a97b6]" />}
            />
          </motion.div>

          {/* Risk banner */}
          {report.totalClaims > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`mb-8 rounded-xl border px-5 py-4 ${
                report.falseCount > 0
                  ? "border-red-200 bg-red-50"
                  : report.inaccurateCount > 0
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <p className={`text-[13px] font-semibold ${
                report.falseCount > 0
                  ? "text-red-800"
                  : report.inaccurateCount > 0
                  ? "text-amber-800"
                  : "text-emerald-800"
              }`}>
                {report.falseCount > 0
                  ? `⚠️ Risk Alert: ${report.falseCount} false claim${report.falseCount > 1 ? "s" : ""} detected. Review before sharing this document.`
                  : report.inaccurateCount > 0
                  ? `📋 Notice: ${report.inaccurateCount} claim${report.inaccurateCount > 1 ? "s" : ""} may be outdated or partially inaccurate.`
                  : `✅ All ${report.totalClaims} claims verified against live sources. High credibility document.`}
              </p>
            </motion.div>
          )}

          {/* Claims section */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold text-[#0e2746]">
                Claim Analysis
                <span className="ml-2 text-[13px] font-normal text-[#6a839c]">
                  ({filteredClaims.length} of {report.totalClaims})
                </span>
              </h2>

              {/* Filter tabs */}
              {report.totalClaims > 0 && (
                <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
                  {[
                    { key: "ALL", label: "All" },
                    { key: "VERIFIED", label: "Verified" },
                    { key: "INACCURATE", label: "Inaccurate" },
                    { key: "FALSE", label: "False" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className={`rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-all ${
                        activeFilter === f.key
                          ? "bg-[#0e2f54] text-white shadow-sm"
                          : "text-[#526e8a] hover:bg-[#f0f5ff]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {report.totalClaims === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-white/70 p-12 text-center">
                <HelpCircle className="mx-auto h-10 w-10 text-[#a0b8d4] mb-4" />
                <p className="text-[15px] font-semibold text-[#3f6180] mb-2">No Claims Detected</p>
                <p className="max-w-md mx-auto text-[13.5px] text-[#7a97b6] leading-relaxed">
                  TruthBomb couldn&apos;t find specific verifiable claims in this document.
                  Try a document containing specific statistics, dates, financial figures, or named facts.
                </p>
                <Link
                  href="/fact-check"
                  className="mt-6 inline-block rounded-md bg-[#0e2f54] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#123860] transition-colors"
                >
                  Try Another PDF
                </Link>
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
                <p className="text-[14px] text-[#7a97b6]">No claims match this filter.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-5">
                  {filteredClaims.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                    >
                      <ClaimCard
                        claim={c.claim}
                        category={c.category}
                        status={c.status}
                        confidence={c.confidence}
                        reasoning={c.reasoning}
                        correction={c.correction}
                        evidence={c.evidence}
                      />
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </section>

          {/* Footer note */}
          <div className="mt-10 rounded-lg border border-border/60 bg-white/60 px-5 py-4 print:mt-6">
            <p className="text-[11.5px] text-[#7a97b6] leading-relaxed">
              <strong className="text-[#526e8a]">Disclaimer:</strong> TruthBomb uses AI to verify claims
              against publicly available web sources. Results should be used as a starting point for
              research, not as definitive fact. Always verify critical information with primary sources.
            </p>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
