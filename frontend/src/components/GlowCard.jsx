import { useRef, useCallback } from 'react';

/**
 * Reusable card with animated gradient border glow on hover
 * and mouse-tracking spotlight effect.
 */
export default function GlowCard({
  children,
  className = '',
  padding = 'p-5',
  delay = 0,
  animate = true,
}) {
  const cardRef = useRef(null);
  const spotlightRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || !spotlightRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spotlightRef.current.style.background = `radial-gradient(300px circle at ${x}px ${y}px, rgba(255, 45, 124, 0.06), transparent 60%)`;
  }, []);

  return (
    <div
      ref={cardRef}
      className={`glow-card ${padding} ${animate ? 'animate-slide-up' : ''} ${className}`}
      style={animate ? { animationDelay: `${delay}s` } : {}}
      onMouseMove={handleMouseMove}
    >
      <div ref={spotlightRef} className="spotlight" />
      {children}
    </div>
  );
}
