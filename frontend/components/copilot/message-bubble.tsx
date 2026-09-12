import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

/** Renders assistant markdown-ish text with [n] citation chips highlighted. */
function renderContent(text: string) {
  return text.split(/(\[\d+\])/g).map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (m) {
      return (
        <sup
          key={i}
          className="mx-0.5 rounded bg-primary/15 px-1 text-[10px] font-semibold text-primary"
        >
          {m[1]}
        </sup>
      );
    }
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {renderBold(line)}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

function renderBold(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((seg, i) => {
    const m = seg.match(/^\*\*([^*]+)\*\*$/);
    return m ? (
      <strong key={i} className="font-semibold text-foreground">
        {m[1]}
      </strong>
    ) : (
      <span key={i}>{seg}</span>
    );
  });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card",
        )}
      >
        <p className="whitespace-pre-wrap [word-break:break-word]">
          {isUser ? message.content : renderContent(message.content)}
        </p>

        {!isUser && message.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
            {message.sources.map((s) => (
              <span
                key={s.index}
                className="rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                [{s.index}] {s.filename} · p.{s.page_number}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
