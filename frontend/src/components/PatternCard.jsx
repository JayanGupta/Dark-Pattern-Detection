import SeverityBadge from './SeverityBadge';
import { CATEGORY_COLORS } from '../utils/api';

export default function PatternCard({ pattern, index }) {
  return (
    <div
      className="glass-card p-5 animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <SeverityBadge severity={pattern.severity} />
        <span className="text-xs text-slate-500 shrink-0">
          Score: {(pattern.severity_score * 100).toFixed(0)}%
        </span>
      </div>

      {/* Flagged Text */}
      <p className="text-sm text-slate-200 leading-relaxed mb-4 bg-white/[0.02] rounded-xl p-3 border border-white/5">
        &ldquo;{pattern.text}&rdquo;
      </p>

      {/* Categories */}
      <div className="space-y-2">
        {pattern.categories.map((cat, i) => {
          const config = CATEGORY_COLORS[cat.name] || { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' };
          const percentage = (cat.confidence * 100).toFixed(1);

          return (
            <div key={i} className="flex items-center gap-3">
              <span
                className="text-xs font-medium w-36 shrink-0 truncate"
                style={{ color: config.color }}
              >
                {cat.name}
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${config.color}80, ${config.color})`,
                  }}
                />
              </div>
              <span className="text-xs text-slate-400 w-12 text-right">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Location Context */}
      {pattern.location && (
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-slate-500" />
          {pattern.location}
        </div>
      )}
    </div>
  );
}
