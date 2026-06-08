import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Supabase project upload cap (free plan default). Adjust if the plan changes. */
export const MAX_UPLOAD_MB = 50;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Splits files into ones within the size cap and ones that exceed it. */
export function splitBySize(files: File[]): { ok: File[]; tooBig: File[] } {
  const ok: File[] = [];
  const tooBig: File[] = [];
  for (const f of files) (f.size > MAX_UPLOAD_BYTES ? tooBig : ok).push(f);
  return { ok, tooBig };
}

/**
 * Turns an arbitrary upload filename into a safe Supabase Storage object key.
 * Storage keys reject emojis, accents, and most punctuation, so we strip
 * accents, drop anything outside [a-z0-9.-], collapse separators, and cap the
 * length while preserving the extension.
 */
export function safeStorageName(name: string): string {
  const dot = name.lastIndexOf(".");
  const rawExt = dot > 0 ? name.slice(dot + 1) : "";
  const rawBase = dot > 0 ? name.slice(0, dot) : name;
  const clean = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "") // strip accent marks
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  const base = clean(rawBase).slice(0, 40) || "file";
  const ext = clean(rawExt).slice(0, 8);
  return ext ? `${base}.${ext}` : base;
}
