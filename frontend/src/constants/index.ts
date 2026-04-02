import type { Column, Priority, NewTaskForm } from "../types";

export const COLUMNS: Column[] = [
  { id: "todo",        label: "To Do",       color: "#6366f1" },
  { id: "in_progress", label: "In Progress", color: "#f59e0b" },
  { id: "in_review",   label: "In Review",   color: "#8b5cf6" },
  { id: "done",        label: "Done",        color: "#10b981" },
];

export const PRIORITIES: Priority[] = [
  { id: "low",    label: "Low",    color: "#10b981" },
  { id: "normal", label: "Normal", color: "#6366f1" },
  { id: "high",   label: "High",   color: "#ef4444" },
];

export const LABEL_COLORS = [
  "#ef4444","#f59e0b","#10b981","#6366f1","#8b5cf6",
  "#ec4899","#06b6d4","#84cc16","#f97316","#14b8a6",
];

export const TEAM_COLORS = [
  "#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4",
];

export const BLANK_TASK: NewTaskForm = {
  title: "", description: "", priority: "normal",
  labels: [], assignees: [], dueDate: "", status: "todo",
};