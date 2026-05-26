import { NextRequest, NextResponse } from "next/server";
import { reportSchema } from "@/lib/validations";
import { buildReport } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId") || searchParams.get("id");

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId parameter" }, { status: 400 });
    }

    const aiReport = await prisma.aiReport.findFirst({
      where: { documentId, reportType: "FACT_CHECK" },
      orderBy: { createdAt: "desc" },
    });

    if (!aiReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const content = aiReport.content as unknown as { strictReport?: Record<string, unknown> };
    if (content?.strictReport) {
      return NextResponse.json(content.strictReport);
    }

    return NextResponse.json({ error: "Strict report content not found" }, { status: 404 });
  } catch (error) {
    console.error("Report GET error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await rateLimit(`report:${ip}`, 20);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { documentId } = parsed.data;

    // Verify document exists
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found. Please upload and analyze the PDF first." },
        { status: 404 }
      );
    }

    if (doc.status === "PENDING" || doc.status === "EXTRACTING" || doc.status === "ANALYZING") {
      return NextResponse.json(
        { error: "Analysis still in progress. Please wait for it to complete." },
        { status: 202 }
      );
    }

    if (doc.status === "FAILED") {
      return NextResponse.json(
        { error: "Document analysis failed. Please re-run the fact-check pipeline." },
        { status: 422 }
      );
    }

    const report = await buildReport(documentId);

    const aiReport = await prisma.aiReport.findFirst({
      where: { documentId, reportType: "FACT_CHECK" },
      orderBy: { createdAt: "desc" },
    });

    const url = new URL(req.url);
    const isStrict = url.searchParams.get("format") === "strict" || body.format === "strict" || body.strict === true;

    if (isStrict) {
      const content = aiReport?.content as unknown as { strictReport?: Record<string, unknown> } | null;
      if (content?.strictReport) {
        return NextResponse.json(content.strictReport);
      }
      return NextResponse.json({ error: "Strict report not generated yet" }, { status: 404 });
    }

    return NextResponse.json({
      report,
      aiReportId: aiReport?.id ?? null,
      summary: aiReport?.summary ?? "",
    });
  } catch (error) {
    console.error("Report fetch error:", error);
    const message = error instanceof Error ? error.message : "Report generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
