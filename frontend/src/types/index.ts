export type ColumnId = "todo" | "in_progress" | "in_review" | "done";
export type PriorityId = "low" | "normal" | "high";

export interface Column { id: ColumnId; label: string; color: string; }
export interface Priority { id: PriorityId; label: string; color: string; }
export interface LabelOption { id: string; label: string; color: string; }
export interface TeamMember { id: string; name: string; color: string; }

export interface Comment { id: string; author: string; text: string; at: string; }
export interface ActivityEntry { type: "created" | "moved" | "comment" | "updated"; at: string; text: string; }

export interface Task {
  id: string;
  title: string;
  description: string;
  status: ColumnId;
  priority: PriorityId;
  labels: string[];
  assignees: string[];
  dueDate: string;
  comments: Comment[];
  activity: ActivityEntry[];
  createdAt: string;
}

export interface NewTaskForm {
  title: string; description: string; priority: PriorityId;
  labels: string[]; assignees: string[]; dueDate: string; status: ColumnId;
}

export interface DueBadge { label: string; color: string; bg: string; }
export interface DragState { taskId: string; ox: number; oy: number; }