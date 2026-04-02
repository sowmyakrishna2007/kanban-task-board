import type { DueBadge } from "../types";

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + "m ago";
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + "h ago";
  return Math.floor(diff / 86_400_000) + "d ago";
}

export function getDueBadge(dateStr: string): DueBadge | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  if (diff < 0) return { label: "Overdue", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  if (diff <= 2 * 86_400_000) return { label: "Due soon", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return null;
}

export function getInitials(name: string): string {
  return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase();
}

export function toggleArr<T>(arr: T[], id: T): T[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
}