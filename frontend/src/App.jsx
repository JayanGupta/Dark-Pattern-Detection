import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, BookOpen, Search, Activity, Moon, Sun, Code2 } from 'lucide-react';
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
  const [view, setView] = useState('scan');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState(0.7);
  const [activeCategories, setActiveCategories] = useState([...ALL_CATEGORIES]);
  const [apiHealthy, setApiHealthy] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Simple hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'scan';
      setView(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
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

  // Theme toggle side-effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
    <div className="min-h-screen relative bg-background text-foreground transition-colors duration-200">
      {/* ─── Header ─────────────────────────────────────── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">
                Dark Pattern <span className="text-primary font-serif italic">Detector</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest font-semibold">AI Neural Net</span>
                <span className={`w-1.5 h-1.5 rounded-full ${apiHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
            <a 
              href="#scan" 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'scan' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
            >
              <Search size={16} /> Scan
            </a>
            <a 
              href="#learn" 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'learn' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
            >
              <BookOpen size={16} /> Learn
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle themes"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Code2 size={20} />
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-6">
                <Activity size={14} /> System Online
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
                Deconstruct <span className="text-primary italic font-serif">Manipulation</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed font-medium">
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
                  <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Transmission Tips</h3>
                    <ul className="space-y-3 text-sm text-muted-foreground font-medium">
                      <li className="flex gap-2">
                        <span className="text-primary">01</span> Scan e-commerce payloads
                      </li>
                      <li className="flex gap-2">
                        <span className="text-chart-4">02</span> Adjust confidence signal
                      </li>
                      <li className="flex gap-2">
                        <span className="text-chart-5">03</span> Filter by neural category
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="max-w-3xl mx-auto mb-12 bg-destructive/10 border border-destructive/20 p-5 rounded-xl text-destructive">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase">System Error Detected</p>
                    <p className="text-sm font-medium">{error}</p>
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
              <div className="text-center py-16 opacity-60">
                <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center p-4 bg-muted border border-border rounded-full">
                  <Search size={32} className="text-primary opacity-50" />
                </div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Awaiting Input Signal</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-border py-8 mt-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-muted-foreground font-mono">
            Architected by Jayan Gupta
          </div>
          <div className="text-xs text-muted-foreground text-center md:text-right">
            <p className="font-semibold mb-1">
              DistilBERT Neural Core v1.0.4 · React x Tailwind
            </p>
            <p className="opacity-70">
              © 2026 Dark Pattern Detector
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
