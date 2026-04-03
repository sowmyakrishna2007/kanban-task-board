/**
 * utils/index.ts
 *
 * Pure utility functions with no React dependency.
 * All functions here are stateless and independently testable.
 */

import type { DueBadge } from "../types";

/**
 * timeAgo
 *
 * Converts an ISO timestamp into a human-readable relative time string.
 * Used for comment and activity timestamps throughout the UI.
 *
 * @example
 * timeAgo("2026-04-03T10:00:00Z") // "2h ago"
 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return "just now";
  if (diff < 3_600_000)  return Math.floor(diff / 60_000)    + "m ago";
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + "h ago";
  return Math.floor(diff / 86_400_000) + "d ago";
}

/**
 * getDueBadge
 *
 * Determines whether a task should show an urgency badge based on its due date.
 * Returns null if the task is on time or has no due date.
 * Only called for tasks that are not in the "done" column.
 *
 * @param dateStr — ISO date string (e.g. "2026-04-23"), or "" if unset
 * @returns DueBadge with label, text color, and background color — or null
 */
export function getDueBadge(dateStr: string): DueBadge | null {
  if (!dateStr) return null;
  // Compare at midnight to avoid time-of-day affecting the result
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  if (diff < 0)                  return { label: "Overdue",  color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  if (diff <= 2 * 86_400_000)    return { label: "Due soon", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return null;
}

/**
 * getInitials
 *
 * Extracts initials from a full name for use in avatar display.
 * Falls back to "?" if the name is empty.
 *
 * @example
 * getInitials("Sarah Jones") // "SJ"
 * getInitials("")            // "?"
 */
export function getInitials(name: string): string {
  return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase();
}

/**
 * toggleArr
 *
 * Adds an item to an array if it's not present, or removes it if it is.
 * Used for toggling labels and assignees on tasks.
 *
 * @example
 * toggleArr(["a", "b"], "c") // ["a", "b", "c"]
 * toggleArr(["a", "b"], "a") // ["b"]
 */
export function toggleArr<T>(arr: T[], id: T): T[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
}