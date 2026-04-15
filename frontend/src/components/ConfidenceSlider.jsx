export default function ConfidenceSlider({ value, onChange }) {
  return (
    <div className="glass-card p-5 animate-fade-in delay-100">
      <div className="flex items-center justify-between mb-3">
        <label
          htmlFor="confidence-slider"
          className="text-sm font-medium text-slate-300"
        >
          Confidence Threshold
        </label>
        <span
          className="text-sm font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg"
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
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #00f0ff 0%, #ff2d7c ${value * 100}%, rgba(255,255,255,0.08) ${value * 100}%, rgba(255,255,255,0.08) 100%)`,
        }}
      />

      <div className="flex justify-between mt-1.5 text-xs text-slate-500">
        <span>More Results</span>
        <span>Higher Confidence</span>
      </div>
    </div>
  );
}
