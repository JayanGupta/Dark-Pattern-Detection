import { useEffect, useState } from 'react';
import { SEVERITY_COLORS } from '../utils/api';

/**
 * Horizontal stacked bar chart showing severity distribution.
 * Animated width transitions with labels.
 */
export default function SeverityHeatBar({ patterns = [] }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Count severity distribution
  const dist = { critical: 0, high: 0, medium: 0, low: 0 };
  patterns.forEach((p) => {
    if (dist[p.severity] !== undefined) {
      dist[p.severity]++;
    }
  });

  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  const severityOrder = ['critical', 'high', 'medium', 'low'];

  if (total === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-slate-500">No severity data</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stacked bar */}
      <div className="flex h-5 rounded-full overflow-hidden bg-white/[0.03] mb-4">
        {severityOrder.map((severity) => {
          const count = dist[severity];
          const pct = (count / total) * 100;
          const config = SEVERITY_COLORS[severity];
          if (count === 0) return null;

          return (
            <div
              key={severity}
              className="h-full relative group"
              style={{
                width: animated ? `${pct}%` : '0%',
                backgroundColor: config.color,
                transition: `width 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s`,
                minWidth: count > 0 ? '12px' : 0,
              }}
            >
              {/* Tooltip */}
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 shadow-lg z-10">
                {config.label}: {count} ({pct.toFixed(0)}%)
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {severityOrder.map((severity) => {
          const config = SEVERITY_COLORS[severity];
          const count = dist[severity];
          return (
            <div key={severity} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-[11px] text-slate-400">
                {config.label}
              </span>
              <span
                className="text-[11px] font-bold"
                style={{ color: count > 0 ? config.color : '#334155' }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
