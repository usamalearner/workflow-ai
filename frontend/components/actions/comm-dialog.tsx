"use client";

import { useEffect, useState } from "react";
import { Copy, RefreshCw, Check, Loader2, Mail, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Action, CommChannel } from "@/lib/types";
import { useGenerateComm } from "@/hooks/use-actions";

export function CommDialog({
  action,
  channel,
  open,
  onOpenChange,
}: {
  action: Action | null;
  channel: CommChannel;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const gen = useGenerateComm();
  const [subject, setSubject] = useState("");
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  async function run() {
    if (!action) return;
    const res = await gen.mutateAsync({ id: action.id, channel });
    setSubject(res.subject ?? "");
    setTo(res.to);
    setBody(res.body);
  }

  useEffect(() => {
    if (open && action) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, action?.id, channel]);

  function copy() {
    const text =
      channel === "email"
        ? `Subject: ${subject}\nTo: ${to}\n\n${body}`
        : body;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {channel === "email" ? (
              <Mail className="h-4 w-4 text-primary" />
            ) : (
              <MessageCircle className="h-4 w-4 text-primary" />
            )}
            Generate {channel === "email" ? "Email" : "WhatsApp"}
          </DialogTitle>
          <DialogDescription>{action?.title}</DialogDescription>
        </DialogHeader>

        {gen.isPending && !body ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Drafting message…
          </div>
        ) : (
          <div className="space-y-3">
            {channel === "email" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Subject
                </label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <Input value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Message
              </label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[180px]"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              WorkFlow AI generates the draft — copy it into your email or
              messaging tool to send.
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={run} loading={gen.isPending}>
            <RefreshCw className="h-4 w-4" /> Regenerate
          </Button>
          <Button onClick={copy} disabled={!body}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
