import React, { useState, useEffect, useRef } from 'react';
import styles from './Hero.module.css';

export const Hero = () => {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let rafId = null;

    const handleMouseMove = (e) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        // Normalized coordinates from -0.5 to 0.5
        const normX = (e.clientX / innerWidth) - 0.5;
        const normY = (e.clientY / innerHeight) - 0.5;

        setMouseOffset({
          x: normX,
          y: normY,
        });
        rafId = null;
      });
    };

    const handleMouseLeave = () => {
      setMouseOffset({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [reducedMotion]);

  // Subtle interactive parallax on text
  const textParallax = reducedMotion
    ? 'translate(-50%, -50%)'
    : `translate(calc(-50% + ${mouseOffset.x * -10}px), calc(-50% + ${mouseOffset.y * -8}px))`;

  return (
    <section
      ref={containerRef}
      className={styles.heroContainer}
      aria-label="Hero Landing Screen"
    >
      {/* Subtle Film Grain / Paper Texture */}
      <div className={styles.grainOverlay} aria-hidden="true" />

      <div className={styles.posterStage}>
        {/* Top-Left Editorial Annotation */}
        <div className={`${styles.editorialText} ${styles.metaTopLeft}`}>
          <span>VIDEO EDITOR</span>
        </div>

        {/* Top-Right Editorial Annotation */}
        <div className={`${styles.editorialText} ${styles.metaTopRight}`}>
          <span>PORTFOLIO</span>
        </div>

        {/* Huge Background Typography: "PORTFOLIO" */}
        <div
          className={styles.typographyLayer}
          style={{ transform: textParallax }}
          aria-hidden="true"
        >
          <span className={styles.bigPortfolioText}>
            PORTFOLIO
          </span>
        </div>

        {/* Bottom-Left Editorial Text: "// Video Editor \n Visual Designer" */}
        <div className={`${styles.editorialText} ${styles.metaBottomLeft}`}>
          <div className={styles.bottomRoleLine}>
            <span className={styles.slashAccent}>//</span>
            <span>Video Editor</span>
          </div>
          <div className={styles.bottomDesignerLine}>
            <span>Visual Designer</span>
          </div>
        </div>

        {/* Bottom-Right Subtle Scroll Hint */}
        <div className={styles.scrollHint} aria-hidden="true">
          <span className={styles.scrollText}>SCROLL TO EXPLORE</span>
          <div className={styles.scrollLine} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
