import type { TeamMember } from "../../types";
import { Av } from "../Av";

/**
 * TeamModal
 *
 * Modal for managing team members. Shows all existing members with a
 * Remove button, plus a form to add new ones.
 *
 * Colors are auto-assigned in App.tsx by cycling through TEAM_COLORS —
 * this modal only handles the name input and the add/remove actions.
 *
 * @param team        — list of existing team members to display
 * @param nMember     — current name input value for the new member
 * @param setNMember  — updates the name input
 * @param onClose     — closes the modal
 * @param onAdd       — creates the new member via the API
 * @param onRemove    — removes an existing member by ID
 */

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
    // Clicking the overlay background closes the modal
    <div className="overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 400 }} onPointerDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="mhdr">
          <span className="mtitle">Team Members</span>
          <button className="xbtn" onClick={onClose}>×</button>
        </div>

        <div className="mbody">

          {/* Existing members list */}
          {team.map(m => (
            <div key={m.id} className="mr">
              <Av name={m.name} color={m.color} size={32} />
              <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{m.name}</span>
              <button className="ibtn" onClick={() => onRemove(m.id)}>Remove</button>
            </div>
          ))}

          {/* Empty state */}
          {team.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text3)", fontStyle: "italic", padding: "8px 0" }}>No members yet.</div>
          )}

          {/* Add member form — Enter key also submits */}
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