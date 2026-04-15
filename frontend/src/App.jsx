import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, BookOpen, Search, Activity, ExternalLink } from 'lucide-react';
import ParticleBackground from './components/ParticleBackground';
import UrlInput from './components/UrlInput';
import ConfidenceSlider from './components/ConfidenceSlider';
import CategoryFilter from './components/CategoryFilter';
import SummaryStats from './components/SummaryStats';
import ResultsPanel from './components/ResultsPanel';
import LoadingSpinner from './components/LoadingSpinner';
import ScanHistory, { saveToHistory } from './components/ScanHistory';
import LearnPage from './components/LearnPage';
import { analyzeUrl, checkHealth, CATEGORY_COLORS } from './utils/api';

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS);

export default function App() {
  const [view, setView] = useState('scan'); // 'scan' or 'learn'
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState(0.7);
  const [activeCategories, setActiveCategories] = useState([...ALL_CATEGORIES]);
  const [apiHealthy, setApiHealthy] = useState(null);

  // Simple hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'scan';
      setView(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check API health
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
      const message = err.response?.data?.detail || err.message || 'Analysis failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescan = useCallback((url) => {
    handleAnalyze({ url });
  }, [threshold]);

  return (
    <div className="min-h-screen relative text-slate-200">
      <ParticleBackground />

      {/* ─── Header ─────────────────────────────────────── */}
      <header className="border-b border-cyan-500/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <ShieldAlert size={22} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
                Dark Pattern <span className="text-cyan-400">Detector</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">AI Neural Net</span>
                <span className={`w-1.5 h-1.5 rounded-full ${apiHealthy ? 'bg-green-400 shadow-[0_0_8px_rgba(0,255,136,0.5)]' : 'bg-red-500'}`} />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <a 
              href="#scan" 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'scan' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <Search size={16} /> Scan
            </a>
            <a 
              href="#learn" 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'learn' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <BookOpen size={16} /> Learn
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a 
              href="https://github.com" 
              target="_blank" 
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      {/* ─── Main Content ───────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4">
        {view === 'learn' ? (
          <LearnPage />
        ) : (
          <div className="py-12 animate-fade-in">
            {/* Hero */}
            <section className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6 animate-float">
                <Activity size={14} /> System Online
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter italic">
                Deconstruct <span className="gradient-text italic">Manipulation</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed font-medium">
                Advanced AI core identifies deceptive user interfaces using fine-tuned neural patterns.
                Expose hidden costs, false urgency, and trick architecture in real-time.
              </p>
            </section>

            {/* Input & Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12 items-start">
              <div className="lg:col-span-3">
                <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <ScanHistory onRescan={handleRescan} />
                {!localStorage.getItem('dpd_scan_history') && (
                  <div className="glass-card p-6 border-l-4 border-l-cyan-400/50">
                    <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4">Transmission Tips</h3>
                    <ul className="space-y-3 text-xs text-slate-400 font-medium">
                      <li className="flex gap-2">
                        <span className="text-cyan-400">01</span> Scan e-commerce payloads
                      </li>
                      <li className="flex gap-2">
                        <span className="text-fuchsia-400">02</span> Adjust confidence signal
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-400">03</span> Filter by neural category
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="max-w-3xl mx-auto mb-12 glass-card p-5 border-red-500/30 bg-red-500/5 animate-slide-up">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <ShieldAlert size={20} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-100 italic uppercase">System Error Detected</p>
                    <p className="text-xs text-red-300 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading / Results */}
            {isLoading ? (
              <LoadingSpinner />
            ) : results ? (
              <div className="space-y-8 animate-fade-in">
                <SummaryStats results={results} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                  <ConfidenceSlider value={threshold} onChange={setThreshold} />
                  <CategoryFilter activeCategories={activeCategories} onChange={setActiveCategories} />
                </div>
                <ResultsPanel 
                  results={results} 
                  threshold={threshold} 
                  activeCategories={activeCategories} 
                />
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-16 opacity-50">
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/10 animate-ping" />
                  <div className="absolute inset-4 rounded-full border border-cyan-500/20 border-dashed animate-spin" style={{ animationDuration: '10s' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search size={40} className="text-cyan-500/20" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Awaiting Input Signal</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-cyan-500/10 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4 opacity-50">
            <span className="h-[1px] w-8 bg-slate-700" />
            <Activity size={12} className="text-cyan-400" />
            <span className="h-[1px] w-8 bg-slate-700" />
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
            DistilBERT Neural Core v1.0.4 · React x Tailwind v4 Cyber Edition
          </p>
          <p className="text-[10px] text-slate-700 mt-2">
            © 2026 Dark Pattern Detector · Ethical Intelligence Unit
          </p>
        </div>
      </footer>
    </div>
  );
}
