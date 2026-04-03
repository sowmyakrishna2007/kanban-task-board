import type { Task, ColumnId, PriorityId, TeamMember, LabelOption } from "../../types";
import { COLUMNS, PRIORITIES } from "../../constants";
import { timeAgo, getDueBadge, toggleArr } from "../../utils";
import { Av } from "../Av";
import { StyledDropdown } from "../StyledDropdown";
import { CustomDatePicker } from "../CustomDatePicker";

/**
 * DetailModal
 *
 * Full task detail and edit panel. Opens when a task card is clicked.
 *
 * Has two tabs:
 *  - Details — editable fields (status, priority, due date, labels, assignees,
 *               description) plus the comment thread
 *  - Activity — chronological timeline of all changes to the task
 *
 * All field edits call onUpdateField immediately (optimistic update).
 * Status changes call onMove which also logs an activity entry.
 * Comments are submitted on Enter or via the Post button.
 * Deletion requires a confirmation dialog before calling onDelete.
 *
 * @param task           — the task being viewed/edited
 * @param team           — full team list for the assignee selector
 * @param labelOptions   — full label list for the label selector
 * @param detailTab      — which tab is currently active
 * @param setDetailTab   — switches between details and activity tabs
 * @param nComment       — current comment input value
 * @param setNComment    — updates the comment input
 * @param onClose        — closes the modal
 * @param onDelete       — deletes the task after confirmation
 * @param onComment      — posts a new comment
 * @param onMove         — moves the task to a new status column
 * @param onUpdateField  — updates any single field on the task
 */

interface DetailModalProps {
  task: Task;
  team: TeamMember[];
  labelOptions: LabelOption[];
  detailTab: "details" | "activity";
  setDetailTab: (tab: "details" | "activity") => void;
  nComment: string;
  setNComment: (val: string) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onComment: (id: string) => void;
  onMove: (id: string, status: ColumnId) => void;
  onUpdateField: <K extends keyof Task>(id: string, key: K, value: Task[K]) => void;
}

export function DetailModal({
  task, team, labelOptions, detailTab, setDetailTab,
  nComment, setNComment, onClose, onDelete, onComment, onMove, onUpdateField,
}: DetailModalProps) {
  return (
    // Clicking the overlay background closes the modal
    <div className="overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal dm" onPointerDown={e => e.stopPropagation()} style={{ maxWidth: 620 }}>

        {/* ── Header — title, status/priority/due badges, delete button ── */}
        <div className="mhdr" style={{ alignItems: "flex-start", padding: "16px 20px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Status, priority, and due date badges shown as read-only pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {(() => {
                const col = COLUMNS.find(c => c.id === task.status);
                return col ? (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: col.color + "20", color: col.color }}>{col.label}</span>
                ) : null;
              })()}
              {(() => {
                const pri = PRIORITIES.find(p => p.id === task.priority);
                return pri ? (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: pri.color + "20", color: pri.color }}>
                    {task.priority === "high" ? "▲" : task.priority === "low" ? "▼" : "●"} {pri.label}
                  </span>
                ) : null;
              })()}
              {/* Due badge only shown on tasks that aren't done */}
              {(() => {
                if (task.status === "done") return null;
                const b = getDueBadge(task.dueDate);
                return b ? (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: b.bg, color: b.color }}>⏰ {b.label}</span>
                ) : null;
              })()}
            </div>

            {/* Task title */}
            <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", lineHeight: 1.4, textAlign: "left" }}>
              {task.title}
            </div>
          </div>

          {/* Delete button + close button */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            <button
              className="ibtn"
              style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
              onClick={() => { if (window.confirm(`Delete "${task.title}"?`)) onDelete(task.id); }}
            >
              Delete
            </button>
            <button className="xbtn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* ── Tab bar — Details / Activity ── */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px", flexShrink: 0 }}>
          {(["details", "activity"] as const).map(tab => (
            <button key={tab} onClick={() => setDetailTab(tab)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500,
              color: detailTab === tab ? "var(--accent)" : "var(--text3)",
              padding: "10px 14px 9px",
              borderBottom: detailTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1, transition: "color 0.15s", textTransform: "capitalize",
            }}>{tab}</button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "visible", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Details tab ── */}
          {detailTab === "details" && (
            <>
              {/* Properties grid — status, priority, due date */}
              <div className="detail-grid">
                <div className="detail-grid-cell">
                  <div className="detail-grid-label">Status</div>
                  {/* Status change triggers onMove which also logs an activity entry */}
                  <StyledDropdown small value={task.status}
                    onChange={v => onMove(task.id, v as ColumnId)}
                    options={COLUMNS.map(c => ({ value: c.id, label: c.label }))} />
                </div>
                <div className="detail-grid-cell">
                  <div className="detail-grid-label">Priority</div>
                  <StyledDropdown small value={task.priority}
                    onChange={v => onUpdateField(task.id, "priority", v as PriorityId)}
                    options={PRIORITIES.map(p => ({ value: p.id, label: p.label }))} />
                </div>
                <div className="detail-grid-cell">
                  <div className="detail-grid-label">Due Date</div>
                  <CustomDatePicker value={task.dueDate}
                    onChange={val => onUpdateField(task.id, "dueDate", val)} />
                </div>
              </div>

              {/* Labels — clicking toggles assignment */}
              {labelOptions.length > 0 && (
                <div>
                  <span className="detail-section-label">Labels</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {labelOptions.map(l => {
                      const active = task.labels.includes(l.id);
                      return (
                        <span key={l.id}
                          onClick={() => onUpdateField(task.id, "labels", toggleArr(task.labels, l.id))}
                          style={{
                            fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 5, cursor: "pointer",
                            transition: "all 0.15s",
                            background: active ? l.color + "20" : "transparent",
                            color:      active ? l.color : "var(--text3)",
                            border:     `1px solid ${active ? l.color + "55" : "var(--border2)"}`,
                          }}>{l.label}</span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Assignees — clicking toggles assignment, checkmark shown when assigned */}
              {team.length > 0 && (
                <div>
                  <span className="detail-section-label">Assignees</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {team.map(m => {
                      const on = task.assignees.includes(m.id);
                      return (
                        <div key={m.id}
                          onClick={() => onUpdateField(task.id, "assignees", toggleArr(task.assignees, m.id))}
                          style={{
                            display: "flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 6px",
                            borderRadius: 99, cursor: "pointer",
                            background: on ? "var(--accent-dim)" : "var(--bg3)",
                            border:     `1px solid ${on ? "rgba(56,180,255,0.3)" : "var(--border2)"}`,
                            transition: "all 0.15s",
                          }}>
                          <Av name={m.name} color={m.color} size={22} />
                          <span style={{ fontSize: 13, color: on ? "var(--text)" : "var(--text2)" }}>{m.name}</span>
                          {on && <span style={{ fontSize: 10, color: "var(--accent)", marginLeft: 2 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description — editable textarea */}
              <div>
                <span className="detail-section-label">Description</span>
                <textarea
                  className="fi"
                  placeholder="Add a description…"
                  value={task.description}
                  onChange={e => onUpdateField(task.id, "description", e.target.value)}
                  style={{ minHeight: 80, resize: "vertical", lineHeight: 1.6, fontSize: 14 }}
                />
              </div>

              {/* Comments — sorted newest first, Enter submits */}
              <div>
                <span className="detail-section-label">
                  Comments{task.comments.length > 0 && (
                    <span style={{ color: "var(--text3)", fontWeight: 400, textTransform: "none", fontSize: 11, marginLeft: 4 }}>
                      ({task.comments.length})
                    </span>
                  )}
                </span>
                {task.comments.length > 0 && (
                  <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden", marginBottom: 10 }}>
                    {[...task.comments]
                      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                      .map((c, i, arr) => (
                        <div key={c.id} style={{
                          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                          padding: "10px 14px",
                          borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                          gap: 12,
                        }}>
                          <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{c.text}</span>
                          {/* Relative timestamp e.g. "2m ago" */}
                          <span style={{ fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>{timeAgo(c.at)}</span>
                        </div>
                      ))}
                  </div>
                )}
                {/* Comment input — Enter (without Shift) submits */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="fi"
                    style={{ flex: 1, borderRadius: 99, paddingLeft: 16, fontSize: 13 }}
                    placeholder="Add a comment…"
                    value={nComment}
                    onChange={e => setNComment(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onComment(task.id); } }}
                  />
                  <button className="btn btn-p btn-sm" onClick={() => onComment(task.id)}>Post</button>
                </div>
              </div>
            </>
          )}

          {/* ── Activity tab — chronological event timeline ── */}
          {detailTab === "activity" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {task.activity.length === 0 && (
                <span style={{ fontSize: 13, color: "var(--text3)", fontStyle: "italic" }}>No activity yet.</span>
              )}
              {[...task.activity]
                .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                .map((a, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 0", borderBottom: "1px solid var(--border)",
                  }}>
                    {/* Activity type icon — color coded by event type */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: a.type === "moved" ? "rgba(56,180,255,0.15)" : a.type === "comment" ? "rgba(16,185,129,0.15)" : "var(--bg4)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                    }}>
                      {a.type === "moved" ? "→" : a.type === "comment" ? "💬" : a.type === "created" ? "✦" : "✎"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.45 }}>{a.text}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>{timeAgo(a.at)}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}