import type { Task, LabelOption } from "../../types";
import { LABEL_COLORS } from "../../constants";

/**
 * LabelsModal
 *
 * Modal for managing custom labels. Shows all existing labels with a
 * task count and delete button, plus a form to create new ones.
 *
 * The color picker shows swatches from LABEL_COLORS. A live preview
 * of the new label is shown once a name has been typed.
 *
 * @param labelOptions   — list of existing labels to display
 * @param tasks          — full task list, used to compute per-label task counts
 * @param nLabelName     — current name input value for the new label
 * @param setNLabelName  — updates the name input
 * @param nLabelColor    — currently selected color for the new label
 * @param setNLabelColor — updates the selected color
 * @param onClose        — closes the modal
 * @param onAdd          — creates the new label via the API
 * @param onDelete       — deletes an existing label by ID
 */

interface LabelsModalProps {
  labelOptions: LabelOption[];
  tasks: Task[];
  nLabelName: string;
  setNLabelName: (val: string) => void;
  nLabelColor: string;
  setNLabelColor: (val: string) => void;
  onClose: () => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export function LabelsModal({
  labelOptions, tasks, nLabelName, setNLabelName,
  nLabelColor, setNLabelColor, onClose, onAdd, onDelete,
}: LabelsModalProps) {
  return (
    // Clicking the overlay background closes the modal
    <div className="overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 440 }} onPointerDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="mhdr">
          <span className="mtitle">Manage Labels</span>
          <button className="xbtn" onClick={onClose}>×</button>
        </div>

        <div className="mbody">

          {/* Existing labels list */}
          {labelOptions.map(l => (
            <div key={l.id} className="mr">
              {/* Color swatch */}
              <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: l.color, fontWeight: 500 }}>{l.label}</span>
              {/* Task count — shows how many tasks currently use this label */}
              <span style={{ fontSize: 12, color: "var(--text3)", marginRight: 8 }}>
                {tasks.filter(t => t.labels.includes(l.id)).length} task{tasks.filter(t => t.labels.includes(l.id)).length !== 1 ? "s" : ""}
              </span>
              <button
                className="ibtn"
                style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
                onClick={() => onDelete(l.id)}
              >
                Delete
              </button>
            </div>
          ))}

          {/* Empty state */}
          {labelOptions.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text3)", fontStyle: "italic", padding: "8px 0" }}>No labels yet.</div>
          )}

          {/* Create new label form */}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 16 }}>
            <label className="fl" style={{ marginBottom: 10, display: "block" }}>Create New Label</label>

            {/* Name input — Enter submits, Add button disabled until name is typed */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="fi"
                style={{ flex: 1 }}
                placeholder="Label name"
                value={nLabelName}
                onChange={e => setNLabelName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") onAdd(); }}
              />
              <button className="btn btn-p btn-sm" onClick={onAdd} disabled={!nLabelName.trim()}>Add</button>
            </div>

            {/* Color swatches — selected swatch gets an outlined ring */}
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {LABEL_COLORS.map(c => (
                <div key={c} onClick={() => setNLabelColor(c)} style={{
                  width: 22, height: 22, borderRadius: 6, background: c, cursor: "pointer",
                  outline:       nLabelColor === c ? `2px solid ${c}` : "2px solid transparent",
                  outlineOffset: 2,
                  transition:    "outline .1s",
                }} />
              ))}
            </div>

            {/* Live preview — only shown once a name has been typed */}
            {nLabelName.trim() && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>Preview:</span>
                <span style={{
                  fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 5,
                  background: nLabelColor + "22",
                  color:      nLabelColor,
                  border:     `1px solid ${nLabelColor}55`,
                }}>{nLabelName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}