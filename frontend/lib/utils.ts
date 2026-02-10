import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Use for message file/image URLs so they load via the frontend (same-origin). Converts any absolute upload URL to /uploads/... so the Next rewrite can proxy to the API. Fixes broken images when the receiver cannot reach the backend (e.g. localhost:4000 from another device). */
export function uploadDisplayUrl(url: string | null | undefined): string {
  if (!url) return ""
  if (url.startsWith("/")) return url
  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith("/uploads/")) return parsed.pathname
  } catch {
    // ignore
  }
  return url
}
