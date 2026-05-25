"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

const data = [
  { platform: "Perplexity", score: 78 },
  { platform: "ChatGPT", score: 65 },
  { platform: "Gemini", score: 58 },
  { platform: "Claude", score: 52 },
];

export function GeoPreview() {
  return (
    <section className="border-b border-border bg-stone-50/50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-stone-500">
              GEO Analytics
            </p>
            <h2 className="editorial-heading mt-3 text-3xl text-stone-900">
              How AI engines see your brand
            </h2>
            <p className="mt-4 text-stone-600 leading-relaxed">
              Track visibility across ChatGPT, Gemini, Claude, and Perplexity.
              Compare competitors and get actionable GEO growth strategies.
            </p>
            <ul className="mt-8 space-y-3 text-[14px] text-stone-700">
              {[
                "AI discoverability score",
                "Competitor mention analysis",
                "3-month growth strategy",
                "1-year monetization roadmap",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-stone-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-sm text-stone-500">Visibility Score</p>
                <p className="font-mono text-4xl text-stone-900">72</p>
              </div>
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[12px] font-medium text-emerald-800">
                +8% vs last month
              </span>
            </div>
            <div className="mt-8 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="platform"
                    width={80}
                    tick={{ fontSize: 12, fill: "#78716c" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      border: "1px solid #e7e5e4",
                      borderRadius: 6,
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#292524" : "#d6d3d1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
