"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { FileText, Globe2, ArrowUpRight } from "lucide-react";

interface DashboardData {
  documents: Array<{
    id: string;
    fileName: string;
    status: string;
    createdAt: string;
    _count: { claims: number };
  }>;
  geoProjects: Array<{
    id: string;
    brandName: string;
    visibilityScore: number | null;
    status: string;
    createdAt: string;
  }>;
  reports: Array<{
    id: string;
    title: string;
    reportType: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="editorial-heading text-2xl text-stone-900">Overview</h1>
            <p className="mt-1 text-[14px] text-stone-500">
              Your fact-check and GEO analysis workspace
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/fact-check"
              className="rounded-md bg-stone-900 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-stone-800"
            >
              New fact check
            </Link>
            <Link
              href="/geo"
              className="rounded-md border border-border px-3 py-1.5 text-[13px] hover:bg-muted"
            >
              GEO analysis
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Documents"
            value={data?.documents.length ?? 0}
            loading={loading}
          />
          <StatCard
            label="GEO Projects"
            value={data?.geoProjects.length ?? 0}
            loading={loading}
          />
          <StatCard label="Reports" value={data?.reports.length ?? 0} loading={loading} />
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-stone-400" />
                Recent documents
              </h2>
              <Link href="/fact-check" className="text-[13px] text-stone-500 hover:text-stone-800">
                Upload →
              </Link>
            </div>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ul className="rounded-lg border border-border divide-y divide-border">
                {(data?.documents ?? []).slice(0, 6).map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/report/${doc.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors group"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-stone-800 group-hover:underline">
                          {doc.fileName}
                        </p>
                        <p className="text-[12px] text-stone-500 mt-0.5">
                          {doc._count.claims} claims · {doc.status} · {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-stone-600" />
                    </Link>
                  </li>
                ))}
                {!data?.documents.length && (
                  <li className="px-4 py-8 text-center text-[13px] text-stone-500">
                    No documents yet
                  </li>
                )}
              </ul>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-stone-400" />
                GEO projects
              </h2>
              <Link href="/geo" className="text-[13px] text-stone-500 hover:text-stone-800">
                Analyze →
              </Link>
            </div>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ul className="rounded-lg border border-border divide-y divide-border">
                {(data?.geoProjects ?? []).slice(0, 6).map((p) => (
                  <li key={p.id} className="px-4 py-3">
                    <div className="flex justify-between">
                      <p className="text-[14px] font-medium">{p.brandName}</p>
                      {p.visibilityScore != null && (
                        <span className="font-mono text-sm">{Math.round(p.visibilityScore)}</span>
                      )}
                    </div>
                    <p className="text-[12px] text-stone-500 mt-0.5">
                      {p.status} · {formatDate(p.createdAt)}
                    </p>
                  </li>
                ))}
                {!data?.geoProjects.length && (
                  <li className="px-4 py-8 text-center text-[13px] text-stone-500">
                    No GEO projects yet
                  </li>
                )}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-4">
      <p className="text-[11px] uppercase tracking-wide text-stone-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-12" />
      ) : (
        <p className="mt-1 font-mono text-3xl text-stone-900">{value}</p>
      )}
    </div>
  );
}
