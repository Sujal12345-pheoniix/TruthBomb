import type { ExtractedClaim, VerificationOutput } from "@/types";
import { hasGemini } from "../env";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function geminiGenerate(prompt: string, system?: string): Promise<string> {
  if (!hasGemini()) return "";

  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        ...(system
          ? [{ role: "user", parts: [{ text: `System: ${system}\n\nUser: ${prompt}` }] }]
          : [{ role: "user", parts: [{ text: prompt }] }]),
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) return "";

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function extractClaimsWithGemini(text: string): Promise<ExtractedClaim[]> {
  const content = await geminiGenerate(
    text.slice(0, 10000),
    `Extract only specific verifiable factual claims. Focus on statistics, dates, financial numbers, and technical figures/specs. Ignore opinions and generic statements. Return strict JSON: { "claims": [{ "claim", "category", "confidence", "context" }] }. Categories: STATISTIC, DATE, FINANCIAL, TECHNICAL, SCIENTIFIC, GENERAL. Provide 6-14 distinct claims maximum.`
  );

  if (!content) return [];

  try {
    const parsed = JSON.parse(content) as { claims: ExtractedClaim[] };
    return parsed.claims ?? [];
  } catch {
    return [];
  }
}

export async function verifyClaimWithGemini(
  claim: string,
  evidence: { title: string; url: string; snippet: string }[]
): Promise<VerificationOutput | null> {
  const evidenceText = evidence
    .map((e, i) => `[${i + 1}] ${e.title} - ${e.url}: ${e.snippet}`)
    .join("\n");

  const content = await geminiGenerate(
    `Claim: "${claim}"\nEvidence:\n${evidenceText}`,
    `Verify the claim using only provided evidence. Return JSON with status (VERIFIED|FALSE|OUTDATED|PARTIALLY_TRUE|NO_EVIDENCE), confidence 0-1, reasoning, correction, searchQueries. Use NO_EVIDENCE when support is missing. Use OUTDATED or PARTIALLY_TRUE when values/date context changed.`
  );

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

export async function generateGeoWithGemini(prompt: string): Promise<string> {
  return geminiGenerate(
    prompt,
    `GEO analyst. Return JSON with visibilityScore, discoverabilityScore, summary, aiMentionRankings, competitorAnalysis, geoRecommendations, seoSuggestions, threeMonthStrategy, oneYearRoadmap.`
  );
}
