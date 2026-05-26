"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { GeoAnalysisResult } from "@/types";

export default function GeoPage() {
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/geo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          websiteUrl,
          competitors: competitors
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      });
        const data = await readResponseJson(res);
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResults(data.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    results?.aiMentionRankings.map((r) => ({
      platform: r.platform,
      score: r.mentionFrequency,
    })) ?? [];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/dashboard" className="text-[13px] text-[#5c7a97] hover:text-[#1d476d]">
          ← Dashboard
        </Link>
        <h1 className="editorial-heading mt-4 text-4xl text-[#0b2d4d]">GEO Analytics</h1>
        <p className="mt-2 max-w-xl text-[#3f6280]">
          Analyze how visible your brand is across ChatGPT, Gemini, Claude, and Perplexity.
        </p>

        <div className="section-shell mt-10 max-w-lg space-y-4 p-6">
          <div>
            <Label htmlFor="brand">Brand name</Label>
            <Input
              id="brand"
              className="mt-1.5"
              placeholder="Acme Corp"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              className="mt-1.5"
              placeholder="https://acme.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="competitors">Competitors (comma-separated)</Label>
            <Input
              id="competitors"
              className="mt-1.5"
              placeholder="Competitor A, Competitor B"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
            />
          </div>
          <Button
            onClick={analyze}
            disabled={loading || !brandName || !websiteUrl || !competitors}
          >
            {loading ? "Analyzing…" : "Run GEO analysis"}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {loading && (
          <div className="mt-12 space-y-4">
            <Skeleton className="h-32 w-full max-w-2xl" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {results && (
          <div className="mt-14 space-y-12">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-white/90 p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-[#63809d]">
                  Visibility Score
                </p>
                <p className="mt-1 font-mono text-4xl text-[#0f355b]">
                  {Math.round(results.visibilityScore)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white/90 p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-[#63809d]">
                  Discoverability
                </p>
                <p className="mt-1 font-mono text-4xl text-[#0f355b]">
                  {Math.round(results.discoverabilityScore)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white/90 p-5 shadow-sm sm:col-span-1">
                <p className="text-[13px] leading-relaxed text-[#3f6382]">{results.summary}</p>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="rounded-xl border border-border bg-white/92 p-6 shadow-sm">
                <h2 className="mb-6 text-sm font-medium text-[#12395f]">AI Mention Rankings</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="platform" tick={{ fontSize: 12, fill: "#5f7c98" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#5f7c98" }} />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "#1f5a95" : "#9cb8d4"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <GeoSection title="Competitor Analysis" items={[]}>
              <div className="grid gap-4 md:grid-cols-2">
                {results.competitorAnalysis.map((c) => (
                  <div key={c.name} className="rounded-lg border border-border bg-white/90 p-4">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium text-[#12395f]">{c.name}</p>
                      <span className="font-mono text-sm text-[#2d5377]">{c.visibilityScore}</span>
                    </div>
                    <p className="mt-2 text-[13px] text-[#416583]">
                      <span className="text-[#63809d]">Strengths:</span>{" "}
                      {c.strengths.join(" · ")}
                    </p>
                    <p className="mt-1 text-[13px] text-[#416583]">
                      <span className="text-[#63809d]">Weaknesses:</span>{" "}
                      {c.weaknesses.join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </GeoSection>

            <GeoSection title="GEO Recommendations" items={results.geoRecommendations} />
            <GeoSection title="SEO + AI-Search Suggestions" items={results.seoSuggestions} />
            <GeoSection title="3-Month Strategy" items={results.threeMonthStrategy} />
            <GeoSection title="1-Year Monetization Roadmap" items={results.oneYearRoadmap} />
          </div>
        )}
      </main>
    </>
  );
}

async function readResponseJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function GeoSection({
  title,
  items,
  children,
}: {
  title: string;
  items: string[];
  children?: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-medium text-[#113a60]">{title}</h2>
      {children ?? (
        <ul className="mt-4 space-y-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 border-l border-border py-1 pl-4 text-[14px] text-[#3f6280]"
            >
              <span className="shrink-0 font-mono text-[11px] text-[#89a4be]">
                {String(i + 1).padStart(2, "0")}
              </span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
