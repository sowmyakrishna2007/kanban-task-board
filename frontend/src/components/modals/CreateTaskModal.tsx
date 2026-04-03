import type { NewTaskForm, ColumnId, PriorityId, TeamMember, LabelOption } from "../../types";
import { COLUMNS, PRIORITIES } from "../../constants";
import { toggleArr } from "../../utils";
import { Av } from "../Av";
import { StyledDropdown } from "../StyledDropdown";
import { CustomDatePicker } from "../CustomDatePicker";

/**
 * CreateTaskModal
 *
 * Modal form for creating a new task. Clicking the overlay background closes it.
 * The Create Task button is disabled until a title is entered or while saving.
 *
 * Fields: title (required), description, status, priority, due date, labels, assignees.
 * Assignees section is hidden if no team members exist yet.
 * Labels section shows an empty state message if no labels exist yet.
 *
 * @param nTask         — current form values
 * @param setNTask      — updates form values
 * @param saving        — disables the submit button while the API call is in flight
 * @param team          — list of team members for the assignee selector
 * @param labelOptions  — list of available labels for the label selector
 * @param onClose       — closes the modal and resets form state
 * @param onCreate      — submits the form and creates the task via the API
 */

interface CreateTaskModalProps {
  nTask: NewTaskForm;
  setNTask: React.Dispatch<React.SetStateAction<NewTaskForm>>;
  saving: boolean;
  team: TeamMember[];
  labelOptions: LabelOption[];
  onClose: () => void;
  onCreate: () => void;
}

export function CreateTaskModal({ nTask, setNTask, saving, team, labelOptions, onClose, onCreate }: CreateTaskModalProps) {
  return (
    // Clicking the overlay background closes the modal
    <div className="overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" onPointerDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="mhdr">
          <span className="mtitle">New Task</span>
          <button className="xbtn" onClick={onClose}>×</button>
        </div>

        <div className="mbody">

          {/* Title — required field */}
          <div className="fr">
            <label className="fl">Title *</label>
            <input
              className="fi"
              placeholder="What needs to be done?"
              value={nTask.title}
              onChange={e => setNTask(n => ({ ...n, title: e.target.value }))}
              autoFocus
            />
          </div>

          {/* Description — optional */}
          <div className="fr">
            <label className="fl">Description</label>
            <textarea
              className="fi"
              placeholder="Add more details…"
              value={nTask.description}
              onChange={e => setNTask(n => ({ ...n, description: e.target.value }))}
            />
          </div>

          {/* Status and Priority — side by side */}
          <div className="g2">
            <div className="fr">
              <label className="fl">Status</label>
              <StyledDropdown
                value={nTask.status}
                onChange={v => setNTask(n => ({ ...n, status: v as ColumnId }))}
                options={COLUMNS.map(c => ({ value: c.id, label: c.label }))}
              />
            </div>
            <div className="fr">
              <label className="fl">Priority</label>
              <StyledDropdown
                value={nTask.priority}
                onChange={v => setNTask(n => ({ ...n, priority: v as PriorityId }))}
                options={PRIORITIES.map(p => ({ value: p.id, label: p.label }))}
              />
            </div>
          </div>

          {/* Due date */}
          <div className="fr">
            <label className="fl">Due Date</label>
            <CustomDatePicker value={nTask.dueDate} onChange={val => setNTask(n => ({ ...n, dueDate: val }))} />
          </div>

          {/* Labels — clicking a label toggles it on/off */}
          <div className="fr">
            <label className="fl">Labels</label>
            <div className="lt">
              {labelOptions.map(l => (
                <div
                  key={l.id}
                  className="ltog"
                  onClick={() => setNTask(n => ({ ...n, labels: toggleArr(n.labels, l.id) }))}
                  style={{
                    // Highlight active labels with their color
                    background:  nTask.labels.includes(l.id) ? l.color + "22" : "transparent",
                    borderColor: nTask.labels.includes(l.id) ? l.color : "var(--border2)",
                    color:       nTask.labels.includes(l.id) ? l.color : "var(--text3)",
                  }}
                >
                  {l.label}
                </div>
              ))}
              {/* Empty state — shown when no labels have been created yet */}
              {labelOptions.length === 0 && (
                <span style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>
                  No labels yet — create some in Labels
                </span>
              )}
            </div>
          </div>

          {/* Assignees — only shown if team members exist */}
          {team.length > 0 && (
            <div className="fr">
              <label className="fl">Assignees</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {team.map(m => (
                  <div
                    key={m.id}
                    className={`atog${nTask.assignees.includes(m.id) ? " sel" : ""}`}
                    onClick={() => setNTask(n => ({ ...n, assignees: toggleArr(n.assignees, m.id) }))}
                  >
                    <Av name={m.name} color={m.color} size={20} />{m.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — Cancel and Create buttons */}
        <div className="mfoot">
          <button className="btn btn-g" onClick={onClose}>Cancel</button>
          {/* Disabled until title is filled in or while API call is in flight */}
          <button className="btn btn-p" disabled={!nTask.title.trim() || saving} onClick={onCreate}>
            {saving ? "Creating…" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}