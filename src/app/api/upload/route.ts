import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/validations";
import { getUploadsDir } from "@/lib/pdf";

// Increase Vercel function timeout (max 60s on Hobby, 300s on Pro)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await rateLimit(`upload:${ip}`, 10);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate MIME type — also check file extension as some browsers send wrong MIME
    const mimeOk = ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number]);
    const extOk = file.name.toLowerCase().endsWith(".pdf");
    if (!mimeOk && !extOk) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }

    if (file.size < 100) {
      return NextResponse.json({ error: "File appears to be empty or corrupt" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify PDF magic bytes (%PDF-)
    const header = buffer.slice(0, 5).toString("ascii");
    if (!header.startsWith("%PDF")) {
      return NextResponse.json({ error: "File does not appear to be a valid PDF" }, { status: 400 });
    }

    // Use /tmp on Vercel production, public/uploads locally
    const uploadsDir = getUploadsDir();
    await mkdir(uploadsDir, { recursive: true });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = `${uploadsDir}/${safeName}`;
    await writeFile(filePath, buffer);

    const document = await prisma.document.create({
      data: {
        fileName: file.name,
        filePath,
        fileSize: file.size,
        mimeType: file.type || "application/pdf",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      documentId: document.id,
      fileName: document.fileName,
      status: document.status,
      message: "Upload successful. Ready for analysis.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
