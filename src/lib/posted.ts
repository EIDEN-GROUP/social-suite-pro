import { formatDistanceToNow } from "date-fns";
import type { Platform } from "@/lib/types";

/** ISO string -> value for <input type="datetime-local"> in the user's timezone. */
export function toLocalInputValue(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** "Tue, Oct 6 · 3:20 PM" */
export function formatPostedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

/** "2 hours ago" */
export function postedAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatDistanceToNow(d, { addSuffix: true });
}

/** "instagram.com" for a live link, used as button sub-label. */
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const LINK_PLACEHOLDER: Record<Platform, string> = {
  instagram: "https://instagram.com/p/...",
  tiktok: "https://tiktok.com/@.../video/...",
  facebook: "https://facebook.com/.../posts/...",
  twitter: "https://x.com/.../status/...",
  linkedin: "https://linkedin.com/posts/...",
};
