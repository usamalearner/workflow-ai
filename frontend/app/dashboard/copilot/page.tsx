"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Sparkles, PanelRightOpen, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "@/components/copilot/message-bubble";
import { SourceCard } from "@/components/copilot/source-card";
import { Thinking } from "@/components/copilot/thinking";
import {
  useConversation,
  useConversations,
  useSendMessage,
} from "@/hooks/use-chat";
import { useDocuments } from "@/hooks/use-documents";
import { SUGGESTED_QUESTIONS } from "@/lib/constants";
import type { ChatMessage, Source } from "@/lib/types";

function CopilotInner() {
  const params = useSearchParams();
  const docFilter = params.get("doc");

  const [conversationId, setConversationId] = useState<string | null>(
    params.get("conv"),
  );
  const [draft, setDraft] = useState("");
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conv, isLoading } = useConversation(conversationId);
  const { data: conversations } = useConversations();
  const { data: docsData } = useDocuments();
  const send = useSendMessage();

  const messages: ChatMessage[] = conv?.messages ?? [];
  const lastSources: Source[] = useMemo(() => {
    const assistant = [...messages].reverse().find((m) => m.role === "assistant");
    return assistant?.sources ?? [];
  }, [messages]);

  const scopedDoc = docsData?.documents.find((d) => d.id === docFilter);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, send.isPending]);

  async function submit(text: string) {
    const message = text.trim();
    if (!message || send.isPending) return;
    setDraft("");
    setPendingUser(message);
    try {
      const res = await send.mutateAsync({
        message,
        conversation_id: conversationId,
        document_ids: docFilter ? [docFilter] : null,
      });
      setConversationId(res.conversation_id);
    } finally {
      setPendingUser(null);
    }
  }

  const showWelcome = !conversationId && !pendingUser && messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col lg:h-[calc(100vh-7rem)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            WorkFlow Copilot
          </h1>
          <p className="text-sm text-muted-foreground">
            {scopedDoc
              ? `Scoped to ${scopedDoc.original_filename}`
              : "Ask anything about your workplace information."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setConversationId(null);
              setDraft("");
            }}
          >
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_300px]">
        {/* Conversation */}
        <Card className="flex min-h-0 flex-col">
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin sm:p-5"
          >
            {isLoading && conversationId ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-2/3 rounded-xl" />
                <Skeleton className="ml-auto h-12 w-1/2 rounded-xl" />
              </div>
            ) : showWelcome ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">
                  What can I help you find?
                </h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Every answer is grounded in your documents and cites the page
                  it came from.
                </p>
                <div className="mt-6 grid w-full max-w-md gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-secondary/40"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {pendingUser && (
                  <MessageBubble
                    message={{
                      id: "pending",
                      conversation_id: "",
                      role: "user",
                      content: pendingUser,
                      sources: [],
                      created_at: new Date().toISOString(),
                    }}
                  />
                )}
                {send.isPending && <Thinking />}
              </>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(draft);
              }}
              className="flex items-end gap-2"
            >
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit(draft);
                  }
                }}
                placeholder="Ask WorkFlow AI…"
                rows={1}
                className="max-h-32 min-h-[44px] resize-none"
              />
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 shrink-0"
                loading={send.isPending}
                disabled={!draft.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>

        {/* Sources */}
        <Card className="hidden min-h-0 flex-col lg:flex">
          <div className="border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <PanelRightOpen className="h-4 w-4 text-muted-foreground" /> Sources
            </h2>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 scrollbar-thin">
            {lastSources.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                Sources for each answer appear here, linked to the exact page.
              </p>
            ) : (
              lastSources.map((s) => <SourceCard key={s.index} source={s} />)
            )}
          </div>
          {conversations && conversations.length > 0 && (
            <div className="border-t border-border p-3">
              <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <History className="h-3 w-3" /> Recent
              </p>
              <div className="space-y-1">
                {conversations.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setConversationId(c.id)}
                    className="w-full truncate rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Mobile sources */}
      {lastSources.length > 0 && (
        <div className="mt-3 lg:hidden">
          <details className="rounded-lg border border-border bg-card">
            <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium">
              {lastSources.length} source{lastSources.length === 1 ? "" : "s"}
            </summary>
            <div className="space-y-2 p-3 pt-0">
              {lastSources.map((s) => (
                <SourceCard key={s.index} source={s} />
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[60vh] rounded-xl" />}>
      <CopilotInner />
    </Suspense>
  );
}
