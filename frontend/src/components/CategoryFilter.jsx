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
    <div className="glass-card p-5 animate-fade-in delay-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">Filter by Category</span>
        <button
          type="button"
          onClick={() => onChange(allActive ? [] : [...ALL_CATEGORIES])}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          {allActive ? 'Clear All' : 'Select All'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map((cat) => {
          const config = CATEGORY_COLORS[cat];
          const isActive = activeCategories.includes(cat);

          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border"
              style={{
                color: isActive ? config.color : '#64748b',
                backgroundColor: isActive ? config.bg : 'transparent',
                borderColor: isActive ? `${config.color}40` : 'rgba(255,255,255,0.08)',
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
