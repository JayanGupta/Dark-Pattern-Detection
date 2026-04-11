import { useState } from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import UrlInput from './components/UrlInput';
import ConfidenceSlider from './components/ConfidenceSlider';
import CategoryFilter from './components/CategoryFilter';
import SummaryStats from './components/SummaryStats';
import ResultsPanel from './components/ResultsPanel';
import LoadingSpinner from './components/LoadingSpinner';
import { analyzeUrl, CATEGORY_COLORS } from './utils/api';

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS);

export default function App() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState(0.7);
  const [activeCategories, setActiveCategories] = useState([...ALL_CATEGORIES]);

  const handleAnalyze = async ({ url, html }) => {
    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const data = await analyzeUrl({ url, html, threshold });
      setResults(data);
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

  return (
    <div className="min-h-screen">
      {/* ─── Header ─────────────────────────────────────── */}
      <header className="border-b border-white/5 bg-white/[0.01] backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20">
              <ShieldAlert size={22} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Dark Pattern Detector
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI-powered web page analysis
              </p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* ─── Hero Section ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Powered by DistilBERT
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
          Detect{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Dark Patterns
          </span>{' '}
          on Any Web Page
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Enter a URL or paste HTML to scan for manipulative UI patterns. Our ML model
          identifies urgency tricks, hidden costs, confirm-shaming, and more.
        </p>
      </section>

      {/* ─── Main Content ───────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* Input */}
        <div className="max-w-2xl mx-auto mb-8">
          <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 glass-card p-4 border-red-500/30 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-lg bg-red-500/10">
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
          <div className="space-y-4">
            {/* Summary Stats */}
            <SummaryStats results={results} />

            {/* Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <div className="text-center py-16 animate-fade-in">
            <div className="flex justify-center gap-3 mb-6 opacity-30">
              {['🔍', '🛡️', '⚠️', '🎯', '📊'].map((emoji, i) => (
                <span key={i} className="text-3xl" style={{ animationDelay: `${i * 0.2}s` }}>
                  {emoji}
                </span>
              ))}
            </div>
            <p className="text-slate-500 text-sm">
              Enter a URL above to start scanning for dark patterns
            </p>
          </div>
        )}
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-6 text-center">
        <p className="text-xs text-slate-600">
          Built with DistilBERT · FastAPI · React · TailwindCSS
        </p>
      </footer>
    </div>
  );
}
