"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const PHASES = [
  "Searching your workspace…",
  "Retrieving relevant passages…",
  "Generating a grounded answer…",
];

export function Thinking() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => Math.min(p + 1, PHASES.length - 1)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <span className="flex gap-1">
          {[0, 1, 2].map((d) => (
            <span
              key={d}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: `${d * 150}ms` }}
            />
          ))}
        </span>
        {PHASES[i]}
      </div>
    </div>
  );
}
