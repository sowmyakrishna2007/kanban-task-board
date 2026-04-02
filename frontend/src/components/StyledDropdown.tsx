import { useState, useRef, useEffect } from "react";

interface StyledDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  small?: boolean;
}

export function StyledDropdown({ value, onChange, options, small = false }: StyledDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className={`sdd${small ? " sdd-sm" : ""}`} ref={ref}>
      <div className={`sdd-trigger${open ? " open" : ""}`} onClick={() => setOpen(o => !o)}>
        <span>{selected?.label ?? "—"}</span>
        <svg className="sdd-chevron" width="10" height="6" fill="none" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open && (
        <div className="sdd-menu">
          {options.map(o => (
            <div
              key={o.value}
              className={`sdd-opt${o.value === value ? " sel" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}<span className="sdd-check">✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}