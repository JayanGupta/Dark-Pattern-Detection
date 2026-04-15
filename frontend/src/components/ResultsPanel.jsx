import PatternCard from './PatternCard';
import { CATEGORY_COLORS } from '../utils/api';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function ResultsPanel({ results, threshold, activeCategories }) {
  if (!results) return null;

  const { patterns, url } = results;

  // Filter patterns by threshold and active categories
  const filteredPatterns = patterns.filter((p) => {
    // Filter by threshold
    const meetsThreshold = p.categories.some((c) => c.confidence >= threshold);
    if (!meetsThreshold) return false;

    // Filter by active categories
    if (activeCategories.length === 0) return false;
    const hasActiveCategory = p.categories.some((c) =>
      activeCategories.includes(c.name)
    );
    return hasActiveCategory;
  });

  return (
    <div className="animate-fade-in delay-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          {filteredPatterns.length > 0 ? (
            <ShieldAlert size={20} className="text-red-400" />
          ) : (
            <ShieldCheck size={20} className="text-green-400" />
          )}
          {filteredPatterns.length > 0
            ? `${filteredPatterns.length} Dark Pattern${filteredPatterns.length > 1 ? 's' : ''} Detected`
            : 'No Dark Patterns Found'}
        </h2>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors truncate max-w-xs"
          >
            {url}
          </a>
        )}
      </div>

      {/* Pattern Cards */}
      {filteredPatterns.length > 0 ? (
        <div className="grid gap-3">
          {filteredPatterns.map((pattern, index) => (
            <PatternCard
              key={index}
              pattern={pattern}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <ShieldCheck size={48} className="mx-auto mb-4 text-green-400/60" />
          <p className="text-slate-400 text-sm">
            {patterns.length > 0
              ? 'All detected patterns are filtered out. Try lowering the confidence threshold or expanding category filters.'
              : 'This page appears clean! No manipulative dark patterns were detected.'}
          </p>
        </div>
      )}
    </div>
  );
}
