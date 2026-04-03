import { useState, useRef, useEffect } from "react";

/**
 * Dropdown
 *
 * A simple select dropdown used in the toolbar for filtering tasks
 * by priority, assignee, and label.
 *
 * Closes when clicking outside via a mousedown listener on the document.
 * The selected option shows a checkmark.
 *
 * @param value    — the currently selected option value
 * @param onChange — called with the new value when an option is selected
 * @param options  — list of { value, label } pairs to display
 */

interface DropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}

export function Dropdown({ value, onChange, options }: DropdownProps) {
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
    <div className="dropdown" ref={ref}>

      {/* Trigger button — shows the currently selected label */}
      <div
        className={`dropdown-trigger${open ? " open" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        {selected?.label}
        {/* Chevron rotates when open via CSS */}
        <svg className="dropdown-chevron" width="10" height="6" fill="none" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Options menu — only rendered when open */}
      {open && (
        <div className="dropdown-menu">
          {options.map(o => (
            <div
              key={o.value}
              className={`dropdown-option${o.value === value ? " selected" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
              <span className="check">✓</span> {/* Visible only on selected option via CSS */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}