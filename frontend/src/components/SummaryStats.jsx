import { CATEGORY_COLORS, SEVERITY_COLORS } from '../utils/api';
import { Shield, Clock, AlertTriangle, TrendingUp, Zap, Target } from 'lucide-react';
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 dashboard-grid">
        {/* Risk Gauge — spans 2 cols on md+ */}
        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-6 md:col-span-2 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Overall Risk Score</h3>
            <RiskGauge score={riskScore} size={180} />
          </div>
        </div>

        {/* KPI Cards — 2 cols on right */}
        <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
          <StatCard
            icon={<AlertTriangle size={18} />}
            label="Patterns Found"
            value={flagged_segments}
            color="var(--destructive)"
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Segments Scanned"
            value={total_segments}
            color="var(--chart-2)"
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Analysis Time"
            value={analysis_time_ms / 1000}
            suffix="s"
            decimals={1}
            color="var(--chart-4)"
          />
          <StatCard
            icon={<Zap size={18} />}
            label="Top Severity"
            textValue={topSeverity ? `${SEVERITY_COLORS[topSeverity[0]]?.label} (${topSeverity[1]})` : 'None'}
            color={topSeverity ? "var(--destructive)" : "var(--chart-5)"}
          />
        </div>
      </div>

      {/* ─── Second Row: Category Donut + Severity Heat ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Distribution Donut */}
        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Target size={16} className="text-primary" />
            Pattern Distribution
          </h3>
          <CategoryDonut summary={summary} />
        </div>

        {/* Severity Breakdown */}
        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Shield size={16} className="text-chart-1" />
            Severity Breakdown
          </h3>
          <SeverityHeatBar patterns={patterns} />

          {/* Detailed severity metrics */}
          <div className="mt-5 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(severityDist).map(([severity, count]) => {
                const config = SEVERITY_COLORS[severity];
                const pct = patterns?.length > 0 ? ((count / patterns.length) * 100).toFixed(0) : 0;
                return (
                  <div key={severity} className="flex items-center justify-between p-2.5 rounded-lg bg-muted border border-border">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: count > 0 ? 'var(--chart-1)' : 'var(--muted-foreground)' }}
                      />
                      <span className="text-xs text-muted-foreground capitalize font-bold">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold"
                      >
                        {count}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, textValue, color, suffix = '', decimals = 0 }) {
  return (
    <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-4 flex flex-col justify-between">
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="p-2 rounded-md bg-muted border border-border"
          style={{ color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-black tracking-tight mt-1">
        {textValue ? (
          <span style={{ color, fontSize: '0.875rem', fontWeight: 'bold' }}>{textValue}</span>
        ) : (
          <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-1 font-semibold">{label}</div>
    </div>
  );
}
