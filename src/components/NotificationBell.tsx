import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications/notifications.functions";
import { postedAgo } from "@/lib/posted";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

/** Internal notification bell for the studio (approvals, publishing, account health). */
export function NotificationBell() {
  const load = useServerFn(listNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);

  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await load({ data: {} });
      setItems((res.items as unknown as Notification[]) ?? []);
      setUnread(res.unread);
    } catch {
      /* not signed in / transient */
    }
  }, [load]);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("notification-bell")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  async function openItem(n: Notification) {
    if (!n.read_at) {
      try {
        await markRead({ data: { id: n.id } });
        setItems((list) =>
          list.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)),
        );
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    if (n.link) window.location.assign(n.link);
  }

  async function onMarkAll() {
    try {
      await markAll({ data: {} });
      await refresh();
    } catch {
      /* ignore */
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
          title="Notifications"
          className={`relative rounded-full border p-2 transition ${
            open
              ? "border-foreground bg-foreground/5"
              : "editorial-rule text-foreground hover:bg-foreground/5"
          }`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white">
              {unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-foreground/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={onMarkAll}
              className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-foreground/5">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => openItem(n)}
                    className={`block w-full px-4 py-3 text-left transition hover:bg-foreground/[0.03] ${
                      n.read_at ? "" : "bg-sky-500/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      {!n.read_at && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                      )}
                    </div>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    )}
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {postedAgo(n.created_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
