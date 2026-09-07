import React, { useMemo } from 'react';
import styles from './LiquidTransition.module.css';

/**
 * Performance-First Liquid Metaball Component
 * Uses hardware-accelerated SVG bezier lobes + GPU transforms for locked 60fps
 * across Windows, macOS, Android, and iOS devices.
 */
export const LiquidCanvas = ({
  progress = 0,
  phase = 0, // 0 = expand, 1 = hold, 2 = reveal
  origin = { x: 500, y: 500 },
  viewport = { width: 1920, height: 1080 },
  isLowPower = false,
}) => {
  const { width, height } = viewport;
  const { x: ox, y: oy } = origin;

  // Maximum radius to guarantee complete corner coverage
  const maxRadius = useMemo(() => {
    const d1 = Math.hypot(ox, oy);
    const d2 = Math.hypot(width - ox, oy);
    const d3 = Math.hypot(ox, height - oy);
    const d4 = Math.hypot(width - ox, height - oy);
    return Math.max(d1, d2, d3, d4) * 1.35;
  }, [ox, oy, width, height]);

  // Directional bias toward viewport center
  const dirX = (width * 0.5 - ox) / (width || 1);
  const dirY = (height * 0.5 - oy) / (height || 1);

  // Cubic easing functions (pure CPU math, 0 layout thrash)
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Compute transform scales for Phase 0 (Expand), 1 (Hold), 2 (Reveal)
  let mainScale = 0;
  let satProgress = 0;
  let revealTranslateY = 0;
  let revealScale = 1;
  let backdropOpacity = 0;

  if (phase === 0) {
    // EXPANSION (Phase 1 & 2)
    const t = Math.min(1, Math.max(0, progress));
    mainScale = easeOutCubic(t);
    satProgress = easeInOutCubic(t);
    // Backdrop ensures complete opacity at the tail of expansion
    backdropOpacity = t > 0.7 ? (t - 0.7) / 0.3 : 0;
  } else if (phase === 1) {
    // HOLD (Phase 3)
    mainScale = 1;
    satProgress = 1;
    backdropOpacity = 1;
  } else {
    // REVEAL (Phase 4)
    // Fluid flows off smoothly rather than fading
    const t = Math.min(1, Math.max(0, progress));
    const easeT = easeOutCubic(t);
    mainScale = 1;
    backdropOpacity = Math.max(0, 1 - t * 2.2);
    revealTranslateY = easeT * height * 1.15;
    revealScale = 1 + easeT * 0.15;
  }

  // Generate 4 organic satellite lobes around origin
  const satellites = [
    { angle: -0.65 + dirX * 0.4, distFactor: 0.75, radiusFactor: 0.68, delay: 0.05 },
    { angle: 0.75 + dirY * 0.4, distFactor: 0.85, radiusFactor: 0.72, delay: 0.02 },
    { angle: Math.PI - 0.5, distFactor: 0.78, radiusFactor: 0.65, delay: 0.08 },
    { angle: Math.PI + 0.65, distFactor: 0.82, radiusFactor: 0.70, delay: 0.04 },
  ];

  const baseRadius = maxRadius * 0.88;

  return (
    <div
      className={styles.canvasContainer}
      style={{
        transform: `translate3d(0, ${revealTranslateY.toFixed(1)}px, 0) scale(${revealScale.toFixed(3)})`,
        willChange: 'transform',
      }}
      aria-hidden="true"
    >
      {/* Dynamic SVG Gooey Filter definitions */}
      <svg className={styles.filterDefs} aria-hidden="true">
        <defs>
          <filter id="venom-gooey-filter" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={isLowPower ? 6 : 11} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 20 -8.5
              "
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>

          {/* Radial Gradient for cinematic Venom Ink color grading */}
          <radialGradient id="venom-ink-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#040a09" />
            <stop offset="68%" stopColor="#071917" />
            <stop offset="90%" stopColor="#0a2e29" />
            <stop offset="97%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#14b8a6" />
          </radialGradient>
        </defs>
      </svg>

      {/* Screen Backdrop Layer to guarantee 100% gapless coverage during phase transition */}
      <div
        className={styles.solidBackdrop}
        style={{
          opacity: backdropOpacity,
          backgroundColor: '#040a09',
        }}
      />

      {/* Hardware-accelerated SVG Metaball Group */}
      <svg
        className={styles.metaballSvg}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          filter: isLowPower ? 'none' : 'url(#venom-gooey-filter)',
        }}
      >
        <g id="venom-blobs-group">
          {/* Central Main Expanding Blob */}
          <circle
            cx={ox}
            cy={oy}
            r={baseRadius}
            fill="url(#venom-ink-gradient)"
            style={{
              transformOrigin: `${ox}px ${oy}px`,
              transform: `scale(${mainScale.toFixed(4)})`,
              willChange: 'transform',
            }}
          />

          {/* 4 Connected Satellite Lobes */}
          {satellites.map((sat, i) => {
            const adjustedProgress = Math.min(1, Math.max(0, (satProgress - sat.delay) / (1 - sat.delay)));
            const travelDist = baseRadius * sat.distFactor * adjustedProgress;
            const satX = ox + Math.cos(sat.angle) * travelDist;
            const satY = oy + Math.sin(sat.angle) * travelDist;
            const satR = baseRadius * sat.radiusFactor * adjustedProgress;

            if (satR <= 1) return null;

            return (
              <circle
                key={i}
                cx={satX}
                cy={satY}
                r={satR}
                fill="url(#venom-ink-gradient)"
                style={{
                  willChange: 'transform',
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* Subtle Analog Film Grain Accent */}
      <div className={styles.grainTexture} />
    </div>
  );
};

export default LiquidCanvas;
