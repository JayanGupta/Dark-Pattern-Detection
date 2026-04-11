import { useState } from 'react';
import { Globe, Code, Search, Loader2, AlertTriangle } from 'lucide-react';

export default function UrlInput({ onAnalyze, isLoading }) {
  const [mode, setMode] = useState('url'); // 'url' or 'html'
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');

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
    <div className="glass-card p-6 md:p-8 animate-fade-in">
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
            mode === 'url'
              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Globe size={16} />
          Enter URL
        </button>
        <button
          type="button"
          onClick={() => setMode('html')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
            mode === 'html'
              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30'
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
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/product-page"
              disabled={isLoading}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 text-base"
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
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 font-mono text-sm resize-y"
          />
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          id="analyze-button"
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base cursor-pointer shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
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
            </>
          )}
        </button>
      </form>
    </div>
  );
}
