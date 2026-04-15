import { useState, useEffect, useRef } from 'react';
import { Globe, Code, Search, Loader2, AlertTriangle, Sparkles } from 'lucide-react';

const PLACEHOLDER_URLS = [
  'https://example.com/product-page',
  'https://shop.example.com/checkout',
  'https://news.example.com/article',
  'https://booking.example.com/hotels',
];

export default function UrlInput({ onAnalyze, isLoading }) {
  const [mode, setMode] = useState('url'); // 'url' or 'html'
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef(null);

  // Cycle placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDER_URLS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'url') {
      if (!url.trim()) {
        setError('Please enter a URL');
        return;
      }
      try {
        new URL(url.trim());
      } catch {
        setError('Please enter a valid URL (e.g., https://example.com)');
        return;
      }
      onAnalyze({ url: url.trim() });
    } else {
      if (!html.trim()) {
        setError('Please paste some HTML content');
        return;
      }
      onAnalyze({ html: html.trim() });
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 animate-fade-in animated-border" style={{ '--gradient-angle': '0deg' }}>
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
            mode === 'url'
              ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Globe size={16} />
          Enter URL
        </button>
        <button
          type="button"
          onClick={() => setMode('html')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
            mode === 'html'
              ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Code size={16} />
          Paste HTML
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        {mode === 'url' ? (
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <Globe size={20} />
            </div>
            <input
              ref={inputRef}
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={PLACEHOLDER_URLS[placeholderIdx]}
              disabled={isLoading}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500/50 focus:outline-none input-glow transition-all duration-300 text-base"
            />
          </div>
        ) : (
          <textarea
            id="html-input"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="<html>...</html>"
            rows={6}
            disabled={isLoading}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500/50 focus:outline-none input-glow transition-all duration-300 font-mono text-sm resize-y"
          />
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 mt-3 text-red-400 text-sm animate-fade-in">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          id="analyze-button"
          type="submit"
          disabled={isLoading}
          className="mt-5 w-full group relative overflow-hidden bg-gradient-to-r from-cyan-600 via-fuchsia-600 to-cyan-600 hover:from-cyan-500 hover:via-fuchsia-500 hover:to-cyan-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-base cursor-pointer shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 animate-gradient"
          style={{ backgroundSize: '200% 200%' }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search size={20} />
              Analyze for Dark Patterns
              <Sparkles size={14} className="opacity-60" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
