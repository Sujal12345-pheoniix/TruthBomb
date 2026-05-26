import { z } from "zod";

// Use .min(20) instead of .cuid() to support both CUID1 and CUID2 (Prisma 5+ uses CUID2)
const documentIdSchema = z.string().min(20).max(60);

export const geoAnalyzeSchema = z.object({
  brandName: z.string().min(1).max(200),
  websiteUrl: z.string().url().max(500),
  competitors: z.array(z.string().min(1).max(200)).min(1).max(10),
});

export const extractClaimsSchema = z.object({
  documentId: documentIdSchema,
});

export const verifySchema = z.object({
  documentId: documentIdSchema,
});

export const reportSchema = z.object({
  documentId: documentIdSchema,
});

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
