"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ListChecks, Search } from "lucide-react";
import { useDocuments } from "@/hooks/use-documents";
import { useActions } from "@/hooks/use-actions";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@/components/ui/dialog";

/** Searches the current user's own documents and actions (real data only). */
export function GlobalSearch() {
  const [q, setQ] = useState("");
  const router = useRouter();
  const { data: docs } = useDocuments();
  const { data: actions } = useActions();

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return { docs: [], actions: [] };
    return {
      docs: (docs?.documents ?? [])
        .filter((d) => d.original_filename.toLowerCase().includes(needle))
        .slice(0, 5),
      actions: (actions ?? [])
        .filter(
          (a) =>
            a.title.toLowerCase().includes(needle) ||
            a.owner.toLowerCase().includes(needle),
        )
        .slice(0, 5),
    };
  }, [q, docs, actions]);

  const empty = q.trim() && !results.docs.length && !results.actions.length;

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-border px-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your documents and actions…"
          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
        {!q.trim() && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Start typing to search your workspace.
          </p>
        )}
        {empty && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No matches in your workspace for &ldquo;{q}&rdquo;.
          </p>
        )}
        {results.docs.length > 0 && (
          <Section title="Documents">
            {results.docs.map((d) => (
              <DialogClose asChild key={d.id}>
                <button
                  onClick={() => router.push("/dashboard/documents")}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{d.original_filename}</span>
                </button>
              </DialogClose>
            ))}
          </Section>
        )}
        {results.actions.length > 0 && (
          <Section title="Actions">
            {results.actions.map((a) => (
              <DialogClose asChild key={a.id}>
                <button
                  onClick={() => router.push("/dashboard/actions")}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{a.title}</span>
                </button>
              </DialogClose>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}
