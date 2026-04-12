import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, ExternalLink, Activity, Wifi, WifiOff } from 'lucide-react';
import ParticleBackground from './components/ParticleBackground';
import UrlInput from './components/UrlInput';
import ConfidenceSlider from './components/ConfidenceSlider';
import CategoryFilter from './components/CategoryFilter';
import SummaryStats from './components/SummaryStats';
import ResultsPanel from './components/ResultsPanel';
import LoadingSpinner from './components/LoadingSpinner';
import ScanHistory, { saveToHistory } from './components/ScanHistory';
import { analyzeUrl, checkHealth, CATEGORY_COLORS } from './utils/api';

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS);

export default function App() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState(0.7);
  const [activeCategories, setActiveCategories] = useState([...ALL_CATEGORIES]);
  const [apiHealthy, setApiHealthy] = useState(null); // null = checking, true/false

  // Check API health on mount
  useEffect(() => {
    const check = async () => {
      try {
        await checkHealth();
        setApiHealthy(true);
      } catch {
        setApiHealthy(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async ({ url, html }) => {
    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const data = await analyzeUrl({ url, html, threshold });
      setResults(data);
      saveToHistory(data);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Analysis failed. Please check the URL and try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescan = useCallback((url) => {
    handleAnalyze({ url });
  }, [threshold]);

  return (
    <div className="min-h-screen relative">
      {/* Particle Background */}
      <ParticleBackground />

      {/* ─── Header ─────────────────────────────────────── */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 animate-pulse-glow">
              <ShieldAlert size={22} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Dark Pattern Detector
              </h1>
              <p className="text-[10px] text-slate-500 hidden sm:block uppercase tracking-widest">
                AI-Powered Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* API Health Indicator */}
            <div className="flex items-center gap-2">
              {apiHealthy === null ? (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
                  <span className="text-[10px] hidden sm:inline">Connecting...</span>
                </div>
              ) : apiHealthy ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 status-dot" />
                  <span className="text-[10px] hidden sm:inline font-medium">API Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-400">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-[10px] hidden sm:inline">API Offline</span>
                </div>
              )}
            </div>

            {/* GitHub link */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-8 text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-5 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Powered by DistilBERT · Multi-Label Classification
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight animate-fade-in delay-100">
          Detect{' '}
          <span className="gradient-text">
            Dark Patterns
          </span>{' '}
          <br className="hidden md:block" />
          on Any Web Page
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed animate-fade-in delay-200">
          Enter a URL or paste HTML to scan for manipulative UI patterns. Our ML model
          identifies urgency tricks, hidden costs, confirm-shaming, and more.
        </p>
      </section>

      {/* ─── Main Content ───────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 pb-20">
        {/* Input + History Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-1">
            <ScanHistory onRescan={handleRescan} />
            {/* If no history, show tips */}
            {!localStorage.getItem('dpd_scan_history') && (
              <div className="glass-card p-5 animate-fade-in delay-300">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Quick Tips</h3>
                <ul className="space-y-2 text-xs text-slate-500">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">●</span>
                    Try scanning e-commerce product pages for best results
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">●</span>
                    Lower the confidence threshold to catch more patterns
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-0.5">●</span>
                    Use category filters to focus on specific pattern types
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6 glass-card p-4 border-red-500/30 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-red-500/10">
                <ShieldAlert size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-400">Analysis Failed</p>
                <p className="text-xs text-slate-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && <LoadingSpinner />}

        {/* Results */}
        {results && !isLoading && (
          <div className="space-y-6 animate-fade-in">
            {/* Dashboard Summary */}
            <SummaryStats results={results} />

            {/* Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ConfidenceSlider value={threshold} onChange={setThreshold} />
              <CategoryFilter
                activeCategories={activeCategories}
                onChange={setActiveCategories}
              />
            </div>

            {/* Results Panel */}
            <ResultsPanel
              results={results}
              threshold={threshold}
              activeCategories={activeCategories}
            />
          </div>
        )}

        {/* Empty State */}
        {!results && !isLoading && !error && (
          <div className="text-center py-20 animate-fade-in delay-400">
            {/* Animated shield illustration */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-indigo-500/5 animate-pulse" />
              <div
                className="absolute inset-0 rounded-full border border-indigo-500/10"
                style={{ animation: 'rotate 20s linear infinite' }}
              />
              <div
                className="absolute inset-2 rounded-full border border-dashed border-purple-500/10"
                style={{ animation: 'rotate 15s linear infinite reverse' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldAlert size={32} className="text-indigo-400/40 animate-float" />
              </div>
            </div>
            <p className="text-slate-500 text-sm mb-2">
              Enter a URL above to start scanning for dark patterns
            </p>
            <p className="text-slate-600 text-xs">
              Supports any public web page · Results in seconds
            </p>
          </div>
        )}
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity size={12} className="text-indigo-400/50" />
          <p className="text-xs text-slate-600">
            Built with DistilBERT · FastAPI · React · TailwindCSS v4
          </p>
        </div>
        <p className="text-[10px] text-slate-700">
          Dark Pattern Detector v1.0 — Ethical AI for a transparent web
        </p>
      </footer>
    </div>
  );
}
