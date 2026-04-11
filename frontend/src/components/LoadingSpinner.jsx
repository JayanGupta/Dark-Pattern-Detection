export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* Animated scanner effect */}
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-purple-500 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
        <div className="absolute inset-4 rounded-full border-2 border-t-transparent border-r-transparent border-b-violet-500 border-l-transparent animate-spin" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.75"/>
          </svg>
        </div>
      </div>

      {/* Text */}
      <p className="text-base font-medium text-slate-300 mb-2">
        Scanning for dark patterns...
      </p>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        Extracting text · Classifying patterns · Computing severity
      </div>
    </div>
  );
}
