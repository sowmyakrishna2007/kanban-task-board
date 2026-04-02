import type { TeamMember } from "../../types";
import { Av } from "../Av";

interface TeamModalProps {
  team: TeamMember[];
  nMember: string;
  setNMember: (val: string) => void;
  onClose: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function TeamModal({ team, nMember, setNMember, onClose, onAdd, onRemove }: TeamModalProps) {
  return (
    <div className="overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 400 }} onPointerDown={e => e.stopPropagation()}>
        <div className="mhdr">
          <span className="mtitle">Team Members</span>
          <button className="xbtn" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          {team.map(m => (
            <div key={m.id} className="mr">
              <Av name={m.name} color={m.color} size={32} />
              <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{m.name}</span>
              <button className="ibtn" onClick={() => onRemove(m.id)}>Remove</button>
            </div>
          ))}
          {team.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text3)", fontStyle: "italic", padding: "8px 0" }}>No members yet.</div>
          )}
          <div className="fr" style={{ marginTop: 8 }}>
            <label className="fl">Add Member</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="fi"
                style={{ flex: 1 }}
                placeholder="Full name"
                value={nMember}
                onChange={e => setNMember(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") onAdd(); }}
              />
              <button className="btn btn-p btn-sm" onClick={onAdd}>Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}