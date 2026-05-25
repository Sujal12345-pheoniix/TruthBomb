import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

    const reports = await prisma.aiReport.findMany({
      where: type ? { reportType: type as "FACT_CHECK" | "GEO_ANALYSIS" } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        document: { select: { fileName: true, status: true } },
      },
    });

    const documents = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        _count: { select: { claims: true } },
        claims: {
          take: 1,
          include: { verificationResult: true },
        },
      },
    });

    const geoProjects = await prisma.geoProject.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ reports, documents, geoProjects });
  } catch (error) {
    console.error("Reports list error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
