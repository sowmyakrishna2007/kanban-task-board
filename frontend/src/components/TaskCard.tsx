import type { Task, TeamMember, LabelOption } from "../types";
import { PRIORITIES } from "../constants";
import { getDueBadge } from "../utils";
import { Av } from "./Av";

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
  const due = task.status !== "done" ? getDueBadge(task.dueDate) : null;

  return (
    <div className={`card${ghost ? " ghost" : ""}`} onPointerDown={onPointerDown} onClick={onClick}>
      <div className="card-title">{task.title}</div>
      {(task.labels.length > 0 || pri || due) && (
        <div className="card-meta">
          {task.labels.map(lid => {
            const l = labelOptions.find(x => x.id === lid);
            return l ? (
              <span key={lid} className="pill" style={{ background: l.color + "1a", color: l.color }}>
                {l.label}
              </span>
            ) : null;
          })}
          {pri && (
            <span className="pill" style={{ background: pri.color + "1a", color: pri.color }}>
              {task.priority === "high" ? "▲" : task.priority === "low" ? "▼" : "●"} {pri.label}
            </span>
          )}
          {due && (
            <span className="pill" style={{ background: due.bg, color: due.color }}>⏰ {due.label}</span>
          )}
        </div>
      )}
      <div className="card-footer">
        <div className="avs">
          {task.assignees.slice(0, 3).map(aid => {
            const m = team.find(x => x.id === aid);
            return m ? <Av key={aid} name={m.name} color={m.color} /> : null;
          })}
        </div>
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