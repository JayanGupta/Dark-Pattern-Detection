import { useEffect, useRef, useState } from 'react';

/**
 * Reusable counter that animates from 0 to the target value.
 */
export default function AnimatedCounter({
  value = 0,
  duration = 1200,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
}) {
  const [display, setDisplay] = useState(0);
  const animRef = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const startTime = performance.now();
    const startValue = prevValue.current;
    const endValue = value;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + (endValue - startValue) * eased;
      setDisplay(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    prevValue.current = value;

    return () => cancelAnimationFrame(animRef.current);
  }, [value, duration]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display);

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
