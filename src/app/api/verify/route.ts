import { NextRequest, NextResponse } from "next/server";
import { verifySchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { runFactCheckPipeline } from "@/lib/pipeline";

// CRITICAL: Set Vercel function timeout to max allowed
// Hobby: 10s (free), Pro: 300s, but 60s is safe for most pipelines
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";

  // Allow 5 analysis requests per minute per IP
  const { success } = await rateLimit(`verify:${ip}`, 5);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait 60 seconds before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { documentId } = parsed.data;

    // Run the full pipeline — this is the core fact-check workflow
    const report = await runFactCheckPipeline(documentId) as unknown as { strictReport?: Record<string, unknown> | null; totalClaims: number; verifiedCount: number; falseCount: number; inaccurateCount: number; claims: unknown[] };

    const url = new URL(req.url);
    const isStrict = url.searchParams.get("format") === "strict" || body.format === "strict" || body.strict === true;

    if (isStrict) {
      if (report.strictReport) {
        return NextResponse.json(report.strictReport);
      }
      return NextResponse.json({ error: "Strict report generation failed" }, { status: 500 });
    }

    return NextResponse.json({
      documentId,
      status: "COMPLETED",
      totalClaims: report.totalClaims,
      verifiedCount: report.verifiedCount,
      falseCount: report.falseCount,
      inaccurateCount: report.inaccurateCount,
      report,
    });
  } catch (error) {
    console.error("Verify pipeline error:", error);

    const message =
      error instanceof Error ? error.message : "Verification failed due to an unexpected error";

    // Return a structured error response — never just crash
    return NextResponse.json(
      {
        error: message,
        hint: message.includes("not found")
          ? "Please upload the PDF again and retry."
          : message.includes("No verifiable claims")
          ? "The PDF may not contain enough factual claims. Try a document with specific statistics, dates, or figures."
          : "Please try again. If the issue persists, check that your PDF contains readable text.",
      },
      { status: 500 }
    );
  }
}
