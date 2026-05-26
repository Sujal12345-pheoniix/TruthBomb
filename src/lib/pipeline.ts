import { prisma } from "./prisma";
import { chunkText, extractTextFromPdf } from "./pdf";
import { extractClaims, verifyClaim, generateReportSummary } from "./ai";
import { searchWeb, generateSearchQueries } from "./search";
import type { FactCheckReportContent } from "@/types";
import type { VerificationStatus } from "@prisma/client";

export async function runFactCheckPipeline(documentId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "EXTRACTING" },
  });

  let text = doc.extractedText;
  if (!text) {
    text = await extractTextFromPdf(doc.filePath);
    await prisma.document.update({
      where: { id: documentId },
      data: { extractedText: text },
    });
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "ANALYZING" },
  });

  await prisma.claim.deleteMany({ where: { documentId } });

  const extracted = await extractClaimsAcrossChunks(text);

  if (extracted.length === 0) {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    });
    throw new Error("No verifiable claims were found in the uploaded PDF text.");
  }

  for (const c of extracted) {
    const claim = await prisma.claim.create({
      data: {
        documentId,
        claim: c.claim,
        category: c.category,
        confidence: c.confidence,
        context: c.context,
      },
    });

    const queries = generateSearchQueries(c.claim);
    const allEvidence = [];
    for (const q of queries) {
      const results = await searchWeb(q, 4);
      allEvidence.push(...results);
    }

    const uniqueEvidence = dedupeEvidence(allEvidence)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8);
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
        status: verification.status as VerificationStatus,
        confidence: verification.confidence,
        reasoning: verification.reasoning,
        correction: verification.correction,
        searchQueries: queries,
      },
    });

    for (const ev of uniqueEvidence) {
      await prisma.evidenceSource.create({
        data: {
          verificationResultId: vr.id,
          title: ev.title,
          url: ev.url,
          snippet: ev.snippet,
          source: ev.source,
          relevanceScore: ev.relevanceScore,
          publishedAt: ev.publishedAt,
        },
      });
    }
  }

  const report = await buildReport(documentId);
  const executiveSummary = await generateReportSummary(
    JSON.stringify({
      totalClaims: report.totalClaims,
      verified: report.verifiedCount,
      inaccurate: report.inaccurateCount,
      false: report.falseCount,
    })
  );

  await prisma.aiReport.create({
    data: {
      documentId,
      title: `Fact Check: ${doc.fileName}`,
      summary: executiveSummary,
      reportType: "FACT_CHECK",
      content: { ...report, executiveSummary } as object,
    },
  });

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "COMPLETED" },
  });

  return report;
}

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
      category: c.category,
      status: toReportStatus(vr?.status),
      confidence: vr?.confidence ?? 0,
      reasoning: vr?.reasoning ?? "",
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

  const counts = {
    verifiedCount: claims.filter((c) => c.status === "VERIFIED").length,
    inaccurateCount: claims.filter((c) => c.status === "INACCURATE").length,
    falseCount: claims.filter((c) => c.status === "FALSE").length,
  };

  const overallConfidence =
    claims.length > 0
      ? claims.reduce((s, c) => s + c.confidence, 0) / claims.length
      : 0;

  return {
    documentId,
    fileName: doc.fileName,
    totalClaims: claims.length,
    ...counts,
    overallConfidence,
    claims,
    executiveSummary: "",
  };
}

function toReportStatus(status?: VerificationStatus): FactCheckReportContent["claims"][0]["status"] {
  if (!status) return "FALSE";
  if (status === "VERIFIED") return "VERIFIED";
  if (status === "FALSE" || status === "NO_EVIDENCE") return "FALSE";
  return "INACCURATE";
}

async function extractClaimsAcrossChunks(text: string) {
  const chunks = chunkText(text, 9000).slice(0, 6);
  const merged = [];

  for (const chunk of chunks) {
    const claims = await extractClaims(chunk);
    merged.push(...claims);
  }

  const seen = new Set<string>();
  return merged
    .filter((c) => c.claim?.trim())
    .filter((c) => {
      const key = c.claim.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter((c) => /\d|%|\$|€|£|\b(19|20)\d{2}\b|million|billion|trillion/i.test(c.claim))
    .slice(0, 20);
}

function dedupeEvidence<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    if (seen.has(i.url)) return false;
    seen.add(i.url);
    return true;
  });
}
