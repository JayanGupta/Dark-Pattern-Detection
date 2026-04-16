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
      <div className="flex items-center justify-between mb-4 mt-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          {filteredPatterns.length > 0 ? (
            <ShieldAlert size={20} className="text-destructive" />
          ) : (
            <ShieldCheck size={20} className="text-green-600" />
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
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors truncate max-w-xs"
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
        <div className="bg-card border border-border shadow-sm p-12 text-center rounded-xl">
          <ShieldCheck size={48} className="mx-auto mb-4 text-green-600 opacity-60" />
          <p className="text-muted-foreground text-sm font-medium">
            {patterns.length > 0
              ? 'All detected patterns are filtered out. Try lowering the confidence threshold or expanding category filters.'
              : 'This page appears clean! No manipulative dark patterns were detected.'}
          </p>
        </div>
      )}
    </div>
  );
}
