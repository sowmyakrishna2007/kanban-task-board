import { createClient } from "@supabase/supabase-js";

/**
 * Supabase.ts
 *
 * Initializes the Supabase client using environment variables and exports
 * it for use across the app. Also exports TypeScript interfaces that mirror
 * each database table's row shape for type safety when working with API responses.
 *
 * Required environment variables (set in .env.local):
 *   VITE_SUPABASE_URL      — your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY — your Supabase public anon key
 */

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Fail fast if env vars are missing — better than a cryptic auth error later
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

/** Shared Supabase client instance — used for anonymous auth on the frontend. */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Database Row Types ────────────────────────────────────────────────────────
// These interfaces mirror the exact shape of each Supabase table row.
// Used for typing API responses before mapping to frontend types in App.tsx.

/** Mirrors the `tasks` table. */
export interface DBTask {
  id:          string;
  user_id:     string;
  title:       string;
  description: string;
  status:      "todo" | "in_progress" | "in_review" | "done";
  priority:    "low" | "normal" | "high";
  due_date:    string | null;
  assignees:   string[];   // Array of team_member IDs
  label_ids:   string[];   // Array of label IDs
  created_at:  string;
}

/** Mirrors the `comments` table. */
export interface DBComment {
  id:         string;
  task_id:    string;  // Foreign key → tasks.id
  user_id:    string;  // Foreign key → auth.users.id
  text:       string;
  created_at: string;
}

/** Mirrors the `activity` table. */
export interface DBActivity {
  id:         string;
  task_id:    string;  // Foreign key → tasks.id
  user_id:    string;  // Foreign key → auth.users.id
  type:       "created" | "moved" | "comment" | "updated";
  text:       string;  // Human-readable description of the event
  created_at: string;
}

/** Mirrors the `team_members` table. */
export interface DBTeamMember {
  id:         string;
  user_id:    string;  // Foreign key → auth.users.id (owner of this member entry)
  name:       string;
  color:      string;  // Hex color for avatar display
  created_at: string;
}

/** Mirrors the `labels` table. */
export interface DBLabel {
  id:         string;
  user_id:    string;  // Foreign key → auth.users.id (owner of this label)
  label:      string;  // Display name
  color:      string;  // Hex color for pill display
  created_at: string;
}