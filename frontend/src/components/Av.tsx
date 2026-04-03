import { getInitials } from "../utils";

/**
 * Av (Avatar)
 *
 * Renders a circular avatar showing a team member's initials.
 * Background is the member's assigned color at 20% opacity,
 * with the initials rendered in the full color.
 *
 * Used on task cards (small) and in the assignee selector (larger).
 *
 * @param name  — full name of the team member (e.g. "Sarah Jones" → "SJ")
 * @param color — hex color assigned to this member (e.g. "#6366f1")
 * @param size  — diameter in pixels (default: 22)
 */

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
        background: color + "33", // 20% opacity tint of the member's color
        color,
        width: size,
        height: size,
        fontSize: Math.floor(size * 0.38), // Scale font size proportionally to avatar size
        minWidth: size,                     // Prevents shrinking in flex layouts
      }}
    >
      {getInitials(name)}
    </div>
  );
}