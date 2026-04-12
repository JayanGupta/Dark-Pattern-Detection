import { useEffect, useRef, useState } from 'react';

/**
 * Animated SVG arc gauge showing risk percentage.
 * Smoothly fills from 0 to target with color transitions.
 */
export default function RiskGauge({ score = 0, size = 200 }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const animRef = useRef(null);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Animate score count-up
  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();
    const startValue = 0;
    const endValue = score;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(startValue + (endValue - startValue) * eased));

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;

  // Color based on score
  const getColor = (s) => {
    if (s >= 70) return '#ef4444';
    if (s >= 40) return '#f59e0b';
    return '#22c55e';
  };

  const getLabel = (s) => {
    if (s >= 70) return 'High Risk';
    if (s >= 40) return 'Moderate';
    return 'Low Risk';
  };

  const color = getColor(animatedScore);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
          />

          {/* Animated arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="gauge-arc"
            style={{
              filter: `drop-shadow(0 0 8px ${color}80)`,
              transition: 'stroke 0.5s ease',
            }}
          />

          {/* Subtle glow ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + 8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            opacity="0.08"
            style={{ transition: 'stroke 0.5s ease' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-extrabold tracking-tight"
            style={{ color, transition: 'color 0.5s ease' }}
          >
            {animatedScore}
          </span>
          <span className="text-xs text-slate-500 -mt-0.5">/ 100</span>
          <span
            className="text-xs font-semibold mt-1.5 px-2.5 py-0.5 rounded-full"
            style={{
              color,
              backgroundColor: `${color}15`,
              transition: 'all 0.5s ease',
            }}
          >
            {getLabel(animatedScore)}
          </span>
        </div>
      </div>
    </div>
  );
}
