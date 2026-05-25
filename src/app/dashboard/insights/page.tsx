"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const trendData = [
  { month: "Jan", verified: 42, geo: 58 },
  { month: "Feb", verified: 48, geo: 62 },
  { month: "Mar", verified: 55, geo: 68 },
  { month: "Apr", verified: 61, geo: 72 },
  { month: "May", verified: 67, geo: 78 },
];

export default function InsightsPage() {
  return (
    <DashboardShell>
      <div className="p-6 lg:p-8">
        <h1 className="editorial-heading text-2xl text-stone-900">AI Insights</h1>
        <p className="mt-1 text-[14px] text-stone-500">Trend overview across your workspace</p>

        <div className="mt-10 rounded-xl border border-border bg-card p-6 max-w-2xl">
          <h2 className="text-sm font-medium mb-6">Verification & GEO trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="verified"
                  stroke="#292524"
                  strokeWidth={2}
                  dot={false}
                  name="Verified rate"
                />
                <Line
                  type="monotone"
                  dataKey="geo"
                  stroke="#a8a29e"
                  strokeWidth={2}
                  dot={false}
                  name="GEO score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-[12px] text-stone-400">
            Sample trend data — updates as you run more analyses
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
