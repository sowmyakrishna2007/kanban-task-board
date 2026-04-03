/**
 * types/index.ts
 *
 * All TypeScript types and interfaces used across the frontend.
 * These are the frontend representations of data — distinct from the
 * DB row types in Supabase.ts which mirror the raw database shape.
 */

// ── Union Types ───────────────────────────────────────────────────────────────

/** Valid task status values — map to the four Kanban columns */
export type ColumnId = "todo" | "in_progress" | "in_review" | "done";

/** Valid task priority levels */
export type PriorityId = "low" | "normal" | "high";

// ── Config Interfaces ─────────────────────────────────────────────────────────

/** A Kanban column definition */
export interface Column { id: ColumnId; label: string; color: string; }

/** A priority level definition */
export interface Priority { id: PriorityId; label: string; color: string; }

/** A label option available to assign to tasks */
export interface LabelOption { id: string; label: string; color: string; }

/** A team member that can be assigned to tasks */
export interface TeamMember { id: string; name: string; color: string; }

// ── Task Sub-types ────────────────────────────────────────────────────────────

/** A single comment on a task */
export interface Comment {
  id:     string;
  author: string; // user_id of the commenter
  text:   string;
  at:     string; // ISO timestamp
}

/** A single entry in a task's activity log */
export interface ActivityEntry {
  type: "created" | "moved" | "comment" | "updated";
  at:   string; // ISO timestamp
  text: string; // Human-readable description e.g. "Moved from To Do → In Progress"
}

// ── Core Interfaces ───────────────────────────────────────────────────────────

/**
 * Task — the primary data model.
 * Uses camelCase field names on the frontend (mapped from snake_case DB columns in App.tsx).
 */
export interface Task {
  id:          string;
  title:       string;
  description: string;
  status:      ColumnId;
  priority:    PriorityId;
  labels:      string[];        // Array of LabelOption IDs
  assignees:   string[];        // Array of TeamMember IDs
  dueDate:     string;          // ISO date string e.g. "2026-04-23", or "" if unset
  comments:    Comment[];       // Loaded upfront and stored alongside the task
  activity:    ActivityEntry[]; // Loaded upfront and stored alongside the task
  createdAt:   string;          // ISO timestamp
}

/**
 * NewTaskForm — shape of the create task modal's form state.
 * Mirrors Task but only includes the fields a user can set at creation time.
 */
export interface NewTaskForm {
  title:       string;
  description: string;
  priority:    PriorityId;
  labels:      string[];
  assignees:   string[];
  dueDate:     string;
  status:      ColumnId;
}

// ── Utility Interfaces ────────────────────────────────────────────────────────

/** Return type of getDueBadge — contains the display text and colors for the badge */
export interface DueBadge {
  label: string; // e.g. "Overdue" or "Due soon"
  color: string; // Text color
  bg:    string; // Background color
}

/** Internal drag state — tracks which task is being dragged and the grab offset */
export interface DragState {
  taskId: string;
  ox:     number; // X offset from card's left edge where the user grabbed it
  oy:     number; // Y offset from card's top edge where the user grabbed it
}