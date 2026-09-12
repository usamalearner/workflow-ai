"use client";

import { useEffect, useState } from "react";
import { RotateCcw, ShieldCheck, Server } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useResetWorkspace, useUsage } from "@/hooks/use-analytics";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user } = useAuth();
  const reset = useResetWorkspace();
  const { data: usage } = useUsage();
  const [health, setHealth] = useState<{
    demo_mode: boolean;
    groq_configured: boolean;
    supabase_configured: boolean;
  } | null>(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => null);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your workspace configuration." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input defaultValue={user?.full_name} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={user?.email} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4 text-primary" /> Backend status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Mode" value={health?.demo_mode ? "Demo" : "Live"} />
          <Row
            label="Groq"
            value={health?.groq_configured ? "Connected" : "Not configured"}
          />
          <Row
            label="Supabase"
            value={health?.supabase_configured ? "Connected" : "Not configured"}
          />
          {usage && (
            <>
              <Row
                label="Documents"
                value={`${usage.documents_used} / ${usage.documents_limit}`}
              />
              <Row
                label="AI questions today"
                value={`${usage.chat_used} / ${usage.chat_limit}`}
              />
              <Row
                label="Reports today"
                value={`${usage.reports_used} / ${usage.reports_limit}`}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> Data
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Permanently delete all documents, conversations, actions and reports
            in this workspace.
          </p>
          <Button
            variant="destructive"
            loading={reset.isPending}
            onClick={() => reset.mutate()}
          >
            <RotateCcw className="h-4 w-4" /> Reset workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
