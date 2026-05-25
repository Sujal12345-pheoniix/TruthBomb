import { NextRequest, NextResponse } from "next/server";
import { verifySchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { runFactCheckPipeline } from "@/lib/pipeline";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await rateLimit(`verify:${ip}`, 5);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const report = await runFactCheckPipeline(parsed.data.documentId);

    return NextResponse.json({
      documentId: parsed.data.documentId,
      status: "COMPLETED",
      report,
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
