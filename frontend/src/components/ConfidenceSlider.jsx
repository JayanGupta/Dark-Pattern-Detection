export default function ConfidenceSlider({ value, onChange }) {
  return (
    <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-5 animate-fade-in delay-100 flex flex-col justify-center">
      <div className="flex items-center justify-between mb-4">
        <label
          htmlFor="confidence-slider"
          className="text-sm font-bold"
        >
          Confidence Threshold
        </label>
        <span
          className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-md"
        >
          {(value * 100).toFixed(0)}%
        </span>
      </div>

      <input
        id="confidence-slider"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--destructive) 0%, var(--primary) ${value * 100}%, var(--muted) ${value * 100}%, var(--muted) 100%)`,
        }}
      />

      <div className="flex justify-between mt-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
        <span>More Results</span>
        <span>High Confidence</span>
      </div>
    </div>
  );
}
