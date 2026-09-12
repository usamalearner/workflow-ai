"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, Loader2, Table2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaTrend, PriorityBars } from "@/components/analytics/charts";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SpreadsheetAnalysis } from "@/lib/types";

export function SpreadsheetPanel({ initialDocId }: { initialDocId?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<SpreadsheetAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);

  const analyzeStored = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setResult(await api.analyzeStored(id));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      setResult(await api.analyzeFile(file));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // auto-run once if a stored doc id was passed
  useEffect(() => {
    if (initialDocId) analyzeStored(initialDocId);
  }, [initialDocId, analyzeStored]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Table2 className="h-4 w-4 text-primary" /> Spreadsheet Intelligence
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Row counts, averages, min/max, missing values and anomalies are
            computed with pandas — then explained by AI.
          </p>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (e.dataTransfer.files[0]) analyzeFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors",
              drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && analyzeFile(e.target.files[0])}
            />
            <UploadCloud className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 font-medium">Drop an Excel or CSV file</p>
            <p className="text-xs text-muted-foreground">XLSX · CSV — max 10 MB</p>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Running pandas analysis…
          </CardContent>
        </Card>
      )}

      {result && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Rows", value: result.overview.rows.toLocaleString() },
              { label: "Columns", value: result.overview.columns },
              {
                label: "Missing Values",
                value: result.overview.missing_values.toLocaleString(),
              },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> AI Insights
              </CardTitle>
              <p className="text-xs text-muted-foreground">{result.filename}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.insights.map((ins, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {result.charts.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {result.charts.slice(0, 2).map((chart, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-sm">{chart.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {i === 0 ? (
                      <AreaTrend data={chart.points} />
                    ) : (
                      <PriorityBars data={chart.points} />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Column statistics</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Column</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Missing</th>
                    <th className="pb-2 pr-4 font-medium">Mean</th>
                    <th className="pb-2 pr-4 font-medium">Min</th>
                    <th className="pb-2 font-medium">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {result.overview.column_stats.map((c) => (
                    <tr key={c.name} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-4 font-medium">{c.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{c.dtype}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{c.missing}</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {c.mean ?? "—"}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{c.minimum ?? "—"}</td>
                      <td className="py-2 tabular-nums">{c.maximum ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
