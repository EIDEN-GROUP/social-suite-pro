import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Post } from "@/lib/types";
import { listPendingApprovalPopups } from "@/lib/publishing/publishing.functions";
import { ApprovalPublishDialog } from "@/components/ApprovalPublishDialog";

const DISMISS_KEY = "smim-dismissed-approvals";

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

type Candidate = { post: Post; company: Company | null };

/**
 * Mounted once in the authenticated layout. Watches for posts that flip to
 * "approved" and surfaces the internal publish-confirmation popup. Purely
 * additive - it never changes the client's approval experience.
 */
export function ApprovalWatcher() {
  const load = useServerFn(listPendingApprovalPopups);
  const [queue, setQueue] = useState<Candidate[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);
  const [closed, setClosed] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await load({ data: {} });
      setQueue((res.posts as unknown as Candidate[]) ?? []);
    } catch {
      /* not signed in / transient - ignore */
    }
  }, [load]);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("approval-watcher")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  function dismiss(postId: string) {
    setDismissed((prev) => {
      const next = Array.from(new Set([...prev, postId]));
      try {
        localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable - popup may reappear next visit */
      }
      return next;
    });
  }

  const current =
    queue.find((c) => !dismissed.includes(c.post.id) && !closed.includes(c.post.id)) ?? null;
  if (!current) return null;

  return (
    <ApprovalPublishDialog
      key={current.post.id}
      post={current.post}
      company={current.company}
      onClose={() => setClosed((prev) => Array.from(new Set([...prev, current.post.id])))}
      onDismiss={dismiss}
    />
  );
}
