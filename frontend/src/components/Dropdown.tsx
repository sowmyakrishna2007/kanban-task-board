import { useState, useRef, useEffect } from "react";

interface DropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}

export function Dropdown({ value, onChange, options }: DropdownProps) {
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
    <div className="dropdown" ref={ref}>
      <div className={`dropdown-trigger${open ? " open" : ""}`} onClick={() => setOpen(o => !o)}>
        {selected?.label}
        <svg className="dropdown-chevron" width="10" height="6" fill="none" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open && (
        <div className="dropdown-menu">
          {options.map(o => (
            <div
              key={o.value}
              className={`dropdown-option${o.value === value ? " selected" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}<span className="check">✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}