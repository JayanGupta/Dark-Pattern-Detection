import { Clock, ExternalLink, RotateCcw, Trash2, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { useState } from 'react';

const STORAGE_KEY = 'dpd_scan_history';
const MAX_HISTORY = 10;

/**
 * Read scan history from localStorage.
 */
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Save a scan result to history.
 */
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

/**
 * Scan history sidebar panel.
 */
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
    if (score >= 70) return '#ef4444';
    if (score >= 40) return '#f59e0b';
    return '#22c55e';
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
    <div className="glass-card p-5 animate-fade-in delay-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold text-slate-300">Recent Scans</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-medium">
            {history.length}
          </span>
        </div>
        <button
          onClick={clearHistory}
          className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
          title="Clear history"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* History items */}
      <div className="space-y-1.5">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="history-item flex items-center gap-3 p-2.5 rounded-xl group"
          >
            {/* Risk indicator */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
              style={{
                backgroundColor: `${getRiskColor(item.riskScore)}15`,
                color: getRiskColor(item.riskScore),
              }}
            >
              {item.riskScore}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300 truncate font-medium">
                {item.url}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-600">{formatTime(item.timestamp)}</span>
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-slate-600">{item.flagged} patterns</span>
              </div>
            </div>

            {/* Re-scan button */}
            {item.url !== 'Raw HTML' && (
              <button
                onClick={() => onRescan?.(item.url)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-cyan-400 cursor-pointer"
                title="Re-scan"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Expand toggle */}
      {history.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer py-1"
        >
          {expanded ? (
            <>Show Less <ChevronUp size={12} /></>
          ) : (
            <>Show {history.length - 3} More <ChevronDown size={12} /></>
          )}
        </button>
      )}
    </div>
  );
}
