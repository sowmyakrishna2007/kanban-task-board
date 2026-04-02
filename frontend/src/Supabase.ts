// src/supabase.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env file."
  );
}
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Types that mirror the DB rows ────────────────────────────

export interface DBTask {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "low" | "normal" | "high";
  due_date: string | null;
  assignees: string[];
  label_ids: string[];
  created_at: string;
}

export interface DBComment {
  id: string;
  task_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface DBActivity {
  id: string;
  task_id: string;
  user_id: string;
  type: "created" | "moved" | "comment" | "updated";
  text: string;
  created_at: string;
}

export interface DBTeamMember {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface DBLabel {
  id: string;
  user_id: string;
  label: string;
  color: string;
  created_at: string;
}