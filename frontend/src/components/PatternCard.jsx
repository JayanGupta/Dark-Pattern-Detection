import { useState } from 'react';
import SeverityBadge from './SeverityBadge';
import GlowCard from './GlowCard';
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
    <GlowCard
      padding="p-5"
      delay={index * 0.06}
      className=""
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <SeverityBadge severity={pattern.severity} />
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Score</span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{
              color: pattern.severity_score >= 0.7 ? '#ef4444' :
                     pattern.severity_score >= 0.4 ? '#f59e0b' : '#22c55e',
            }}
          >
            {(pattern.severity_score * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Flagged Text */}
      <div className="relative mb-4">
        <p className="text-sm text-slate-200 leading-relaxed bg-white/[0.02] rounded-xl p-3.5 border border-white/5 font-mono text-[13px]">
          &ldquo;{displayText}&rdquo;
        </p>
        {isLongText && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
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
      <div className="space-y-2.5">
        {pattern.categories.map((cat, i) => {
          const config = CATEGORY_COLORS[cat.name] || { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' };
          const percentage = (cat.confidence * 100).toFixed(1);

          return (
            <div key={i} className="group">
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-medium w-36 shrink-0 truncate transition-colors"
                  style={{ color: config.color }}
                >
                  {cat.name}
                </span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${config.color}60, ${config.color})`,
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: `0 0 8px ${config.color}30`,
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-12 text-right tabular-nums font-medium">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Location Context */}
      {pattern.location && (
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-500 flex items-center gap-1.5">
          <MapPin size={10} className="shrink-0" />
          <span className="font-mono text-[11px] truncate">{pattern.location}</span>
        </div>
      )}
    </GlowCard>
  );
}
