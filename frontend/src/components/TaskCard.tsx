import type { Task, TeamMember, LabelOption } from "../types";
import { PRIORITIES } from "../constants";
import { getDueBadge } from "../utils";
import { Av } from "./Av";

/**
 * TaskCard
 *
 * Renders a single task card on the Kanban board.
 *
 * Displays:
 *  - Task title
 *  - Labels, priority badge, and due date badge (if any)
 *  - Assignee avatars (up to 3)
 *  - Comment count
 *
 * The card becomes semi-transparent (ghost) while it's being dragged.
 * Pointer events are handled by the parent via useDragAndDrop —
 * onPointerDown initiates the drag, onClick opens the detail modal.
 *
 * @param task          — the task data to display
 * @param team          — full team list, used to resolve assignee IDs to names/colors
 * @param labelOptions  — full label list, used to resolve label IDs to names/colors
 * @param ghost         — if true, fades the card out while its clone is being dragged
 * @param onPointerDown — passed to the drag hook to start a drag interaction
 * @param onClick       — opens the detail modal for this task
 */

interface TaskCardProps {
  task: Task;
  team: TeamMember[];
  labelOptions: LabelOption[];
  ghost: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onClick: () => void;
}

export function TaskCard({ task, team, labelOptions, ghost, onPointerDown, onClick }: TaskCardProps) {
  const pri = PRIORITIES.find(p => p.id === task.priority);

  // Due date badge is only shown on tasks that aren't done
  const due = task.status !== "done" ? getDueBadge(task.dueDate) : null;

  return (
    <div
      className={`card${ghost ? " ghost" : ""}`}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {/* Task title */}
      <div className="card-title">{task.title}</div>

      {/* Meta row — only rendered if there's at least one label, priority, or due badge */}
      {(task.labels.length > 0 || pri || due) && (
        <div className="card-meta">

          {/* Label pills — resolved from IDs to name/color */}
          {task.labels.map(lid => {
            const l = labelOptions.find(x => x.id === lid);
            return l ? (
              <span key={lid} className="pill" style={{ background: l.color + "1a", color: l.color }}>
                {l.label}
              </span>
            ) : null;
          })}

          {/* Priority badge — icon changes based on level */}
          {pri && (
            <span className="pill" style={{ background: pri.color + "1a", color: pri.color }}>
              {task.priority === "high" ? "▲" : task.priority === "low" ? "▼" : "●"} {pri.label}
            </span>
          )}

          {/* Due date badge — "Overdue" or "Due soon", null if on time */}
          {due && (
            <span className="pill" style={{ background: due.bg, color: due.color }}>⏰ {due.label}</span>
          )}
        </div>
      )}

      {/* Card footer — assignee avatars and comment count */}
      <div className="card-footer">

        {/* Show up to 3 assignee avatars */}
        <div className="avs">
          {task.assignees.slice(0, 3).map(aid => {
            const m = team.find(x => x.id === aid);
            return m ? <Av key={aid} name={m.name} color={m.color} /> : null;
          })}
        </div>

        {/* Comment count — only shown if there are comments */}
        {task.comments.length > 0 && (
          <div className="cc">
            <svg width="11" height="11" fill="none" viewBox="0 0 11 11">
              <path d="M9 1H2a1 1 0 00-1 1v5a1 1 0 001 1h1.5L5 10l1.5-2H9a1 1 0 001-1V2a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {task.comments.length}
          </div>
        )}
      </div>
    </div>
  );
}