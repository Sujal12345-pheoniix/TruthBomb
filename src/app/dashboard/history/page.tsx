"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
  const [reports, setReports] = useState<
    Array<{ id: string; title: string; reportType: string; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <div className="p-6 lg:p-8 max-w-3xl">
        <h1 className="editorial-heading text-3xl text-[#0c2d4d]">Analysis history</h1>
        <p className="mt-1 text-[14px] text-[#53708b]">All generated AI reports</p>

        <ul className="mt-8 divide-y divide-border rounded-lg border border-border bg-white/90 shadow-sm">
          {loading ? (
            <li className="p-4">
              <Skeleton className="h-12 w-full" />
            </li>
          ) : reports.length ? (
            reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[14px] font-medium text-[#143b60]">{r.title}</p>
                  <p className="text-[12px] text-[#6a849d]">
                    {r.reportType.replace("_", " ")} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-[#8ba6bf]">{r.id.slice(0, 8)}</span>
              </li>
            ))
          ) : (
            <li className="px-4 py-8 text-center text-[13px] text-[#6284a7]">No reports yet</li>
          )}
        </ul>

        <Link href="/dashboard" className="mt-6 inline-block text-[13px] text-[#5c7a97] hover:text-[#1d476d]">
          ← Overview
        </Link>
      </div>
    </DashboardShell>
  );
}
