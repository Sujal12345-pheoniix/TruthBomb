"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

type TrendPoint = { month: string; verified: number; geo: number };

interface ReportsPayload {
  documents: Array<{ createdAt: string; status: string }>;
  geoProjects: Array<{ createdAt: string; visibilityScore: number | null }>;
}

export default function InsightsPage() {
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);

  useEffect(() => {
    fetch("/api/reports?limit=200")
      .then((r) => r.json())
      .then((data: ReportsPayload) => setTrendData(buildTrendData(data)))
      .catch(() => setTrendData([]));
  }, []);

  return (
    <DashboardShell>
      <div className="p-6 lg:p-8">
        <h1 className="editorial-heading text-3xl text-[#0c2d4d]">AI Insights</h1>
        <p className="mt-1 text-[14px] text-[#53708b]">Trend overview across your workspace</p>

        <div className="mt-10 max-w-3xl rounded-xl border border-border bg-white/90 p-6 shadow-sm">
          <h2 className="mb-6 text-sm font-medium text-[#10385d]">Verification and GEO trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7e3f1" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5f7c98" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5f7c98" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="verified"
                  stroke="#1f5a95"
                  strokeWidth={2}
                  dot={false}
                  name="Verified rate"
                />
                <Line
                  type="monotone"
                  dataKey="geo"
                  stroke="#ff6b35"
                  strokeWidth={2}
                  dot={false}
                  name="GEO score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-[12px] text-[#6b849e]">
            Derived from your actual documents and GEO analyses from the last six months.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

function buildTrendData(data: ReportsPayload): TrendPoint[] {
  const now = new Date();
  const months: string[] = [];

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const byMonth = new Map<string, { docs: number; completed: number; geoTotal: number; geoCount: number }>();
  for (const key of months) {
    byMonth.set(key, { docs: 0, completed: 0, geoTotal: 0, geoCount: 0 });
  }

  for (const doc of data.documents ?? []) {
    const d = new Date(doc.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byMonth.get(key);
    if (!bucket) continue;
    bucket.docs += 1;
    if (doc.status === "COMPLETED") bucket.completed += 1;
  }

  for (const project of data.geoProjects ?? []) {
    const d = new Date(project.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byMonth.get(key);
    if (!bucket || project.visibilityScore == null) continue;
    bucket.geoTotal += project.visibilityScore;
    bucket.geoCount += 1;
  }

  return months.map((key) => {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    const bucket = byMonth.get(key)!;
    const verified = bucket.docs > 0 ? (bucket.completed / bucket.docs) * 100 : 0;
    const geo = bucket.geoCount > 0 ? bucket.geoTotal / bucket.geoCount : 0;
    return {
      month: date.toLocaleString("en-US", { month: "short" }),
      verified: Number(verified.toFixed(1)),
      geo: Number(geo.toFixed(1)),
    };
  });
}
