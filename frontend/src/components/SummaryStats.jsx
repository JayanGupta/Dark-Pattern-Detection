import { CATEGORY_COLORS, SEVERITY_COLORS } from '../utils/api';
import { Shield, Clock, AlertTriangle, TrendingUp, Zap, Target } from 'lucide-react';
import GlowCard from './GlowCard';
import AnimatedCounter from './AnimatedCounter';
import RiskGauge from './RiskGauge';
import CategoryDonut from './CategoryDonut';
import SeverityHeatBar from './SeverityHeatBar';

export default function SummaryStats({ results }) {
  if (!results) return null;

  const { total_segments, flagged_segments, summary, analysis_time_ms, patterns } = results;

  const riskScore = total_segments > 0
    ? Math.min(100, Math.round((flagged_segments / total_segments) * 100 * 3))
    : 0;

  // Top severity
  const severityDist = { critical: 0, high: 0, medium: 0, low: 0 };
  patterns?.forEach((p) => {
    severityDist[p.severity] = (severityDist[p.severity] || 0) + 1;
  });
  const topSeverity = Object.entries(severityDist).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-4">
      {/* ─── Top Row: Risk Gauge + KPI Cards ─── */}
      <div className="dashboard-grid">
        {/* Risk Gauge — spans 2 cols on md+ */}
        <GlowCard className="span-2 flex items-center justify-center" padding="p-6" delay={0.05}>
          <div className="flex flex-col items-center">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Overall Risk Score</h3>
            <RiskGauge score={riskScore} size={180} />
          </div>
        </GlowCard>

        {/* KPI Cards — 2 cols on right */}
        <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
          <StatCard
            icon={<AlertTriangle size={18} />}
            label="Patterns Found"
            value={flagged_segments}
            color="#f97316"
            delay={0.1}
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Segments Scanned"
            value={total_segments}
            color="#ff2d7c"
            delay={0.15}
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Analysis Time"
            value={analysis_time_ms / 1000}
            suffix="s"
            decimals={1}
            color="#14b8a6"
            delay={0.2}
          />
          <StatCard
            icon={<Zap size={18} />}
            label="Top Severity"
            textValue={topSeverity ? `${SEVERITY_COLORS[topSeverity[0]]?.label} (${topSeverity[1]})` : 'None'}
            color={topSeverity ? SEVERITY_COLORS[topSeverity[0]]?.color : '#22c55e'}
            delay={0.25}
          />
        </div>
      </div>

      {/* ─── Second Row: Category Donut + Severity Heat ─── */}
      <div className="dashboard-grid">
        {/* Category Distribution Donut */}
        <GlowCard className="span-2" padding="p-6" delay={0.3}>
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Target size={14} className="text-cyan-400" />
            Pattern Distribution
          </h3>
          <CategoryDonut summary={summary} />
        </GlowCard>

        {/* Severity Breakdown */}
        <GlowCard className="span-2" padding="p-6" delay={0.35}>
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Shield size={14} className="text-red-400" />
            Severity Breakdown
          </h3>
          <SeverityHeatBar patterns={patterns} />

          {/* Detailed severity metrics */}
          <div className="mt-5 pt-4 border-t border-white/5">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(severityDist).map(([severity, count]) => {
                const config = SEVERITY_COLORS[severity];
                const pct = patterns?.length > 0 ? ((count / patterns.length) * 100).toFixed(0) : 0;
                return (
                  <div key={severity} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-xs text-slate-400 capitalize">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold"
                        style={{ color: count > 0 ? config.color : '#334155' }}
                      >
                        {count}
                      </span>
                      <span className="text-[10px] text-slate-600">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, textValue, color, suffix = '', decimals = 0, delay = 0 }) {
  return (
    <GlowCard padding="p-4" delay={delay}>
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="p-2 rounded-xl"
          style={{ backgroundColor: `${color}12`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-extrabold text-white tracking-tight">
        {textValue ? (
          <span style={{ color, fontSize: '0.875rem', fontWeight: 600 }}>{textValue}</span>
        ) : (
          <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
        )}
      </div>
      <div className="text-[11px] text-slate-500 mt-1 font-medium">{label}</div>
    </GlowCard>
  );
}
