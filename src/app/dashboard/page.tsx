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
            <h1 className="editorial-heading text-3xl text-[#0c2d4d]">Overview</h1>
            <p className="mt-1 text-[14px] text-[#53708b]">
              Your fact-check and GEO analysis workspace
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/fact-check"
              className="rounded-md bg-gradient-to-r from-[#123a61] to-[#1f6ab2] px-3 py-1.5 text-[13px] font-medium text-white shadow-sm transition-all hover:-translate-y-0.5"
            >
              New fact check
            </Link>
            <Link
              href="/geo"
              className="rounded-md border border-border bg-white/80 px-3 py-1.5 text-[13px] text-[#315270] hover:bg-white"
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
              <h2 className="flex items-center gap-2 text-sm font-medium text-[#113a60]">
                <FileText className="h-4 w-4 text-[#6e8daa]" />
                Recent documents
              </h2>
              <Link href="/fact-check" className="text-[13px] text-[#5c7a97] hover:text-[#1e476d]">
                Upload →
              </Link>
            </div>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-white/90">
                {(data?.documents ?? []).slice(0, 6).map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/report/${doc.id}`}
                      className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#f2f7fd]"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-[#143b60] group-hover:underline">
                          {doc.fileName}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#6a849d]">
                          {doc._count.claims} claims · {doc.status} · {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#89a4be] group-hover:text-[#3a6489]" />
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
              <h2 className="flex items-center gap-2 text-sm font-medium text-[#113a60]">
                <Globe2 className="h-4 w-4 text-[#6e8daa]" />
                GEO projects
              </h2>
              <Link href="/geo" className="text-[13px] text-[#5c7a97] hover:text-[#1e476d]">
                Analyze →
              </Link>
            </div>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-white/90">
                {(data?.geoProjects ?? []).slice(0, 6).map((p) => (
                  <li key={p.id} className="px-4 py-3">
                    <div className="flex justify-between">
                      <p className="text-[14px] font-medium text-[#143b60]">{p.brandName}</p>
                      {p.visibilityScore != null && (
                        <span className="font-mono text-sm text-[#3a6489]">{Math.round(p.visibilityScore)}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] text-[#6a849d]">
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
    <div className="rounded-lg border border-border bg-white/90 px-5 py-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-[#63809d]">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-12" />
      ) : (
        <p className="mt-1 font-mono text-3xl text-[#0f355b]">{value}</p>
      )}
    </div>
  );
}
