import { NextRequest, NextResponse } from "next/server";
import { reportSchema } from "@/lib/validations";
import { buildReport } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await rateLimit(`report:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const report = await buildReport(parsed.data.documentId);
    const aiReport = await prisma.aiReport.findFirst({
      where: { documentId: parsed.data.documentId, reportType: "FACT_CHECK" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      report,
      aiReportId: aiReport?.id,
      summary: aiReport?.summary,
    });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}
