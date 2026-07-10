"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUploaded: (documentId: string, fileName: string) => void;
}

export function UploadZone({ onUploaded }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        onUploaded(data.documentId, data.fileName);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      id="pdf-upload-zone"
      {...getRootProps()}
      className={cn(
        "cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 section-shell",
        isDragActive
          ? "border-[#3f7ebf] bg-[#eef5ff]"
          : "border-border hover:border-[#8fb6df] hover:bg-[#f8fbff]",
        uploading && "pointer-events-none opacity-60"
      )}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4f79a1]" />
      ) : isDragActive ? (
        <Upload className="mx-auto h-8 w-8 text-[#1f5a95]" />
      ) : (
        <FileText className="mx-auto h-8 w-8 text-[#6384a5]" />
      )}
      <p className="mt-4 text-sm font-semibold text-[#12385a]">
        {uploading
          ? "Uploading…"
          : isDragActive
            ? "Drop PDF here"
            : "Drag & drop a PDF, or click to browse"}
      </p>
      <p className="mt-1 text-[13px] text-[#6284a7]">PDF only · Max 10MB</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
