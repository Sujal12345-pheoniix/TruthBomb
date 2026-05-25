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
      const data = await res.json();
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
        <Link href="/dashboard" className="text-[13px] text-stone-500 hover:text-stone-800">
          ← Dashboard
        </Link>
        <h1 className="editorial-heading mt-4 text-3xl text-stone-900">GEO Analytics</h1>
        <p className="mt-2 max-w-xl text-stone-600">
          Analyze how visible your brand is across ChatGPT, Gemini, Claude, and Perplexity.
        </p>

        <div className="mt-10 rounded-xl border border-border bg-card p-6 space-y-4 max-w-lg">
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
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="text-[11px] uppercase tracking-wide text-stone-500">
                  Visibility Score
                </p>
                <p className="font-mono text-4xl text-stone-900 mt-1">
                  {Math.round(results.visibilityScore)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="text-[11px] uppercase tracking-wide text-stone-500">
                  Discoverability
                </p>
                <p className="font-mono text-4xl text-stone-900 mt-1">
                  {Math.round(results.discoverabilityScore)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-5 sm:col-span-1">
                <p className="text-[13px] text-stone-600 leading-relaxed">{results.summary}</p>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-sm font-medium mb-6">AI Mention Rankings</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "#292524" : "#a8a29e"} />
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
                  <div key={c.name} className="rounded-lg border border-border p-4">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium">{c.name}</p>
                      <span className="font-mono text-sm">{c.visibilityScore}</span>
                    </div>
                    <p className="mt-2 text-[13px] text-stone-600">
                      <span className="text-stone-500">Strengths:</span>{" "}
                      {c.strengths.join(" · ")}
                    </p>
                    <p className="mt-1 text-[13px] text-stone-600">
                      <span className="text-stone-500">Weaknesses:</span>{" "}
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
      <h2 className="text-sm font-medium text-stone-900">{title}</h2>
      {children ?? (
        <ul className="mt-4 space-y-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 text-[14px] text-stone-700 border-l border-border pl-4 py-1"
            >
              <span className="font-mono text-[11px] text-stone-400 shrink-0">
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
