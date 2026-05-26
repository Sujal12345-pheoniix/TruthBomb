import type { SearchResult } from "@/types";
import { getTavilyKey, hasBrave, hasExa } from "./env";

export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  const results = await Promise.allSettled([
    searchTavily(query, maxResults),
    hasBrave() ? searchBrave(query, maxResults) : Promise.resolve([]),
    hasExa() ? searchExa(query, maxResults) : Promise.resolve([]),
  ]);

  const merged: SearchResult[] = [];
  const seen = new Set<string>();

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const item of r.value) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      merged.push(item);
    }
  }

  return merged
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults * 2);
}

async function searchTavily(query: string, maxResults: number): Promise<SearchResult[]> {
  const apiKey = getTavilyKey();
  if (!apiKey) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: maxResults,
      include_answer: false,
    }),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{
      title: string;
      url: string;
      content: string;
      published_date?: string;
      score?: number;
    }>;
  };

  return (data.results ?? []).map((r, i) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
    source: "tavily" as const,
    publishedAt: r.published_date,
    relevanceScore: r.score ?? 1 - i * 0.1,
  }));
}

async function searchBrave(query: string, maxResults: number): Promise<SearchResult[]> {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`,
    {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY!,
      },
    }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    web?: { results?: Array<{ title: string; url: string; description: string; age?: string }> };
  };

  return (data.web?.results ?? []).map((r, i) => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
    source: "brave" as const,
    publishedAt: r.age,
    relevanceScore: 0.9 - i * 0.08,
  }));
}

async function searchExa(query: string, maxResults: number): Promise<SearchResult[]> {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.EXA_API_KEY!,
    },
    body: JSON.stringify({
      query,
      numResults: maxResults,
      useAutoprompt: true,
      contents: { text: { maxCharacters: 500 } },
    }),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{
      title: string;
      url: string;
      text?: string;
      publishedDate?: string;
      score?: number;
    }>;
  };

  return (data.results ?? []).map((r, i) => ({
    title: r.title ?? "Untitled",
    url: r.url,
    snippet: r.text ?? "",
    source: "exa" as const,
    publishedAt: r.publishedDate,
    relevanceScore: r.score ?? 0.85 - i * 0.07,
  }));
}

export function generateSearchQueries(claim: string): string[] {
  const base = claim.replace(/[^\w\s%$€£.-]/g, " ").replace(/\s+/g, " ").trim();
  const short = base.slice(0, 110);

  return [
    `"${short}"`,
    `${short} official report data`,
    `${short} statistics year source`,
  ].map((q) => q.trim());
}
