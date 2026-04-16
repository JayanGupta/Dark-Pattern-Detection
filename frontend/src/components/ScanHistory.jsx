import { Clock, ExternalLink, RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const STORAGE_KEY = 'dpd_scan_history';
const MAX_HISTORY = 10;

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveToHistory(result) {
  if (!result) return;
  const history = getHistory();
  const entry = {
    id: Date.now(),
    url: result.url || 'Raw HTML',
    timestamp: new Date().toISOString(),
    flagged: result.flagged_segments || 0,
    total: result.total_segments || 0,
    riskScore: result.total_segments > 0
      ? Math.min(100, Math.round((result.flagged_segments / result.total_segments) * 100 * 3))
      : 0,
    analysisTime: result.analysis_time_ms || 0,
  };
  history.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export default function ScanHistory({ onRescan }) {
  const [history, setHistory] = useState(getHistory());
  const [expanded, setExpanded] = useState(false);

  if (history.length === 0) return null;

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  const displayItems = expanded ? history : history.slice(0, 3);

  const getRiskColor = (score) => {
    if (score >= 70) return 'var(--destructive)';
    if (score >= 40) return 'var(--chart-4)';
    return 'var(--chart-2)';
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-5 animate-fade-in delay-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-primary" />
          <span className="text-sm font-bold">Recent Scans</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {history.length}
          </span>
        </div>
        <button
          onClick={clearHistory}
          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-1"
          title="Clear history"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* History items */}
      <div className="space-y-2">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/50 group"
          >
            {/* Risk indicator */}
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 text-xs font-black shadow-sm"
              style={{
                backgroundColor: 'var(--card)',
                color: getRiskColor(item.riskScore),
                borderLeft: `3px solid ${getRiskColor(item.riskScore)}`
              }}
            >
              {item.riskScore}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground truncate font-semibold">
                {item.url}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-muted-foreground">{formatTime(item.timestamp)}</span>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-[10px] text-muted-foreground">{item.flagged} patterns</span>
              </div>
            </div>

            {/* Re-scan button */}
            {item.url !== 'Raw HTML' && (
              <button
                onClick={() => onRescan?.(item.url)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-background border border-transparent hover:border-border text-muted-foreground hover:text-primary cursor-pointer shadow-sm"
                title="Re-scan"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Expand toggle */}
      {history.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer py-2 bg-muted hover:bg-background border border-transparent hover:border-border rounded-lg"
        >
          {expanded ? (
            <>Show Less <ChevronUp size={14} /></>
          ) : (
            <>Show {history.length - 3} More <ChevronDown size={14} /></>
          )}
        </button>
      )}
    </div>
  );
}
