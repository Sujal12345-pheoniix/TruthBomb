import OpenAI from "openai";
import type { ExtractedClaim, VerificationOutput } from "@/types";
import { hasOpenAI } from "../env";

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!hasOpenAI()) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30 second request timeout
    });
  }
  return client;
}

/**
 * Strip markdown code fences that models sometimes wrap JSON in.
 * Handles: ```json ... ``` and ``` ... ```
 */
function stripCodeFences(text: string): string {
  // Remove leading/trailing whitespace
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  return cleaned.trim();
}

/**
 * Attempt to parse JSON with code fence stripping and basic repair.
 */
function safeParseJSON<T>(text: string): T | null {
  if (!text) return null;

  // Try direct parse first
  try {
    return JSON.parse(text) as T;
  } catch {
    // Strip code fences and try again
    try {
      return JSON.parse(stripCodeFences(text)) as T;
    } catch {
      // Try to extract JSON object/array from the string
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as T;
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}

export async function extractClaimsWithOpenAI(text: string): Promise<ExtractedClaim[]> {
  const c = getClient();
  if (!c) return [];

  try {
    const response = await c.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert fact-checking analyst. Extract specific, verifiable factual claims from the document text.

FOCUS ON:
- Statistics with exact numbers (percentages, figures, counts)
- Specific dates and time references  
- Financial figures (revenue, valuation, funding amounts)
- Technical specifications and metrics
- Named entities with specific attributes (company X did Y in year Z)

IGNORE: Opinions, vague statements, recommendations, generic descriptions.

OUTPUT EXACTLY:
{
  "claims": [
    {
      "claim": "exact verifiable statement",
      "category": "STATISTIC|DATE|FINANCIAL|TECHNICAL|SCIENTIFIC|GENERAL",
      "confidence": 0.0-1.0,
      "context": "brief surrounding context"
    }
  ]
}

Extract 5-15 distinct claims. Each claim must be self-contained and independently verifiable.`,
        },
        {
          role: "user",
          content: `Extract verifiable claims from this text:\n\n${text.slice(0, 10000)}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = safeParseJSON<{ claims: ExtractedClaim[] }>(content);
    if (!parsed?.claims || !Array.isArray(parsed.claims)) return [];

    return parsed.claims
      .filter((c) => c.claim && typeof c.claim === "string" && c.claim.trim().length >= 15)
      .map((c) => ({
        claim: c.claim.trim(),
        category: normalizeCategory(c.category),
        confidence: Math.min(1, Math.max(0, Number(c.confidence) || 0.7)),
        context: c.context || c.claim,
      }));
  } catch (err) {
    console.error("OpenAI claim extraction error:", err);
    return [];
  }
}

export async function verifyClaimWithOpenAI(
  claim: string,
  evidence: { title: string; url: string; snippet: string }[]
): Promise<VerificationOutput | null> {
  const c = getClient();
  if (!c) return null;

  const evidenceText = evidence.length > 0
    ? evidence.map((e, i) => `[${i + 1}] ${e.title}\nURL: ${e.url}\nSnippet: ${e.snippet}`).join("\n\n")
    : "No web evidence was found for this claim.";

  try {
    const response = await c.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You verify factual claims using ONLY the provided web evidence. Never invent facts or citations.

VERDICT RULES:
- VERIFIED: Evidence directly and explicitly supports the claim with matching values/dates
- FALSE: Evidence directly contradicts the claim with different facts
- OUTDATED: Claim was once true but evidence shows the situation has changed
- PARTIALLY_TRUE: Evidence partially supports but with significant differences in numbers/dates/scope
- NO_EVIDENCE: No reliable supporting evidence found (use when evidence is missing, weak, or irrelevant)

ANTI-HALLUCINATION: If evidence quality is low or irrelevant, return NO_EVIDENCE. Never guess.

Return exactly:
{
  "status": "VERIFIED|FALSE|OUTDATED|PARTIALLY_TRUE|NO_EVIDENCE",
  "confidence": 0.0-1.0,
  "reasoning": "concise explanation referencing specific evidence",
  "correction": "corrected fact if status is FALSE/OUTDATED, null otherwise",
  "searchQueries": []
}`,
        },
        {
          role: "user",
          content: `Claim to verify: "${claim}"\n\nEvidence:\n${evidenceText}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = safeParseJSON<{
      status: string;
      confidence: number;
      reasoning: string;
      correction?: string;
      searchQueries?: string[];
    }>(content);

    if (!parsed) return null;

    return {
      status: parsed.status as VerificationOutput["status"],
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      reasoning: parsed.reasoning || "Analysis complete.",
      correction: parsed.correction || undefined,
      searchQueries: parsed.searchQueries || [],
      evidence: [],
    };
  } catch (err) {
    console.error("OpenAI claim verification error:", err);
    return null;
  }
}

export async function generateGeoAnalysis(prompt: string): Promise<string> {
  const c = getClient();
  if (!c) throw new Error("OpenAI API key required for GEO analysis");

  try {
    const response = await c.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a GEO (Generative Engine Optimization) strategist analyzing brand visibility across AI systems (ChatGPT, Gemini, Claude, Perplexity).

Return detailed, realistic JSON matching this exact structure:
{
  "visibilityScore": number 0-100,
  "discoverabilityScore": number 0-100,
  "summary": "2-3 sentence strategic overview",
  "aiMentionRankings": [
    { "platform": "ChatGPT|Gemini|Claude|Perplexity", "rank": number, "mentionFrequency": number 0-100, "sentiment": "positive|neutral|negative" }
  ],
  "competitorAnalysis": [
    { "name": string, "visibilityScore": number, "strengths": string[], "weaknesses": string[] }
  ],
  "geoRecommendations": ["actionable recommendation"],
  "seoSuggestions": ["specific SEO action"],
  "threeMonthStrategy": ["Month 1: action", "Month 2: action", "Month 3: action"],
  "oneYearRoadmap": ["Q1: action", "Q2: action", "Q3: action", "Q4: action"]
}

Be specific, actionable, and grounded in real GEO strategy based on the brand domain and market.`,
        },
        { role: "user", content: prompt },
      ],
    });

    return response.choices[0]?.message?.content ?? "{}";
  } catch (err) {
    console.error("OpenAI GEO analysis error:", err);
    throw err;
  }
}

export async function generateReportSummary(content: string): Promise<string> {
  const c = getClient();
  if (!c) {
    return "Analysis complete. Review individual claim verifications below for detailed findings.";
  }

  try {
    const response = await c.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content:
            "Write a concise professional executive summary (3-4 sentences) for a fact-check report. Mention the document, key findings, and overall credibility assessment. No fluff, no bullet points — flowing prose.",
        },
        { role: "user", content },
      ],
    });

    return response.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.error("OpenAI report summary error:", err);
    return "";
  }
}

function normalizeCategory(cat: string): ExtractedClaim["category"] {
  const upper = (cat?.toUpperCase?.() ?? "GENERAL").trim();
  const valid = ["STATISTIC", "DATE", "FINANCIAL", "TECHNICAL", "SCIENTIFIC", "GENERAL"];
  return (valid.includes(upper) ? upper : "GENERAL") as ExtractedClaim["category"];
}
