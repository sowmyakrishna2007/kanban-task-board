/**
 * constants/index.ts
 *
 * Static configuration data used across the frontend.
 * Centralizing these here means column order, priority colors, and
 * default values only need to be changed in one place.
 */

import type { Column, Priority, NewTaskForm } from "../types";

// ── Board Columns ─────────────────────────────────────────────────────────────

/** The four Kanban columns in display order. Colors are used for badges and highlights. */
export const COLUMNS: Column[] = [
  { id: "todo",        label: "To Do",       color: "#6366f1" },
  { id: "in_progress", label: "In Progress", color: "#f59e0b" },
  { id: "in_review",   label: "In Review",   color: "#8b5cf6" },
  { id: "done",        label: "Done",        color: "#10b981" },
];

// ── Priority Levels ───────────────────────────────────────────────────────────

/** Priority options in ascending order. Colors are used for badge display on cards. */
export const PRIORITIES: Priority[] = [
  { id: "low",    label: "Low",    color: "#10b981" },
  { id: "normal", label: "Normal", color: "#6366f1" },
  { id: "high",   label: "High",   color: "#ef4444" },
];

// ── Color Palettes ────────────────────────────────────────────────────────────

/** Available colors for custom labels, shown as swatches in the Labels modal. */
export const LABEL_COLORS = [
  "#ef4444", "#f59e0b", "#10b981", "#6366f1", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#14b8a6",
];

/**
 * Colors auto-assigned to team members in order of creation.
 * Cycles back to the start if there are more members than colors.
 */
export const TEAM_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4",
];

// ── Form Defaults ─────────────────────────────────────────────────────────────

/** Default values for the create task form — reset to this after a task is created. */
export const BLANK_TASK: NewTaskForm = {
  title:       "",
  description: "",
  priority:    "normal",
  labels:      [],
  assignees:   [],
  dueDate:     "",
  status:      "todo",
};