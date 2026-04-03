import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";

/**
 * CustomDatePicker
 *
 * A fully custom calendar date picker built without any external library.
 * Renders a trigger button that opens a calendar popup via a React portal,
 * so it can escape overflow:hidden containers like modals.
 *
 * Features:
 *  - Flips above the trigger if there isn't enough space below
 *  - Highlights today's date and dims past dates
 *  - "Today" shortcut and "Clear" button in the footer
 *  - Closes when clicking outside
 *
 * @param value    — selected date as an ISO string (e.g. "2026-04-23"), or "" if unset
 * @param onChange — called with the new ISO date string when a date is selected, or "" when cleared
 */

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
}

/** Styles for the prev/next month navigation buttons */
const navBtnStyle: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border)",
  borderRadius: 6, width: 28, height: 28, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--text2)", fontSize: 16, lineHeight: 1, fontFamily: "var(--sans)",
};

/** Styles for the "Today" and "Clear" footer buttons */
const footBtnStyle = (color: string): React.CSSProperties => ({
  background: "transparent", border: "none",
  color, fontSize: 12, cursor: "pointer",
  fontFamily: "var(--sans)", fontWeight: 500, padding: 0,
});

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef   = useRef<HTMLDivElement>(null);

  // Pixel coordinates for the portal popup, computed from the trigger's position
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const today  = new Date();
  const parsed = value ? new Date(value + "T00:00:00") : null; // Append time to avoid timezone offset issues

  // Calendar view state — defaults to the selected date's month or today's month
  const [viewYear,  setViewYear]  = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth()    ?? today.getMonth());

  // ── Position the popup when it opens ──────────────────────────────────────
  // Checks if there's enough space below the trigger. If not, flips it above.
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const r          = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const popupH     = 340;
    const top        = spaceBelow < popupH ? r.top - popupH - 6 : r.bottom + 6;
    setCoords({ top: top + window.scrollY, left: r.left + window.scrollX, width: r.width });
  }, [open]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popupRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  // ── Build calendar grid ───────────────────────────────────────────────────
  // Pad the start of the grid with nulls so day 1 lands on the correct weekday.
  // Pad the end so the total cell count is a multiple of 7.
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  /** Formats a year/month/day into an ISO date string (YYYY-MM-DD) */
  const toISO = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  /** Navigate to the previous month, rolling back the year if needed */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  /** Navigate to the next month, rolling forward the year if needed */
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Display text on the trigger button
  const displayVal = parsed
    ? parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Pick a date";

  // ── Calendar Popup ────────────────────────────────────────────────────────
  // Rendered via a React portal so it escapes any overflow:hidden parent (e.g. modals).
  const popup = (
    <div ref={popupRef} style={{
      position: "absolute", top: coords.top, left: coords.left,
      width: Math.max(coords.width, 280), zIndex: 99999,
      background: "var(--bg2)", border: "1px solid var(--border2)",
      borderRadius: "var(--r-lg)", boxShadow: "0 20px 48px rgba(0,0,0,0.65)",
      overflow: "hidden", fontFamily: "var(--sans)",
    }}>

      {/* Month navigation header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 8px", borderBottom: "1px solid var(--border)" }}>
        <button onClick={prevMonth} style={navBtnStyle}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={navBtnStyle}>›</button>
      </div>

      {/* Day of week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px 10px 4px", gap: 2 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text3)", padding: "2px 0" }}>{d}</div>
        ))}
      </div>

      {/* Date cells grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 10px 10px", gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />; // Empty padding cell

          const iso        = toISO(viewYear, viewMonth, day);
          const isSelected = iso === value;
          const isToday    = iso === todayISO;
          const isPast     = iso < todayISO;

          return (
            <div
              key={i}
              onClick={() => { onChange(iso); setOpen(false); }}
              style={{
                textAlign: "center", fontSize: 13, cursor: "pointer", padding: "7px 2px", borderRadius: 6,
                fontWeight:  isSelected ? 600 : 400,
                background:  isSelected ? "var(--accent)" : isToday ? "var(--accent-dim)" : "transparent",
                color:       isSelected ? "#06111c" : isPast ? "var(--text3)" : isToday ? "var(--accent)" : "var(--text)",
                border:      isToday && !isSelected ? "1px solid var(--border2)" : "1px solid transparent",
                transition:  "background 0.12s",
              }}
              // Hover effects applied via JS since inline styles can't use :hover
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "var(--bg4)"; }}
              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = isToday ? "var(--accent-dim)" : "transparent"; }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Footer — "Today" shortcut and optional "Clear" button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px 10px", borderTop: "1px solid var(--border)" }}>
        <button onClick={() => { onChange(todayISO); setOpen(false); }} style={footBtnStyle("var(--accent)")}>Today</button>
        {value && <button onClick={() => { onChange(""); setOpen(false); }} style={footBtnStyle("var(--text3)")}>Clear</button>}
      </div>
    </div>
  );

  // ── Trigger Button ────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 10px", background: "var(--bg4)",
          border: `1px solid ${open ? "var(--accent)" : "var(--border2)"}`,
          borderRadius: "var(--r-sm)", cursor: "pointer", userSelect: "none",
          boxShadow: open ? "0 0 0 3px var(--accent-dim)" : "none",
          transition: "border-color 0.18s, box-shadow 0.18s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Calendar icon */}
          <svg width="12" height="12" fill="none" viewBox="0 0 16 16">
            <rect x="1" y="3" width="14" height="12" rx="2.5" stroke="var(--accent)" strokeWidth="1.4"/>
            <path d="M1 7h14" stroke="var(--accent)" strokeWidth="1.4"/>
            <path d="M5 1v3M11 1v3" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 12, color: parsed ? "var(--text)" : "var(--text3)" }}>{displayVal}</span>
        </div>

        {/* Chevron — rotates when open */}
        <svg
          width="10" height="6" fill="none" viewBox="0 0 10 6"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.18s", color: "var(--text3)", flexShrink: 0 }}
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Portal — renders the popup at the document body level */}
      {open && ReactDOM.createPortal(popup, document.body)}
    </div>
  );
}