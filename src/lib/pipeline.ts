import { prisma } from "./prisma";
import { chunkText, extractTextFromPdf } from "./pdf";
import { extractClaims, verifyClaim } from "./ai";
import { searchWeb, generateSearchQueries } from "./search";
import type { ClaimCategory, FactCheckReportContent } from "@/types";
import type { VerificationStatus } from "@prisma/client";

/**
 * Main fact-check pipeline. Runs end-to-end:
 * Extract text → Extract claims → Search evidence → Verify → Generate report
 *
 * This is fault-tolerant: individual claim failures don't kill the whole pipeline.
 */
export async function runFactCheckPipeline(documentId: string) {
  // ── STEP 1: Load document ────────────────────────────────────────────────
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found. Please upload the PDF again.");

  // ── STEP 2: Extract text ─────────────────────────────────────────────────
  await prisma.document.update({
    where: { id: documentId },
    data: { status: "EXTRACTING" },
  });

  let text = doc.extractedText ?? "";

  if (!text || text.length < 50) {
    try {
      text = await extractTextFromPdf(doc.filePath);
      await prisma.document.update({
        where: { id: documentId },
        data: { extractedText: text },
      });
    } catch (err) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "FAILED" },
      });
      throw new Error(
        `Text extraction failed: ${err instanceof Error ? err.message : "Unknown error"}. ` +
          "Please ensure the PDF is text-based and not a scanned image."
      );
    }
  }

  // ── STEP 3: Extract claims ───────────────────────────────────────────────
  await prisma.document.update({
    where: { id: documentId },
    data: { status: "ANALYZING" },
  });

  // Clear any previous claims from failed runs
  await prisma.claim.deleteMany({ where: { documentId } });

  const extracted = await extractClaimsAcrossChunks(text);

  if (extracted.length === 0) {
    // Don't hard fail — produce a minimal report indicating no claims found
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "COMPLETED" },
    });

    // Create a minimal AI report for the no-claims case
    await prisma.aiReport.upsert({
      where: {
        // We need a unique constraint — use documentId + reportType
        // Since we don't have that, find and update or create
        id: `no-claims-${documentId}`,
      },
      update: {
        summary: "No specific verifiable factual claims were detected in this document. The document may contain primarily opinions, recommendations, or general statements without specific statistics, dates, or figures.",
      },
      create: {
        id: `no-claims-${documentId}`,
        documentId,
        title: `Fact Check: ${doc.fileName}`,
        summary: "No specific verifiable factual claims were detected in this document.",
        reportType: "FACT_CHECK",
        content: {
          documentId,
          fileName: doc.fileName,
          totalClaims: 0,
          verifiedCount: 0,
          inaccurateCount: 0,
          falseCount: 0,
          overallConfidence: 0,
          claims: [],
          executiveSummary: "No verifiable claims found.",
        },
      },
    });

    const report = await buildReport(documentId);
    return { ...report, executiveSummary: "No verifiable claims found.", strictReport: null };
  }

  // ── STEP 4: Verify each claim (fault-tolerant) ───────────────────────────
  const claimResults = [];

  for (const c of extracted) {
    try {
      const claim = await prisma.claim.create({
        data: {
          documentId,
          claim: c.claim,
          category: c.category,
          confidence: c.confidence,
          context: c.context ?? c.claim,
        },
      });

      // Search for evidence
      const queries = generateSearchQueries(c.claim);
      const allEvidence = [];

      for (const q of queries) {
        try {
          const results = await searchWeb(q, 4);
          allEvidence.push(...results);
        } catch (searchErr) {
          console.warn(`Search failed for query "${q}":`, searchErr);
          // Continue without this search result
        }
      }

      const uniqueEvidence = dedupeEvidence(allEvidence)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 8);

      // Verify claim against evidence
      const verification = await verifyClaim(
        c.claim,
        uniqueEvidence.map((e) => ({
          title: e.title,
          url: e.url,
          snippet: e.snippet,
        }))
      );

      const vr = await prisma.verificationResult.create({
        data: {
          claimId: claim.id,
          status: normalizeStatus(verification.status),
          confidence: Math.min(1, Math.max(0, verification.confidence)),
          reasoning: verification.reasoning || "Analysis complete.",
          correction: verification.correction || null,
          searchQueries: queries,
        },
      });

      // Store evidence sources
      for (const ev of uniqueEvidence) {
        await prisma.evidenceSource.create({
          data: {
            verificationResultId: vr.id,
            title: ev.title || "Source",
            url: ev.url,
            snippet: ev.snippet || "",
            source: ev.source,
            relevanceScore: ev.relevanceScore,
            publishedAt: ev.publishedAt,
          },
        });
      }

      claimResults.push({ claimId: claim.id, status: vr.status });
    } catch (claimErr) {
      // Log but don't crash the whole pipeline
      console.error(`Failed to process claim "${c.claim.slice(0, 60)}":`, claimErr);
    }
  }

  // ── STEP 5: Generate report ──────────────────────────────────────────────
  const report = await buildReport(documentId);

  // Map to strict claim formats for strict JSON report
  const claimsPayload = report.claims.map((c) => {
    let strictStatus = "NO EVIDENCE FOUND";
    if (c.rawStatus === "VERIFIED") strictStatus = "VERIFIED";
    else if (c.rawStatus === "FALSE") strictStatus = "FALSE";
    else if (c.rawStatus === "OUTDATED") strictStatus = "OUTDATED";
    else if (c.rawStatus === "PARTIALLY_TRUE") strictStatus = "PARTIALLY TRUE";
    else if (c.rawStatus === "NO_EVIDENCE") strictStatus = "NO EVIDENCE FOUND";

    return {
      claim: c.claim,
      status: strictStatus,
      confidence: Math.round(c.confidence * 100),
      reasoning: c.reasoning,
      correctedFact: c.correction || "No correction needed.",
      evidenceSources: c.evidence.map((ev) => ev.url),
    };
  });

  const verified = claimsPayload.filter((c) => c.status === "VERIFIED").length;
  const falseCount = claimsPayload.filter((c) => c.status === "FALSE").length;
  const partial = claimsPayload.filter((c) => c.status === "PARTIALLY TRUE" || c.status === "OUTDATED").length;
  const overallTrustScore = Math.round(report.overallConfidence * 100);

  let riskLevel = "LOW";
  if (falseCount > 0) {
    riskLevel = falseCount >= 3 ? "CRITICAL" : "HIGH";
  } else if (partial > 2) {
    riskLevel = "MEDIUM";
  }

  const summaryPayload = {
    totalClaims: report.totalClaims,
    verified,
    false: falseCount,
    partial,
    overallTrustScore,
    riskLevel,
  };

  const llmInput = JSON.stringify({
    summary: summaryPayload,
    claims: claimsPayload,
  });

  let executiveSummary = "";
  let strictReport: Record<string, unknown> | null = null;

  try {
    const systemPrompt = `You are TruthBomb AI, an advanced fact-verification and misinformation detection system.
Analyze the fact-check summary and claims list. You must complete the final assessment and generate the Bloomberg-style markdown report.

You MUST return EXACTLY this JSON structure:
{
  "finalAssessment": {
    "majorIssues": ["string"],
    "aiInsights": "string",
    "recommendation": "string",
    "finalVerdict": "string"
  },
  "markdownReport": "string"
}

Guidelines:
1. "finalAssessment.majorIssues": List 3-5 specific major issues/patterns of misinformation detected (e.g., "Fabricated technology announcements", "Impossible financial statistics").
2. "finalAssessment.aiInsights": Brief professional assessment of the document's content validity.
3. "finalAssessment.recommendation": Recommendation on whether the user should trust or share the document.
4. "finalAssessment.finalVerdict": A single-sentence verdict summarizing the credibility.
5. "markdownReport": Generate a complete Bloomberg-style markdown report. It must start directly with:
🔍 CLAIM-BY-CLAIM ANALYSIS
| Claim | Status | Confidence | AI Verdict |
| :--- | :--- | :--- | :--- |
[For every claim in the claims list, add a row. Status emoji map:
- VERIFIED: ✅ VERIFIED
- FALSE: ❌ FALSE
- OUTDATED: ⚠️ OUTDATED
- PARTIALLY TRUE: ⚠️ PARTIALLY TRUE
- NO EVIDENCE FOUND: ❓ NO EVIDENCE FOUND]
[Confidence: percentage, e.g. 97%]
[AI Verdict: a brief explanation of why the status was assigned]

And follow the table with:
📊 FINAL ANALYSIS
🚨 Major Issues Detected
- [List major issues from finalAssessment.majorIssues]

Do not wrap "markdownReport" inside additional code blocks. Produce a valid JSON response.`;

    const { callLLM } = await import("./ai/llm");
    const rawLlmResult = await callLLM(systemPrompt, llmInput, { responseFormatJSON: true });
    
    let llmParsed: {
      markdownReport?: string;
      finalAssessment?: {
        majorIssues?: string[];
        aiInsights?: string;
        recommendation?: string;
        finalVerdict?: string;
      };
    } | null = null;
    try {
      llmParsed = JSON.parse(rawLlmResult);
    } catch {
      const stripped = rawLlmResult.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      llmParsed = JSON.parse(stripped);
    }

    executiveSummary = llmParsed?.markdownReport || "";
    strictReport = {
      summary: summaryPayload,
      claims: claimsPayload,
      finalAssessment: llmParsed?.finalAssessment || {
        majorIssues: ["Potential misinformation patterns", "Unverified figures"],
        aiInsights: "The document contains a mixture of verified facts and false or unverified statistics.",
        recommendation: "Conduct manual audit for critical decisions.",
        finalVerdict: "The document's trust score is moderate.",
      },
    };
  } catch (err) {
    console.error("Strict and Markdown report generation failed:", err);
    executiveSummary = `🔍 CLAIM-BY-CLAIM ANALYSIS\n\n| Claim | Status | Confidence | AI Verdict |\n| :--- | :--- | :--- | :--- |\n` +
      claimsPayload.map((c) => {
        let emoji = "❓";
        if (c.status === "VERIFIED") emoji = "✅";
        else if (c.status === "FALSE") emoji = "❌";
        else if (c.status === "PARTIALLY TRUE" || c.status === "OUTDATED") emoji = "⚠️";
        return `| ${c.claim} | ${emoji} ${c.status} | ${c.confidence}% | ${c.reasoning} |`;
      }).join("\n") +
      `\n\n📊 FINAL ANALYSIS\n🚨 Major Issues Detected\n- Unverified figures and claims detected.`;

    strictReport = {
      summary: summaryPayload,
      claims: claimsPayload,
      finalAssessment: {
        majorIssues: ["Unverified figures", "Lack of verified source citations"],
        aiInsights: "Fact-checking pipeline completed with fallback generation.",
        recommendation: "Exercise caution when citing or distributing these claims.",
        finalVerdict: `Failed to compile full final assessment. Trust score: ${overallTrustScore}%.`
      }
    };
  }

  // Upsert the AI report (handle re-runs)
  const existingReport = await prisma.aiReport.findFirst({
    where: { documentId, reportType: "FACT_CHECK" },
    orderBy: { createdAt: "desc" },
  });

  const contentToSave = {
    ...report,
    executiveSummary,
    strictReport,
  };

  if (existingReport) {
    await prisma.aiReport.update({
      where: { id: existingReport.id },
      data: {
        title: `Fact Check: ${doc.fileName}`,
        summary: executiveSummary,
        content: contentToSave as object,
      },
    });
  } else {
    await prisma.aiReport.create({
      data: {
        documentId,
        title: `Fact Check: ${doc.fileName}`,
        summary: executiveSummary,
        reportType: "FACT_CHECK",
        content: contentToSave as object,
      },
    });
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "COMPLETED" },
  });

  return { ...report, executiveSummary, strictReport };
}

/**
 * Build the report from database — works even if pipeline only partially completed.
 */
export async function buildReport(documentId: string): Promise<FactCheckReportContent> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      claims: {
        include: {
          verificationResult: {
            include: { evidenceSources: true },
          },
        },
      },
    },
  });

  if (!doc) throw new Error("Document not found");

  const claims = doc.claims.map((c) => {
    const vr = c.verificationResult;
    return {
      id: c.id,
      claim: c.claim,
      category: c.category as ClaimCategory,
      status: toReportStatus(vr?.status),
      rawStatus: vr?.status || undefined,
      confidence: vr?.confidence ?? c.confidence,
      reasoning: vr?.reasoning ?? "Verification pending.",
      correction: vr?.correction ?? undefined,
      evidence: (vr?.evidenceSources ?? []).map((e) => ({
        title: e.title,
        url: e.url,
        snippet: e.snippet,
        source: e.source as "tavily" | "brave" | "exa",
        relevanceScore: e.relevanceScore,
        publishedAt: e.publishedAt ?? undefined,
      })),
    };
  });

  const verifiedCount = claims.filter((c) => c.status === "VERIFIED").length;
  const inaccurateCount = claims.filter((c) => c.status === "INACCURATE").length;
  const falseCount = claims.filter((c) => c.status === "FALSE").length;

  const overallConfidence =
    claims.length > 0
      ? claims.reduce((s, c) => s + c.confidence, 0) / claims.length
      : 0;

  return {
    documentId,
    fileName: doc.fileName,
    totalClaims: claims.length,
    verifiedCount,
    inaccurateCount,
    falseCount,
    overallConfidence,
    claims,
    executiveSummary: "",
  };
}

/**
 * Map database VerificationStatus to the report's simplified status.
 */
function toReportStatus(status?: VerificationStatus): FactCheckReportContent["claims"][0]["status"] {
  if (!status) return "FALSE";
  if (status === "VERIFIED") return "VERIFIED";
  if (status === "FALSE" || status === "NO_EVIDENCE") return "FALSE";
  // OUTDATED, PARTIALLY_TRUE → INACCURATE
  return "INACCURATE";
}

/**
 * Normalize AI status output to valid VerificationStatus enum values.
 */
function normalizeStatus(status: string): VerificationStatus {
  const valid: VerificationStatus[] = [
    "VERIFIED", "FALSE", "OUTDATED", "PARTIALLY_TRUE", "NO_EVIDENCE",
  ];
  const upper = (status ?? "").toUpperCase().replace(/[\s-]/g, "_") as VerificationStatus;
  return valid.includes(upper) ? upper : "NO_EVIDENCE";
}

/**
 * Extract claims from all text chunks, merging and deduplicating.
 * No longer applies a strict numeric filter — trusts AI extraction quality.
 */
async function extractClaimsAcrossChunks(text: string) {
  // Process first 6 chunks max (to stay within time limits)
  const chunks = chunkText(text, 9000).slice(0, 6);
  const merged: Awaited<ReturnType<typeof extractClaims>> = [];

  for (const chunk of chunks) {
    try {
      const claims = await extractClaims(chunk);
      merged.push(...claims);
    } catch (err) {
      console.warn("Claim extraction failed for chunk:", err);
      // Continue with other chunks
    }
  }

  // Deduplicate claims by normalized text
  const seen = new Set<string>();
  return merged
    .filter((c) => c.claim?.trim() && c.claim.length >= 20)
    .filter((c) => {
      const key = c.claim
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20); // Cap at 20 claims to stay within timeout
}

function dedupeEvidence<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    if (!i.url || seen.has(i.url)) return false;
    seen.add(i.url);
    return true;
  });
}
