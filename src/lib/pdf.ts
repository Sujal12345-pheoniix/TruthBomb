import fs from "fs/promises";

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  const text = data.text?.trim() ?? "";

  if (text.length < 80) {
    throw new Error(
      "Unable to extract enough text from PDF. Please upload a text-based PDF (not scanned image only)."
    );
  }

  return text;
}

export function chunkText(text: string, maxChars = 12000): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";

  for (const p of paragraphs) {
    if ((current + p).length > maxChars) {
      if (current) chunks.push(current.trim());
      current = p;
    } else {
      current += (current ? "\n\n" : "") + p;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}
