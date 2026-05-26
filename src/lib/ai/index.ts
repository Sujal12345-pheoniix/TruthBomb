import type { ExtractedClaim, GeoAnalysisResult, VerificationOutput } from "@/types";
import { callLLM } from "./llm";

export async function extractClaims(text: string): Promise<ExtractedClaim[]> {
  try {
    const systemPrompt = `You are an expert fact-checking analyst. Extract specific, verifiable factual claims from the document text.

FOCUS ON:
- Statistics with exact numbers (percentages, figures, counts)
- Specific dates and time references  
- Financial figures (revenue, valuation, funding amounts)
- Technical specifications and metrics
- Named entities with specific attributes (company X did Y in year Z)

IGNORE: Opinions, vague statements, recommendations, generic descriptions.

OUTPUT EXACTLY JSON format:
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

Extract 5-15 distinct claims. Each claim must be self-contained and independently verifiable.`;

    const userPrompt = `Extract verifiable claims from this text:\n\n${text.slice(0, 10000)}`;

    const raw = await callLLM(systemPrompt, userPrompt, { responseFormatJSON: true });
    const parsed = safeParseJSON<{ claims: ExtractedClaim[] }>(raw);
    if (!parsed?.claims || !Array.isArray(parsed.claims)) {
      return fallbackExtractClaims(text);
    }

    return parsed.claims
      .filter((c) => c.claim && typeof c.claim === "string" && c.claim.trim().length >= 15)
      .map((c) => ({
        claim: c.claim.trim(),
        category: normalizeCategory(c.category),
        confidence: Math.min(1, Math.max(0, Number(c.confidence) || 0.7)),
        context: c.context || c.claim,
      }));
  } catch (err) {
    console.error("extractClaims error:", err);
    return fallbackExtractClaims(text);
  }
}

export async function verifyClaim(
  claim: string,
  evidence: { title: string; url: string; snippet: string }[]
): Promise<VerificationOutput> {
  const evidenceText = evidence.length > 0
    ? evidence.map((e, i) => `[${i + 1}] ${e.title}\nURL: ${e.url}\nSnippet: ${e.snippet}`).join("\n\n")
    : "No web evidence was found for this claim.";

  try {
    const systemPrompt = `You verify factual claims using ONLY the provided web evidence. Never invent facts or citations.

VERDICT RULES:
- VERIFIED: Evidence directly and explicitly supports the claim with matching values/dates
- FALSE: Evidence directly contradicts the claim with different facts
- OUTDATED: Claim was once true but evidence shows the situation has changed
- PARTIALLY_TRUE: Evidence partially supports but with significant differences in scope/numbers
- NO_EVIDENCE: No reliable supporting evidence found (use when evidence is missing, weak, or irrelevant)

ANTI-HALLUCINATION: If evidence quality is low or irrelevant, return NO_EVIDENCE. Never guess.

Return EXACTLY JSON format:
{
  "status": "VERIFIED|FALSE|OUTDATED|PARTIALLY_TRUE|NO_EVIDENCE",
  "confidence": 0.0-1.0,
  "reasoning": "concise explanation referencing specific evidence",
  "correction": "corrected fact if status is FALSE/OUTDATED, null otherwise",
  "searchQueries": []
}`;

    const userPrompt = `Claim to verify: "${claim}"\n\nEvidence:\n${evidenceText}`;

    const raw = await callLLM(systemPrompt, userPrompt, { responseFormatJSON: true });
    const parsed = safeParseJSON<{
      status: string;
      confidence: number;
      reasoning: string;
      correction?: string;
      searchQueries?: string[];
    }>(raw);

    if (!parsed) {
      return fallbackVerify(claim, evidence);
    }

    return {
      status: normalizeVerificationStatus(parsed.status),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      reasoning: parsed.reasoning || "Analysis complete.",
      correction: parsed.correction || undefined,
      searchQueries: parsed.searchQueries || [],
      evidence: [], // filled in pipeline
    };
  } catch (err) {
    console.error("verifyClaim error:", err);
    return fallbackVerify(claim, evidence);
  }
}

export async function analyzeGeo(
  brandName: string,
  websiteUrl: string,
  competitors: string[]
): Promise<GeoAnalysisResult> {
  const systemPrompt = `You are a GEO (Generative Engine Optimization) strategist analyzing brand visibility across AI systems (ChatGPT, Gemini, Claude, Perplexity).

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

Be specific, actionable, and grounded in real GEO strategy based on the brand domain and market.`;

  const userPrompt = `Analyze GEO visibility for:
Brand: ${brandName}
Website: ${websiteUrl}
Competitors: ${competitors.join(", ")}

Assess visibility across ChatGPT, Gemini, Claude, and Perplexity. Provide realistic scores and strategies.`;

  try {
    const raw = await callLLM(systemPrompt, userPrompt, { responseFormatJSON: true });
    const parsed = safeParseJSON<Partial<GeoAnalysisResult>>(raw);
    if (parsed) {
      return normalizeGeoResult(parsed, brandName, competitors);
    }
  } catch (err) {
    console.warn("analyzeGeo failed, falling back:", err);
  }

  return fallbackGeo(brandName, websiteUrl, competitors);
}

export async function generateReportSummary(claimsJson: string): Promise<string> {
  try {
    const systemPrompt = `You are TruthBomb AI, an advanced fact-verification and misinformation detection system.
Your task is to generate a professional fact-checking report based on the analyzed claims.

REPORT STYLE:
- Professional, analytical, research-grade, trustworthy, concise but informative.
- Tone: Bloomberg intelligence, enterprise risk analysis, professional AI audit system.
- Avoid: Emotional language, speculation, unsupported conclusions, fake citations.

You MUST format the report EXACTLY as follows, using the exact headers, emojis, and a markdown table structure:

🔍 CLAIM-BY-CLAIM ANALYSIS
| Claim | Status | Confidence | AI Verdict |
| :--- | :--- | :--- | :--- |
[For every claim in the input list, generate a row in this table. Map status to emoji: ✅ VERIFIED, ❌ FALSE, ⚠️ PARTIALLY TRUE, ⚠️ OUTDATED, ❓ NO EVIDENCE FOUND. The confidence should be shown as percentage, e.g. 97%. AI Verdict should be a very concise summary of the verification reasoning.]

📊 FINAL ANALYSIS
🚨 Major Issues Detected
- [List 3-5 specific major issues/patterns of misinformation detected in the claims, e.g. "Fabricated technology announcements", "Impossible financial statistics", "AI hallucination-style claims", "Unrealistic market projections", etc.]

Make sure the output starts directly with the "🔍 CLAIM-BY-CLAIM ANALYSIS" title. Use markdown format. Do not wrap the entire output in a JSON or code block, output pure markdown.`;

    const userPrompt = `Generate the fact-check report for these analyzed claims:\n\n${claimsJson}`;

    return await callLLM(systemPrompt, userPrompt);
  } catch (err) {
    console.error("generateReportSummary error:", err);
    return "Failed to generate report summary.";
  }
}

function safeParseJSON<T>(text: string): T | null {
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    try {
      const stripped = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      return JSON.parse(stripped) as T;
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

function normalizeCategory(cat: string): ExtractedClaim["category"] {
  const upper = (cat?.toUpperCase?.() ?? "GENERAL").trim();
  const valid = ["STATISTIC", "DATE", "FINANCIAL", "TECHNICAL", "SCIENTIFIC", "GENERAL"];
  return (valid.includes(upper) ? upper : "GENERAL") as ExtractedClaim["category"];
}

function normalizeVerificationStatus(status: string): VerificationOutput["status"] {
  const upper = (status ?? "NO_EVIDENCE").toUpperCase().replace(/[\s-]/g, "_") as VerificationOutput["status"];
  const valid: VerificationOutput["status"][] = ["VERIFIED", "FALSE", "OUTDATED", "PARTIALLY_TRUE", "NO_EVIDENCE"];
  return valid.includes(upper) ? upper : "NO_EVIDENCE";
}
