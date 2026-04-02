import { getInitials } from "../utils";

interface AvProps {
  name: string;
  color: string;
  size?: number;
}

export function Av({ name, color, size = 22 }: AvProps) {
  return (
    <div
      className="av"
      style={{
        background: color + "33",
        color,
        width: size,
        height: size,
        fontSize: Math.floor(size * 0.38),
        minWidth: size,
      }}
    >
      {getInitials(name)}
    </div>
  );
}