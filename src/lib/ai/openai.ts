import OpenAI from "openai";
import type { ExtractedClaim, VerificationOutput } from "@/types";
import { hasOpenAI } from "../env";

const client = hasOpenAI()
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function extractClaimsWithOpenAI(text: string): Promise<ExtractedClaim[]> {
  if (!client) return [];

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a fact-checking analyst.
      Extract only specific, verifiable claims from the provided document text.
      Priority: statistics, dates, financial figures, technical metrics/specifications.
      Rules:
      - Ignore opinions, recommendations, and vague statements.
      - Keep each claim atomic and self-contained.
      - Prefer claims with concrete values (numbers, percentages, years, currency, units).
      Categories: STATISTIC, DATE, FINANCIAL, TECHNICAL, SCIENTIFIC, GENERAL.
      Return strict JSON: { "claims": [{ "claim": string, "category": string, "confidence": 0-1, "context": string }] }
      Extract 6-14 distinct claims maximum.`,
      },
      {
        role: "user",
        content: text.slice(0, 10000),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content) as { claims: ExtractedClaim[] };
    return (parsed.claims ?? []).map((c) => ({
      claim: c.claim,
      category: normalizeCategory(c.category),
      confidence: Math.min(1, Math.max(0, c.confidence ?? 0.7)),
      context: c.context,
    }));
  } catch {
    return [];
  }
}

export async function verifyClaimWithOpenAI(
  claim: string,
  evidence: { title: string; url: string; snippet: string }[]
): Promise<VerificationOutput | null> {
  if (!client) return null;

  const evidenceText = evidence
    .map((e, i) => `[${i + 1}] ${e.title}\nURL: ${e.url}\n${e.snippet}`)
    .join("\n\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You verify factual claims using only the provided web evidence.
      Status must be one of: VERIFIED, FALSE, OUTDATED, PARTIALLY_TRUE, NO_EVIDENCE.
      Decision policy:
      - VERIFIED: evidence directly supports the claim with matching values/date context.
      - OUTDATED or PARTIALLY_TRUE: evidence partially matches but indicates changed values/date/version.
      - FALSE: evidence directly contradicts the claim.
      - NO_EVIDENCE: no reliable supporting evidence is found in provided sources.
      If evidence quality is weak, avoid over-claiming certainty.
Return JSON: {
  "status": string,
  "confidence": 0-1,
  "reasoning": string,
  "correction": string or null,
  "searchQueries": string[]
}`,
      },
      {
        role: "user",
        content: `Claim: "${claim}"\n\nEvidence:\n${evidenceText || "No evidence found."}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    return {
      status: parsed.status,
      confidence: parsed.confidence ?? 0.5,
      reasoning: parsed.reasoning ?? "",
      correction: parsed.correction,
      searchQueries: parsed.searchQueries ?? [],
      evidence: [],
    };
  } catch {
    return null;
  }
}

export async function generateGeoAnalysis(prompt: string): Promise<string> {
  if (!client) throw new Error("OpenAI API key required for GEO analysis");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a GEO (Generative Engine Optimization) strategist analyzing brand visibility across AI systems (ChatGPT, Gemini, Claude, Perplexity).
Return detailed JSON matching this structure:
{
  "visibilityScore": number 0-100,
  "discoverabilityScore": number 0-100,
  "summary": string,
  "aiMentionRankings": [{ "platform": string, "rank": number, "mentionFrequency": number 0-100, "sentiment": string }],
  "competitorAnalysis": [{ "name": string, "visibilityScore": number, "strengths": string[], "weaknesses": string[] }],
  "geoRecommendations": string[],
  "seoSuggestions": string[],
  "threeMonthStrategy": string[],
  "oneYearRoadmap": string[]
}
Be specific, actionable, and realistic based on the brand domain.`,
      },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0]?.message?.content ?? "{}";
}

export async function generateReportSummary(content: string): Promise<string> {
  if (!client) return "Analysis complete. Review individual claim verifications below.";

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 400,
    messages: [
      {
        role: "system",
        content:
          "Write a concise executive summary (3-4 sentences) for a fact-check report. Professional tone, no fluff.",
      },
      { role: "user", content },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

function normalizeCategory(cat: string): ExtractedClaim["category"] {
  const upper = cat?.toUpperCase?.() ?? "GENERAL";
  const valid = ["STATISTIC", "DATE", "FINANCIAL", "TECHNICAL", "SCIENTIFIC", "GENERAL"];
  return (valid.includes(upper) ? upper : "GENERAL") as ExtractedClaim["category"];
}
