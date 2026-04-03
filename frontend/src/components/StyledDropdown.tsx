import { useState, useRef, useEffect } from "react";

/**
 * StyledDropdown
 *
 * A more compact dropdown used inside modals and the task detail panel,
 * as opposed to Dropdown which is used in the toolbar filters.
 *
 * Functionally identical to Dropdown but uses the `sdd` CSS classes
 * for a tighter, form-field style appearance. Supports a `small` prop
 * for an even more compact variant used in the detail grid (status/priority).
 *
 * Closes when clicking outside via a mousedown listener on the document.
 *
 * @param value    — the currently selected option value
 * @param onChange — called with the new value when an option is selected
 * @param options  — list of { value, label } pairs to display
 * @param small    — if true, applies the sdd-sm CSS modifier for a smaller size (default: false)
 */

interface StyledDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  small?: boolean;
}

export function StyledDropdown({ value, onChange, options, small = false }: StyledDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref      = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    // sdd-sm applied when small=true for the compact detail grid variant
    <div className={`sdd${small ? " sdd-sm" : ""}`} ref={ref}>

      {/* Trigger button — shows selected label or a dash if nothing is selected */}
      <div
        className={`sdd-trigger${open ? " open" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected?.label ?? "—"}</span>
        {/* Chevron rotates when open via CSS */}
        <svg className="sdd-chevron" width="10" height="6" fill="none" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Options menu — only rendered when open */}
      {open && (
        <div className="sdd-menu">
          {options.map(o => (
            <div
              key={o.value}
              className={`sdd-opt${o.value === value ? " sel" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
              <span className="sdd-check">✓</span> {/* Visible only on selected option via CSS */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}