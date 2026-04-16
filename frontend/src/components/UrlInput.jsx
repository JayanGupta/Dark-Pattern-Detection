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
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 md:p-8">
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg w-full md:w-max border border-border">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
            mode === 'url'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          <Globe size={16} />
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode('html')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
            mode === 'html'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          <Code size={16} />
          HTML
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        {mode === 'url' ? (
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
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
              className="w-full bg-input border border-border rounded-lg py-3.5 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all text-base"
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
            className="w-full bg-input border border-border rounded-lg p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all font-mono text-sm resize-y"
          />
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 mt-3 text-destructive text-sm font-medium">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          id="analyze-button"
          type="submit"
          disabled={isLoading}
          className="mt-5 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-6 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-sm"
        >
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
