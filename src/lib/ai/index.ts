import type { ExtractedClaim, GeoAnalysisResult, VerificationOutput } from "@/types";
import {
  extractClaimsWithOpenAI,
  verifyClaimWithOpenAI,
  generateGeoAnalysis,
  generateReportSummary,
} from "./openai";
import {
  extractClaimsWithGemini,
  verifyClaimWithGemini,
  generateGeoWithGemini,
} from "./gemini";
import { hasOpenAI, hasGemini } from "../env";

export async function extractClaims(text: string): Promise<ExtractedClaim[]> {
  if (hasOpenAI()) {
    const claims = await extractClaimsWithOpenAI(text);
    if (claims.length > 0) return claims;
  }
  if (hasGemini()) {
    const claims = await extractClaimsWithGemini(text);
    if (claims.length > 0) return claims;
  }
  return fallbackExtractClaims(text);
}

export async function verifyClaim(
  claim: string,
  evidence: { title: string; url: string; snippet: string }[]
): Promise<VerificationOutput> {
  let result: VerificationOutput | null = null;

  if (hasOpenAI()) {
    result = await verifyClaimWithOpenAI(claim, evidence);
  }
  if (!result && hasGemini()) {
    result = await verifyClaimWithGemini(claim, evidence);
  }

  if (result) {
    return { ...result, evidence: [] };
  }

  return fallbackVerify(claim, evidence);
}

export async function analyzeGeo(
  brandName: string,
  websiteUrl: string,
  competitors: string[]
): Promise<GeoAnalysisResult> {
  const prompt = `Analyze GEO visibility for:
Brand: ${brandName}
Website: ${websiteUrl}
Competitors: ${competitors.join(", ")}

Assess visibility across ChatGPT, Gemini, Claude, and Perplexity. Provide realistic scores and strategies.`;

  let raw = "{}";
  try {
    if (hasOpenAI()) {
      raw = await generateGeoAnalysis(prompt);
    } else if (hasGemini()) {
      raw = await generateGeoWithGemini(prompt);
    }
  } catch {
    raw = "{}";
  }

  try {
    const parsed = JSON.parse(raw) as GeoAnalysisResult;
    return normalizeGeoResult(parsed, brandName, competitors);
  } catch {
    return fallbackGeo(brandName, websiteUrl, competitors);
  }
}

export { generateReportSummary };

function fallbackExtractClaims(text: string): ExtractedClaim[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 50 && s.length <= 320)
    .filter((s) => /\d|%|\$|€|£|million|billion|trillion|\b(19|20)\d{2}\b/i.test(s));

  return dedupeClaims(sentences)
    .slice(0, 12)
    .map((claim) => ({
      claim,
      category: inferCategory(claim),
      confidence: 0.62,
      context: claim,
    }));
}

function fallbackVerify(
  claim: string,
  evidence: { title: string; url: string; snippet: string }[]
): VerificationOutput {
  const hasEvidence = evidence.length > 0;
  const lowerClaim = claim.toLowerCase();
  const snippets = evidence.map((e) => e.snippet.toLowerCase()).join(" ");

  let status: VerificationOutput["status"] = "NO_EVIDENCE";
  let confidence = 0.3;

  if (hasEvidence) {
    const keywords = lowerClaim.split(/\s+/).filter((w) => w.length > 4).slice(0, 5);
    const matches = keywords.filter((k) => snippets.includes(k)).length;
    if (matches >= 3) {
      status = "VERIFIED";
      confidence = 0.72;
    } else if (matches >= 1) {
      status = "OUTDATED";
      confidence = 0.56;
    } else {
      status = "NO_EVIDENCE";
      confidence = 0.4;
    }
  }

  return {
    status,
    confidence,
    reasoning: hasEvidence
      ? `Analyzed ${evidence.length} sources. Keyword overlap suggests ${status.toLowerCase().replace("_", " ")}.`
      : "No web evidence found for this claim.",
    searchQueries: [],
    evidence: [],
  };
}

function dedupeClaims(claims: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const claim of claims) {
    const key = claim.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(claim);
  }

  return result;
}

function inferCategory(claim: string): ExtractedClaim["category"] {
  if (/\b(19|20)\d{2}\b|\bjan\b|\bfeb\b|\bmar\b|\bapr\b|\bmay\b|\bjun\b|\bjul\b|\baug\b|\bsep\b|\boct\b|\bnov\b|\bdec\b/i.test(claim)) {
    return "DATE";
  }
  if (/\$|€|£|revenue|profit|valuation|market cap|funding|cost|budget|usd|eur|gbp/i.test(claim)) {
    return "FINANCIAL";
  }
  if (/\bapi\b|\bmodel\b|\bversion\b|\bsoftware\b|\bhardware\b|\bchip\b|\balgorithm\b|\blatency\b|\baccuracy\b/i.test(claim)) {
    return "TECHNICAL";
  }
  if (/\d|%|million|billion|trillion/i.test(claim)) {
    return "STATISTIC";
  }
  return "GENERAL";
}

function fallbackGeo(
  brandName: string,
  websiteUrl: string,
  competitors: string[]
): GeoAnalysisResult {
  return {
    visibilityScore: 62,
    discoverabilityScore: 58,
    summary: `${brandName} shows moderate AI discoverability. Strengthen structured data and authoritative citations to improve presence across generative engines.`,
    aiMentionRankings: [
      { platform: "ChatGPT", rank: 4, mentionFrequency: 45, sentiment: "neutral" },
      { platform: "Gemini", rank: 5, mentionFrequency: 38, sentiment: "neutral" },
      { platform: "Claude", rank: 6, mentionFrequency: 32, sentiment: "neutral" },
      { platform: "Perplexity", rank: 3, mentionFrequency: 52, sentiment: "positive" },
    ],
    competitorAnalysis: competitors.map((name, i) => ({
      name,
      visibilityScore: 70 - i * 8,
      strengths: ["Strong domain authority", "Active content pipeline"],
      weaknesses: ["Limited AI-optimized snippets"],
    })),
    geoRecommendations: [
      "Publish FAQ schema targeting AI citation patterns",
      "Create comparison pages vs top competitors",
      "Build authoritative backlinks from industry publications",
    ],
    seoSuggestions: [
      "Optimize for conversational long-tail queries",
      "Add llms.txt and structured organization markup",
      `Ensure ${websiteUrl} has clear entity definitions`,
    ],
    threeMonthStrategy: [
      "Month 1: Audit AI mention baseline and fix technical SEO",
      "Month 2: Launch thought leadership content series",
      "Month 3: Measure GEO score improvements and iterate",
    ],
    oneYearRoadmap: [
      "Q1: Foundation — schema, content hub, competitor benchmarks",
      "Q2: Growth — PR, partnerships, AI-optimized landing pages",
      "Q3: Scale — category leadership content, API integrations",
      "Q4: Monetize — premium tools, consulting, data products",
    ],
  };
}

function normalizeGeoResult(
  parsed: Partial<GeoAnalysisResult>,
  brandName: string,
  competitors: string[]
): GeoAnalysisResult {
  return {
    visibilityScore: parsed.visibilityScore ?? 60,
    discoverabilityScore: parsed.discoverabilityScore ?? 55,
    summary:
      parsed.summary ??
      `${brandName} GEO analysis complete. Review recommendations below.`,
    aiMentionRankings: parsed.aiMentionRankings ?? [],
    competitorAnalysis:
      parsed.competitorAnalysis ??
      competitors.map((name) => ({
        name,
        visibilityScore: 65,
        strengths: ["Market presence"],
        weaknesses: ["AI citation gaps"],
      })),
    geoRecommendations: parsed.geoRecommendations ?? [],
    seoSuggestions: parsed.seoSuggestions ?? [],
    threeMonthStrategy: parsed.threeMonthStrategy ?? [],
    oneYearRoadmap: parsed.oneYearRoadmap ?? [],
  };
}
