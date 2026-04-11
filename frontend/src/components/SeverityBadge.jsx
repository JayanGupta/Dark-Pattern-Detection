import { SEVERITY_COLORS } from '../utils/api';

export default function SeverityBadge({ severity }) {
  const config = SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide"
      style={{
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}30`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}
