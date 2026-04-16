import { CATEGORY_COLORS } from '../utils/api';

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS);

export default function CategoryFilter({ activeCategories, onChange }) {
  const toggleCategory = (cat) => {
    if (activeCategories.includes(cat)) {
      onChange(activeCategories.filter((c) => c !== cat));
    } else {
      onChange([...activeCategories, cat]);
    }
  };

  const allActive = activeCategories.length === ALL_CATEGORIES.length;

  return (
    <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-5 animate-fade-in delay-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold">Filter by Category</span>
        <button
          type="button"
          onClick={() => onChange(allActive ? [] : [...ALL_CATEGORIES])}
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer px-2 py-1 bg-primary/10 rounded-md"
        >
          {allActive ? 'Clear All' : 'Select All'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map((cat) => {
          const isActive = activeCategories.includes(cat);

          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border"
              style={{
                color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                backgroundColor: isActive ? 'var(--primary)' : 'var(--muted)',
                borderColor: isActive ? 'var(--primary)' : 'var(--border)',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
