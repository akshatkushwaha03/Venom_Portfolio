import React, { useEffect, useRef, useState } from 'react';
import styles from './CustomCursor.module.css';

export const CustomCursor = () => {
  const [enabled, setEnabled] = useState(false);
  const [cursorState, setCursorState] = useState('default'); // 'default' | 'pointer' | 'card' | 'text' | 'hidden'
  const [badgeText, setBadgeText] = useState('');

  const dotRef = useRef(null);
  const ringRef = useRef(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const rafId = useRef(null);

  useEffect(() => {
    // Only enable on non-touch devices that support fine pointer
    const isPointerFine = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isPointerFine || prefersReducedMotion) {
      setEnabled(false);
      return;
    }

    setEnabled(true);

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check hover target to morph cursor
      const target = e.target;
      if (!target) return;

      const cardEl = target.closest('[data-cursor="card"], [data-tilt]');
      const clickableEl = target.closest('button, a, [data-magnetic], input, textarea, select');
      const headingEl = target.closest('h1, h2');

      if (cardEl) {
        setCursorState('card');
        setBadgeText(cardEl.getAttribute('data-cursor-text') || 'VIEW');
      } else if (clickableEl) {
        setCursorState('pointer');
        setBadgeText('');
      } else if (headingEl) {
        setCursorState('text');
        setBadgeText('');
      } else {
        setCursorState('default');
        setBadgeText('');
      }
    };

    const handleMouseLeave = () => {
      setCursorState('hidden');
    };

    const handleMouseEnter = () => {
      setCursorState('default');
    };

    // Smooth Lerp loop for trailing outer ring
    const renderLoop = () => {
      // Lerp formula: current + (target - current) * factor
      const factor = 0.18;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * factor;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * factor;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    rafId.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className={styles.cursorWrapper} aria-hidden="true">
      {/* Precision Center Dot */}
      <div
        ref={dotRef}
        className={`${styles.cursorDot} ${cursorState === 'hidden' ? styles.hidden : ''}`}
      />

      {/* Fluid Trailing Ring */}
      <div
        ref={ringRef}
        className={`
          ${styles.cursorRing}
          ${styles[cursorState] || ''}
        `}
      >
        {cursorState === 'card' && (
          <span className={styles.cursorBadge}>{badgeText}</span>
        )}
      </div>
    </div>
  );
};

export default CustomCursor;
