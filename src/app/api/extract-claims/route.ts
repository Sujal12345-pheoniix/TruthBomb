import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractClaimsSchema } from "@/lib/validations";
import { extractTextFromPdf, chunkText } from "@/lib/pdf";
import { extractClaims } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await rateLimit(`extract:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = extractClaimsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { documentId } = parsed.data;
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    let text = doc.extractedText;
    if (!text) {
      text = await extractTextFromPdf(doc.filePath);
      await prisma.document.update({
        where: { id: documentId },
        data: { extractedText: text, status: "EXTRACTING" },
      });
    }

    const chunk = chunkText(text)[0];
    const claims = await extractClaims(chunk);

    await prisma.claim.deleteMany({ where: { documentId } });

    const created = await Promise.all(
      claims.map((c) =>
        prisma.claim.create({
          data: {
            documentId,
            claim: c.claim,
            category: c.category,
            confidence: c.confidence,
            context: c.context,
          },
        })
      )
    );

    return NextResponse.json({
      documentId,
      claims: created.map((c) => ({
        id: c.id,
        claim: c.claim,
        category: c.category,
        confidence: c.confidence,
      })),
      count: created.length,
    });
  } catch (error) {
    console.error("Extract claims error:", error);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
