import type { ExtractedClaim, VerificationOutput } from "@/types";
import { hasGemini } from "../env";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const GEMINI_TIMEOUT_MS = 25000;

/**
 * Strip code fences from Gemini's JSON responses.
 */
function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

/**
 * Safe JSON parse with fallback to code-fence stripping.
 */
function safeParseJSON<T>(text: string): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    try {
      return JSON.parse(stripCodeFences(text)) as T;
    } catch {
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) {
        try {
          return JSON.parse(match[0]) as T;
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}

async function geminiGenerate(
  prompt: string,
  system?: string,
  options?: { maxOutputTokens?: number; temperature?: number }
): Promise<string> {
  if (!hasGemini()) return "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const userContent = system
      ? `System instructions: ${system}\n\n---\n\nUser request: ${prompt}`
      : prompt;

    const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userContent }],
          },
        ],
        generationConfig: {
          temperature: options?.temperature ?? 0.2,
          responseMimeType: "application/json",
          maxOutputTokens: options?.maxOutputTokens ?? 4096,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.warn(`Gemini API error ${res.status}:`, errorText.slice(0, 200));
      return "";
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message: string };
    };

    if (data.error) {
      console.warn("Gemini API returned error:", data.error.message);
      return "";
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error)?.name === "AbortError") {
      console.warn("Gemini request timed out");
    } else {
      console.warn("Gemini request failed:", err);
    }
    return "";
  }
}

export async function extractClaimsWithGemini(text: string): Promise<ExtractedClaim[]> {
  const content = await geminiGenerate(
    text.slice(0, 10000),
    `You are an expert fact-checking analyst. Extract specific verifiable factual claims.
FOCUS ON: statistics with numbers, specific dates, financial figures, technical metrics, named entities with specific attributes.
IGNORE: opinions, vague statements, generic descriptions.
OUTPUT JSON ONLY: { "claims": [{ "claim": string, "category": "STATISTIC|DATE|FINANCIAL|TECHNICAL|SCIENTIFIC|GENERAL", "confidence": 0.0-1.0, "context": string }] }
Extract 5-15 distinct claims.`
  );

  if (!content) return [];

  const parsed = safeParseJSON<{ claims: ExtractedClaim[] }>(content);
  if (!parsed?.claims || !Array.isArray(parsed.claims)) return [];

  return parsed.claims
    .filter((c) => c.claim && typeof c.claim === "string" && c.claim.trim().length >= 15)
    .map((c) => ({
      claim: c.claim.trim(),
      category: normalizeCategory(String(c.category || "GENERAL")),
      confidence: Math.min(1, Math.max(0, Number(c.confidence) || 0.7)),
      context: c.context || c.claim,
    }));
}

export async function verifyClaimWithGemini(
  claim: string,
  evidence: { title: string; url: string; snippet: string }[]
): Promise<VerificationOutput | null> {
  const evidenceText =
    evidence.length > 0
      ? evidence.map((e, i) => `[${i + 1}] ${e.title} - ${e.url}: ${e.snippet}`).join("\n")
      : "No web evidence was found for this claim.";

  const content = await geminiGenerate(
    `Claim: "${claim}"\n\nEvidence:\n${evidenceText}`,
    `Verify the claim using ONLY the provided evidence. Never hallucinate facts.
VERDICTS: VERIFIED (evidence supports), FALSE (contradicts), OUTDATED (was true, now changed), PARTIALLY_TRUE (partially supported), NO_EVIDENCE (no relevant evidence).
OUTPUT JSON ONLY: { "status": string, "confidence": 0.0-1.0, "reasoning": string, "correction": string|null, "searchQueries": [] }`
  );

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
}

export async function generateGeoWithGemini(prompt: string): Promise<string> {
  return geminiGenerate(
    prompt,
    `GEO (Generative Engine Optimization) analyst. Analyze brand AI visibility.
OUTPUT JSON with fields: visibilityScore (0-100), discoverabilityScore (0-100), summary, aiMentionRankings, competitorAnalysis, geoRecommendations, seoSuggestions, threeMonthStrategy, oneYearRoadmap.`,
    { maxOutputTokens: 4096, temperature: 0.3 }
  );
}

export async function generateReportSummaryWithGemini(content: string): Promise<string> {
  return geminiGenerate(
    content,
    `Write a concise professional executive summary (3-4 sentences) for a fact-check report. Mention the document, key findings, and overall credibility assessment. No bullets, no fluff.`,
    { maxOutputTokens: 900, temperature: 0.25 }
  );
}

function normalizeCategory(cat: string): ExtractedClaim["category"] {
  const upper = cat.toUpperCase().trim();
  const valid = ["STATISTIC", "DATE", "FINANCIAL", "TECHNICAL", "SCIENTIFIC", "GENERAL"];
  return (valid.includes(upper) ? upper : "GENERAL") as ExtractedClaim["category"];
}
