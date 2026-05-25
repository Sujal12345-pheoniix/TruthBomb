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
        <h1 className="editorial-heading text-2xl text-stone-900">Analysis history</h1>
        <p className="mt-1 text-[14px] text-stone-500">All generated AI reports</p>

        <ul className="mt-8 rounded-lg border border-border divide-y divide-border">
          {loading ? (
            <li className="p-4">
              <Skeleton className="h-12 w-full" />
            </li>
          ) : reports.length ? (
            reports.map((r) => (
              <li key={r.id} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-[14px] font-medium">{r.title}</p>
                  <p className="text-[12px] text-stone-500">
                    {r.reportType.replace("_", " ")} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-stone-400">{r.id.slice(0, 8)}</span>
              </li>
            ))
          ) : (
            <li className="px-4 py-8 text-center text-stone-500 text-[13px]">No reports yet</li>
          )}
        </ul>

        <Link href="/dashboard" className="inline-block mt-6 text-[13px] text-stone-500 hover:text-stone-800">
          ← Overview
        </Link>
      </div>
    </DashboardShell>
  );
}
