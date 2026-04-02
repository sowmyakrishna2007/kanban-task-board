import type { NewTaskForm, ColumnId, PriorityId, TeamMember, LabelOption } from "../../types";
import { COLUMNS, PRIORITIES } from "../../constants";
import { toggleArr } from "../../utils";
import { Av } from "../Av";
import { StyledDropdown } from "../StyledDropdown";
import { CustomDatePicker } from "../CustomDatePicker";

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
    <div className="overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" onPointerDown={e => e.stopPropagation()}>
        <div className="mhdr">
          <span className="mtitle">New Task</span>
          <button className="xbtn" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
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
          <div className="fr">
            <label className="fl">Description</label>
            <textarea
              className="fi"
              placeholder="Add more details…"
              value={nTask.description}
              onChange={e => setNTask(n => ({ ...n, description: e.target.value }))}
            />
          </div>
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
          <div className="fr">
            <label className="fl">Due Date</label>
            <CustomDatePicker value={nTask.dueDate} onChange={val => setNTask(n => ({ ...n, dueDate: val }))} />
          </div>
          <div className="fr">
            <label className="fl">Labels</label>
            <div className="lt">
              {labelOptions.map(l => (
                <div
                  key={l.id}
                  className="ltog"
                  onClick={() => setNTask(n => ({ ...n, labels: toggleArr(n.labels, l.id) }))}
                  style={{
                    background: nTask.labels.includes(l.id) ? l.color + "22" : "transparent",
                    borderColor: nTask.labels.includes(l.id) ? l.color : "var(--border2)",
                    color: nTask.labels.includes(l.id) ? l.color : "var(--text3)",
                  }}
                >
                  {l.label}
                </div>
              ))}
              {labelOptions.length === 0 && (
                <span style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>
                  No labels yet — create some in Labels
                </span>
              )}
            </div>
          </div>
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
        <div className="mfoot">
          <button className="btn btn-g" onClick={onClose}>Cancel</button>
          <button className="btn btn-p" disabled={!nTask.title.trim() || saving} onClick={onCreate}>
            {saving ? "Creating…" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}