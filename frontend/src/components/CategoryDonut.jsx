import { useEffect, useState } from 'react';
import { CATEGORY_COLORS } from '../utils/api';

/**
 * SVG donut chart showing pattern distribution by category.
 * Animated segment reveal with interactive legend.
 */
export default function CategoryDonut({ summary = {} }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const entries = Object.entries(summary)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
        <svg width="64" height="64" viewBox="0 0 64 64" className="mb-3 opacity-30">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" />
          <path d="M20 32 L28 40 L44 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <p className="text-sm">No patterns detected</p>
      </div>
    );
  }

  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate segments
  let cumulativeOffset = 0;
  const segments = entries.map(([cat, count]) => {
    const fraction = count / total;
    const length = circumference * fraction;
    const gap = 4; // gap between segments
    const segment = {
      name: cat,
      count,
      fraction,
      color: CATEGORY_COLORS[cat]?.color || '#ff2d7c',
      offset: cumulativeOffset,
      length: Math.max(length - gap, 2),
      dasharray: `${Math.max(length - gap, 2)} ${circumference - Math.max(length - gap, 2)}`,
    };
    cumulativeOffset += length;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Donut */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
          />

          {/* Category segments */}
          {segments.map((seg, i) => (
            <circle
              key={seg.name}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={animated ? seg.dasharray : `0 ${circumference}`}
              strokeDashoffset={-seg.offset}
              style={{
                transition: `stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.15}s`,
                filter: `drop-shadow(0 0 4px ${seg.color}60)`,
              }}
            />
          ))}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.name} className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                {seg.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: seg.color }}>
                {seg.count}
              </span>
              <span className="text-[10px] text-slate-600">
                ({(seg.fraction * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
