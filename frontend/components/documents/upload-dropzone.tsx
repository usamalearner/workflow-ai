"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { useUploadDocument } from "@/hooks/use-documents";
import { Progress } from "@/components/ui/progress";

const ACCEPT = ".pdf,.docx,.xlsx,.csv";
const MAX_MB = 10;
const PHASES = [
  "Uploading file…",
  "Extracting text…",
  "Chunking content…",
  "Creating knowledge index…",
];

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState(0);
  const upload = useUploadDocument();

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const file = files[0];
      if (file.size > MAX_MB * 1024 * 1024) return;

      setPhase(0);
      const timer = setInterval(
        () => setPhase((p) => Math.min(p + 1, PHASES.length - 1)),
        700,
      );
      try {
        await upload.mutateAsync(file);
      } finally {
        clearInterval(timer);
        setPhase(0);
      }
    },
    [upload],
  );

  const busy = upload.isPending;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !busy && inputRef.current?.click()}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border bg-card/40 hover:border-primary/40",
        busy && "pointer-events-none",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {busy ? (
        <div className="mx-auto max-w-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium">{PHASES[phase]}</p>
          <Progress value={(phase + 1) * 25} className="mt-3" />
        </div>
      ) : (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-4 text-sm font-medium">Drop files here</p>
          <p className="text-sm text-muted-foreground">
            or <span className="text-primary">browse files</span>
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            PDF · DOCX · XLSX · CSV — maximum {MAX_MB} MB
          </p>
        </>
      )}
    </div>
  );
}
