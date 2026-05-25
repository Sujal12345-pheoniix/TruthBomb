import { NextRequest, NextResponse } from "next/server";
import { geoAnalyzeSchema } from "@/lib/validations";
import { analyzeGeo } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await rateLimit(`geo:${ip}`, 10);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = geoAnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { brandName, websiteUrl, competitors } = parsed.data;

    const project = await prisma.geoProject.create({
      data: {
        brandName,
        websiteUrl,
        competitors,
        status: "ANALYZING",
      },
    });

    const results = await analyzeGeo(brandName, websiteUrl, competitors);

    await prisma.geoProject.update({
      where: { id: project.id },
      data: {
        results: results as object,
        visibilityScore: results.visibilityScore,
        status: "COMPLETED",
      },
    });

    const aiReport = await prisma.aiReport.create({
      data: {
        title: `GEO Analysis: ${brandName}`,
        summary: results.summary,
        reportType: "GEO_ANALYSIS",
        content: { ...results, projectId: project.id, brandName, websiteUrl, competitors } as object,
      },
    });

    return NextResponse.json({
      projectId: project.id,
      reportId: aiReport.id,
      results,
    });
  } catch (error) {
    console.error("GEO analyze error:", error);
    return NextResponse.json({ error: "GEO analysis failed" }, { status: 500 });
  }
}
