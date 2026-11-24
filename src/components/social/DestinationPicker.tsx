import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, ChevronDown } from "lucide-react";
import type { Platform } from "@/lib/types";
import { listSocialDestinations, setSocialDestination } from "@/lib/social/social.functions";

const LABEL: Partial<Record<Platform, string>> = {
  facebook: "Facebook Page",
  instagram: "Instagram account",
};

function emptyHint(platform: Platform): string {
  if (platform === "facebook") {
    return "No Facebook Pages found. During the Facebook login, choose “Edit access” and enable at least one Page, then click Sync on this account.";
  }
  if (platform === "instagram") {
    return "No Instagram account found. Instagram publishing needs an Instagram Business/Creator account linked to a Facebook Page you manage. Link one, then click Sync on this account.";
  }
  return "This connection returned no destinations.";
}

/**
 * Lets the team pick the concrete destination a connected account publishes to
 * (e.g. a specific Facebook Page). Without a selection a Facebook account
 * cannot publish, so this is required before publishing.
 */
export function DestinationPicker({
  accountId,
  platform,
  currentName,
  onChanged,
}: {
  accountId: string;
  platform: Platform;
  currentName: string | null;
  onChanged: () => void;
}) {
  const load = useServerFn(listSocialDestinations);
  const save = useServerFn(setSocialDestination);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const label = LABEL[platform] ?? "Destination";

  async function openPicker() {
    setOpen(true);
    setLoading(true);
    try {
      const res = await load({ data: { accountId } });
      setItems(res.destinations ?? []);
      setSelected(res.selected ?? null);
      if ((res.destinations ?? []).length === 0) {
        toast.message(`No ${label} found for this connection.`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function choose(d: { id: string; name: string }) {
    setBusy(true);
    try {
      await save({ data: { accountId, destinationId: d.id, destinationName: d.name } });
      toast.success(`${label} saved`);
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={openPicker}
        className="inline-flex items-center gap-1.5 rounded-sm border editorial-rule px-2.5 py-1.5 hover:bg-foreground/5"
        title={`Choose the ${label}`}
      >
        <span className="max-w-[10rem] truncate">
          {currentName ? `${label}: ${currentName}` : `Select ${label}`}
        </span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/50 p-4"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-lg bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b editorial-rule p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Choose {label}
              </p>
              <h3 className="font-display text-xl">Publishing destination</h3>
            </div>
            {loading ? (
              <p className="p-6 text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">{emptyHint(platform)}</p>
            ) : (
              <ul className="divide-y editorial-rule">
                {items.map((d) => (
                  <li key={d.id}>
                    <button
                      disabled={busy}
                      onClick={() => choose(d)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-foreground/[0.03] disabled:opacity-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{d.name}</span>
                        <span className="block text-[11px] text-muted-foreground">{d.id}</span>
                      </span>
                      {selected === d.id && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t editorial-rule p-3 text-right">
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                className="rounded-sm border editorial-rule px-3 py-1.5 text-sm hover:bg-foreground/5 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
