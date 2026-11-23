import { AtSign, Facebook, Instagram, Linkedin, Music2 } from "lucide-react";
import type { ComponentType } from "react";
import type { Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

export const PLATFORM_META: Record<
  Platform,
  { label: string; Icon: ComponentType<{ className?: string }>; chip: string; dot: string }
> = {
  instagram: {
    label: "Instagram",
    Icon: Instagram,
    chip: "bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 text-white",
    dot: "bg-pink-500",
  },
  tiktok: { label: "TikTok", Icon: Music2, chip: "bg-black text-white", dot: "bg-teal-500" },
  facebook: {
    label: "Facebook",
    Icon: Facebook,
    chip: "bg-[#1877F2] text-white",
    dot: "bg-blue-600",
  },
  twitter: { label: "X", Icon: AtSign, chip: "bg-neutral-900 text-white", dot: "bg-neutral-800" },
  linkedin: {
    label: "LinkedIn",
    Icon: Linkedin,
    chip: "bg-[#0A66C2] text-white",
    dot: "bg-sky-600",
  },
};

export function PlatformBadge({ platform, className }: { platform: Platform; className?: string }) {
  const meta = PLATFORM_META[platform];
  const Icon = meta.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        meta.chip,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const Icon = PLATFORM_META[platform].Icon;
  return <Icon className={cn("h-4 w-4", className)} />;
}

export type AccountStatus =
  "connected" | "attention_required" | "expired" | "disconnected" | "error";

const STATUS_META: Record<AccountStatus, { label: string; cls: string; dot: string }> = {
  connected: {
    label: "Connected",
    cls: "bg-emerald-500/15 text-emerald-700",
    dot: "bg-emerald-500",
  },
  attention_required: {
    label: "Attention Required",
    cls: "bg-amber-400/20 text-amber-700",
    dot: "bg-amber-500",
  },
  expired: { label: "Expired", cls: "bg-orange-500/15 text-orange-700", dot: "bg-orange-500" },
  disconnected: {
    label: "Disconnected",
    cls: "bg-foreground/10 text-muted-foreground",
    dot: "bg-foreground/40",
  },
  error: { label: "Error", cls: "bg-rose-500/15 text-rose-700", dot: "bg-rose-500" },
};

export function AccountStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[(status as AccountStatus) ?? "error"] ?? STATUS_META.error;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        meta.cls,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function PublishCapabilityBadge({ canPublish }: { canPublish: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        canPublish
          ? "bg-emerald-500/15 text-emerald-700"
          : "bg-foreground/10 text-muted-foreground",
      )}
    >
      {canPublish ? "Publishing available" : "Publishing unavailable"}
    </span>
  );
}
