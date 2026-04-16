import { useState } from 'react';
import SeverityBadge from './SeverityBadge';
import { CATEGORY_COLORS } from '../utils/api';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';

const TEXT_TRUNCATE_LENGTH = 150;

export default function PatternCard({ pattern, index }) {
  const [expanded, setExpanded] = useState(false);
  const isLongText = pattern.text.length > TEXT_TRUNCATE_LENGTH;
  const displayText = expanded || !isLongText
    ? pattern.text
    : pattern.text.slice(0, TEXT_TRUNCATE_LENGTH) + '...';

  return (
    <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <SeverityBadge severity={pattern.severity} />
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Score</span>
          <span
            className="text-sm font-black tabular-nums"
            style={{
              color: pattern.severity_score >= 0.7 ? 'var(--destructive)' :
                     pattern.severity_score >= 0.4 ? 'var(--chart-4)' : 'var(--chart-5)',
            }}
          >
            {(pattern.severity_score * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Flagged Text */}
      <div className="relative mb-5">
        <p className="text-sm text-foreground leading-relaxed bg-muted rounded-lg p-3.5 border border-border font-mono">
          &ldquo;{displayText}&rdquo;
        </p>
        {isLongText && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs font-semibold hover:text-primary transition-colors cursor-pointer"
          >
            {expanded ? (
              <>Show Less <ChevronUp size={12} /></>
            ) : (
              <>Show More <ChevronDown size={12} /></>
            )}
          </button>
        )}
      </div>

      {/* Categories with confidence bars */}
      <div className="space-y-3">
        {pattern.categories.map((cat, i) => {
          const config = CATEGORY_COLORS[cat.name] || { color: 'var(--primary)', bg: 'var(--muted)' };
          const percentage = (cat.confidence * 100).toFixed(1);

          return (
            <div key={i} className="group">
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-bold w-36 shrink-0 truncate transition-colors"
                >
                  {cat.name}
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden border border-border">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${percentage}%`,
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right tabular-nums font-bold">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Location Context */}
      {pattern.location && (
        <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin size={12} className="shrink-0 text-primary" />
          <span className="font-mono text-[11px] truncate flex-1">{pattern.location}</span>
        </div>
      )}
    </div>
  );
}
