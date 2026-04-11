import { CATEGORY_COLORS, SEVERITY_COLORS } from '../utils/api';
import { Shield, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

export default function SummaryStats({ results }) {
  if (!results) return null;

  const { total_segments, flagged_segments, summary, analysis_time_ms, patterns } = results;

  // Count severity distribution
  const severityDist = { critical: 0, high: 0, medium: 0, low: 0 };
  patterns?.forEach((p) => {
    severityDist[p.severity] = (severityDist[p.severity] || 0) + 1;
  });

  // Top categories
  const sortedCategories = Object.entries(summary || {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const riskScore = total_segments > 0
    ? Math.min(100, Math.round((flagged_segments / total_segments) * 100 * 3))
    : 0;

  return (
    <div className="animate-fade-in delay-100">
      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard
          icon={<Shield size={18} />}
          label="Risk Score"
          value={`${riskScore}%`}
          color={riskScore > 60 ? '#ef4444' : riskScore > 30 ? '#f59e0b' : '#22c55e'}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Patterns Found"
          value={flagged_segments}
          color="#f97316"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Segments Scanned"
          value={total_segments}
          color="#8b5cf6"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Analysis Time"
          value={`${(analysis_time_ms / 1000).toFixed(1)}s`}
          color="#14b8a6"
        />
      </div>

      {/* Category Distribution + Severity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Category Breakdown */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Pattern Distribution</h3>
          {sortedCategories.length === 0 ? (
            <p className="text-sm text-slate-500">No patterns detected ✓</p>
          ) : (
            <div className="space-y-2.5">
              {sortedCategories.map(([cat, count]) => {
                const config = CATEGORY_COLORS[cat] || { color: '#8b5cf6' };
                const maxCount = sortedCategories[0][1];
                const width = (count / maxCount) * 100;

                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">{cat}</span>
                      <span className="text-xs font-bold" style={{ color: config.color }}>{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${width}%`,
                          backgroundColor: config.color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Severity Distribution */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Severity Breakdown</h3>
          <div className="space-y-2.5">
            {Object.entries(severityDist).map(([severity, count]) => {
              const config = SEVERITY_COLORS[severity];
              return (
                <div key={severity} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs text-slate-400 capitalize">{config.label}</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{ color: config.color, backgroundColor: config.bg }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass-card p-4 text-center">
      <div className="flex items-center justify-center mb-2" style={{ color }}>
        {icon}
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
