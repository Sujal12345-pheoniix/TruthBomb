import { z } from "zod";

export const geoAnalyzeSchema = z.object({
  brandName: z.string().min(1).max(200),
  websiteUrl: z.string().url().max(500),
  competitors: z.array(z.string().min(1).max(200)).min(1).max(10),
});

export const extractClaimsSchema = z.object({
  documentId: z.string().cuid(),
});

export const verifySchema = z.object({
  documentId: z.string().cuid(),
});

export const reportSchema = z.object({
  documentId: z.string().cuid(),
});

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
