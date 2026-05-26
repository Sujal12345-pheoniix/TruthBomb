import fs from "fs/promises";
import os from "os";
import path from "path";

/**
 * Extract text from a PDF buffer using pdf-parse.
 * Uses a dynamic import approach that avoids pdf-parse's test-file loader
 * crashing in Next.js App Router / webpack environments.
 */
export async function extractTextFromPdf(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return extractTextFromBuffer(buffer);
}

export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import avoids webpack bundling issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    const text = data.text?.trim() ?? "";

    if (text.length < 50) {
      throw new Error(
        "PDF appears to contain no extractable text. This may be a scanned image PDF. Please use a text-based PDF."
      );
    }

    return text;
  } catch (err: unknown) {
    // Re-throw known errors
    if (err instanceof Error && err.message.includes("no extractable text")) {
      throw err;
    }

    // pdf-parse itself failed — try a raw text extraction fallback
    console.warn("pdf-parse failed, attempting raw buffer text extraction:", err);
    const rawText = rawExtractTextFromBuffer(buffer);

    if (rawText.length < 50) {
      throw new Error(
        "Unable to extract text from this PDF. Please ensure the file is a valid, text-based PDF and not password protected."
      );
    }

    return rawText;
  }
}

/**
 * Fallback: attempt basic text extraction from PDF binary buffer.
 * Not perfect but handles common text-based PDFs as a last resort.
 */
function rawExtractTextFromBuffer(buffer: Buffer): string {
  try {
    const str = buffer.toString("latin1");
    // Extract text between BT (Begin Text) and ET (End Text) PDF operators
    const textBlocks: string[] = [];
    const btEtRegex = /BT[\s\S]*?ET/g;
    let match;

    while ((match = btEtRegex.exec(str)) !== null) {
      const block = match[0];
      // Extract content inside parentheses (PDF string literals)
      const parenRegex = /\(([^)]{1,500})\)/g;
      let parenMatch;
      while ((parenMatch = parenRegex.exec(block)) !== null) {
        const text = parenMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "")
          .replace(/\\t/g, " ")
          .replace(/\\\\/g, "\\")
          .replace(/\\([()\\])/g, "$1");
        if (text.trim().length > 2) {
          textBlocks.push(text);
        }
      }
    }

    return textBlocks.join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

/**
 * Get the uploads directory — uses /tmp on Vercel (read-only FS except /tmp),
 * and local public/uploads for dev.
 */
export function getUploadsDir(): string {
  // On Vercel, process.env.VERCEL is set
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "truthbomb-uploads");
  }
  return path.join(process.cwd(), "public", "uploads");
}

/**
 * Split text into semantically coherent chunks for AI processing.
 * Respects paragraph boundaries and sentence endings.
 */
export function chunkText(text: string, maxChars = 9000): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  // Split on double newlines (paragraphs) first
  const paragraphs = text.split(/\n{2,}/);
  let current = "";

  for (const p of paragraphs) {
    if (p.length > maxChars) {
      // Paragraph itself is too long — split by sentences
      const sentences = p.split(/(?<=[.!?])\s+/);
      for (const s of sentences) {
        if ((current + " " + s).length > maxChars) {
          if (current.trim()) chunks.push(current.trim());
          current = s;
        } else {
          current += (current ? " " : "") + s;
        }
      }
    } else if ((current + "\n\n" + p).length > maxChars) {
      if (current.trim()) chunks.push(current.trim());
      current = p;
    } else {
      current += (current ? "\n\n" : "") + p;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 0);
}
