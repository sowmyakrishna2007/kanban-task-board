import type { Task, LabelOption } from "../../types";
import { LABEL_COLORS } from "../../constants";

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
    <div className="overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 440 }} onPointerDown={e => e.stopPropagation()}>
        <div className="mhdr">
          <span className="mtitle">Manage Labels</span>
          <button className="xbtn" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          {labelOptions.map(l => (
            <div key={l.id} className="mr">
              <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: l.color, fontWeight: 500 }}>{l.label}</span>
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
          {labelOptions.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text3)", fontStyle: "italic", padding: "8px 0" }}>No labels yet.</div>
          )}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 16 }}>
            <label className="fl" style={{ marginBottom: 10, display: "block" }}>Create New Label</label>
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
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {LABEL_COLORS.map(c => (
                <div key={c} onClick={() => setNLabelColor(c)} style={{
                  width: 22, height: 22, borderRadius: 6, background: c, cursor: "pointer",
                  outline: nLabelColor === c ? `2px solid ${c}` : "2px solid transparent",
                  outlineOffset: 2, transition: "outline .1s",
                }} />
              ))}
            </div>
            {nLabelName.trim() && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>Preview:</span>
                <span style={{
                  fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 5,
                  background: nLabelColor + "22", color: nLabelColor, border: `1px solid ${nLabelColor}55`,
                }}>{nLabelName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}