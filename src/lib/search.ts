import type { SearchResult } from "@/types";
import { getTavilyKey, hasBrave, hasExa } from "./env";

const SEARCH_TIMEOUT_MS = 8000; // 8 second timeout per search provider

/**
 * Create an AbortController with automatic timeout.
 */
function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

/**
 * Search across multiple providers concurrently, with fallbacks.
 * Returns deduplicated, relevance-sorted results.
 */
export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  const providers = [
    searchTavily(query, maxResults),
    hasBrave() ? searchBrave(query, maxResults) : Promise.resolve([]),
    hasExa() ? searchExa(query, maxResults) : Promise.resolve([]),
  ];

  const results = await Promise.allSettled(providers);

  const merged: SearchResult[] = [];
  const seen = new Set<string>();

  for (const r of results) {
    if (r.status !== "fulfilled") {
      // Log failures silently — don't crash the pipeline
      if (r.status === "rejected") {
        console.warn("Search provider failed:", r.reason?.message ?? r.reason);
      }
      continue;
    }
    for (const item of r.value) {
      if (!item.url || seen.has(item.url)) continue;
      seen.add(item.url);
      merged.push(item);
    }
  }

  return merged
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults * 3); // Return more than needed so pipeline can pick the best
}

async function searchTavily(query: string, maxResults: number): Promise<SearchResult[]> {
  const apiKey = getTavilyKey();
  if (!apiKey) {
    console.warn("Tavily API key not configured");
    return [];
  }

  const { signal, clear } = withTimeout(SEARCH_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: false,
        include_raw_content: false,
      }),
      signal,
    });

    clear();

    if (!res.ok) {
      console.warn(`Tavily search failed: ${res.status} ${res.statusText}`);
      return [];
    }

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
      title: r.title ?? "Untitled",
      url: r.url,
      snippet: r.content ?? "",
      source: "tavily" as const,
      publishedAt: r.published_date,
      relevanceScore: typeof r.score === "number" ? r.score : 1 - i * 0.1,
    }));
  } catch (err) {
    clear();
    if ((err as Error)?.name === "AbortError") {
      console.warn("Tavily search timed out");
    } else {
      console.warn("Tavily search error:", err);
    }
    return [];
  }
}

async function searchBrave(query: string, maxResults: number): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];

  const { signal, clear } = withTimeout(SEARCH_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
        signal,
      }
    );

    clear();

    if (!res.ok) {
      console.warn(`Brave search failed: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as {
      web?: { results?: Array<{ title: string; url: string; description: string; age?: string }> };
    };

    return (data.web?.results ?? []).map((r, i) => ({
      title: r.title,
      url: r.url,
      snippet: r.description ?? "",
      source: "brave" as const,
      publishedAt: r.age,
      relevanceScore: 0.9 - i * 0.08,
    }));
  } catch (err) {
    clear();
    if ((err as Error)?.name === "AbortError") {
      console.warn("Brave search timed out");
    } else {
      console.warn("Brave search error:", err);
    }
    return [];
  }
}

async function searchExa(query: string, maxResults: number): Promise<SearchResult[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];

  const { signal, clear } = withTimeout(SEARCH_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        numResults: maxResults,
        useAutoprompt: true,
        contents: { text: { maxCharacters: 500 } },
      }),
      signal,
    });

    clear();

    if (!res.ok) {
      console.warn(`Exa search failed: ${res.status}`);
      return [];
    }

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
      relevanceScore: typeof r.score === "number" ? r.score : 0.85 - i * 0.07,
    }));
  } catch (err) {
    clear();
    if ((err as Error)?.name === "AbortError") {
      console.warn("Exa search timed out");
    } else {
      console.warn("Exa search error:", err);
    }
    return [];
  }
}

/**
 * Generate multiple search queries for a claim to maximize evidence coverage.
 */
export function generateSearchQueries(claim: string): string[] {
  // Clean up the claim text
  const base = claim.replace(/[^\w\s%$€£.,\-–—()'"/]/g, " ").replace(/\s+/g, " ").trim();
  const short = base.slice(0, 120);

  const queries = [
    short,
    `${short} fact check`,
    `${short} official statistics source`,
  ];

  // Add year-specific query if claim contains a year
  const yearMatch = claim.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    queries.push(`${short} ${yearMatch[0]} official report`);
  }

  return queries
    .map((q) => q.trim())
    .filter((q, i, arr) => q.length > 10 && arr.indexOf(q) === i)
    .slice(0, 3);
}
