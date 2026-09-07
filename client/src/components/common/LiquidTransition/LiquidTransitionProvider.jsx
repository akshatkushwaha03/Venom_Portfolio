import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LiquidCanvas from './LiquidCanvas';
import { LiquidTransitionContext } from './useLiquidTransition';
import styles from './LiquidTransition.module.css';

export const LiquidTransitionProvider = ({ children }) => {
  const navigate = useNavigate();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const [animPhase, setAnimPhase] = useState(0); // 0 = expand, 1 = hold, 2 = reveal
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
  const [reducedMotionActive, setReducedMotionActive] = useState(false);

  const isTransitioningRef = useRef(false);
  const rafRef = useRef(null);
  const contentRef = useRef(null);
  const destinationRef = useRef(null);
  const lastTouchPointRef = useRef(null);

  // Detect low-power or mobile devices for progressive enhancement
  const isLowPower = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    return Boolean(lowCores || isMobileDevice);
  }, []);

  // Update viewport dimensions on resize (passive listener)
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track touch / tap coordinates independently on mobile devices
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (e.clientX || e.clientY) {
        lastTouchPointRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        lastTouchPointRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  /**
   * Main transition trigger
   * Target duration: ~800ms total
   * Phase 1 & 2: Inflow / Expand (~340ms)
   * Phase 3: Hold Coverage (~120ms) -> Route navigation & scroll reset
   * Phase 4: Outflow / Flow-Off Reveal (~340ms)
   */
  const triggerTransition = useCallback((to, clickCoords = null) => {
    if (isTransitioningRef.current) return;
    if (to === null || to === undefined) return;

    isTransitioningRef.current = true;
    setIsTransitioning(true);
    destinationRef.current = to;

    // Viewport dimensions
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Determine coordinate origin: passed coords -> last touch point -> center
    let rawX = clickCoords && typeof clickCoords.x === 'number' ? clickCoords.x : null;
    let rawY = clickCoords && typeof clickCoords.y === 'number' ? clickCoords.y : null;

    if (rawX === null && lastTouchPointRef.current) {
      rawX = lastTouchPointRef.current.x;
      rawY = lastTouchPointRef.current.y;
    }

    // Default to screen center if keyboard navigation or undetected
    if (rawX === null || rawX === undefined || (rawX === 0 && rawY === 0)) {
      rawX = vw * 0.5;
      rawY = vh * 0.5;
    }

    const currentOrigin = {
      x: Math.max(0, Math.min(vw, rawX)),
      y: Math.max(0, Math.min(vh, rawY)),
    };
    setOrigin(currentOrigin);

    // Accessibility: prefers-reduced-motion check
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setReducedMotionActive(true);
      setTimeout(() => {
        navigate(to);
        if (typeof to === 'string') window.scrollTo(0, 0);
        setTimeout(() => {
          setReducedMotionActive(false);
          isTransitioningRef.current = false;
          setIsTransitioning(false);
        }, 160);
      }, 160);
      return;
    }

    // Performance-tuned timings
    const DURATION_EXPAND = 340;
    const DURATION_HOLD = 120;
    const DURATION_REVEAL = 340;

    let startTime = performance.now();
    setAnimPhase(0);
    setAnimProgress(0);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;

      if (elapsed < DURATION_EXPAND) {
        // Phase 1 & 2: Expansion
        const t = Math.min(1, elapsed / DURATION_EXPAND);
        setAnimProgress(t);
        setAnimPhase(0);

        // Hardware-accelerated composite scale (0 layout reflows)
        if (contentRef.current) {
          const scale = 1.0 - t * 0.015;
          contentRef.current.style.transform = `scale3d(${scale.toFixed(4)}, ${scale.toFixed(4)}, 1)`;
          contentRef.current.style.opacity = (1.0 - t * 0.1).toFixed(3);
        }

        rafRef.current = requestAnimationFrame(animate);
      } else if (elapsed < DURATION_EXPAND + DURATION_HOLD) {
        // Phase 3: Screen Fully Covered -> Synchronous Route Swap
        setAnimProgress(1);
        setAnimPhase(1);

        if (destinationRef.current !== null && destinationRef.current !== undefined) {
          navigate(destinationRef.current);
          if (typeof destinationRef.current === 'string') {
            window.scrollTo(0, 0);
          }
          destinationRef.current = null;
        }

        rafRef.current = requestAnimationFrame(animate);
      } else if (elapsed < DURATION_EXPAND + DURATION_HOLD + DURATION_REVEAL) {
        // Phase 4: Flow-Off Reveal
        const revealElapsed = elapsed - (DURATION_EXPAND + DURATION_HOLD);
        const t = Math.min(1, revealElapsed / DURATION_REVEAL);
        setAnimProgress(t);
        setAnimPhase(2);

        // Underlying page recovery via GPU transform
        if (contentRef.current) {
          const recoverT = 1 - Math.pow(1 - t, 3);
          const scale = 1.008 - recoverT * 0.008;
          contentRef.current.style.transform = `scale3d(${scale.toFixed(4)}, ${scale.toFixed(4)}, 1)`;
          contentRef.current.style.opacity = (0.9 + recoverT * 0.1).toFixed(3);
        }

        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Transition Completed -> Full Cleanup (Zero Idle Consumption)
        setAnimProgress(1);
        setAnimPhase(2);
        isTransitioningRef.current = false;
        setIsTransitioning(false);

        if (contentRef.current) {
          contentRef.current.style.transform = '';
          contentRef.current.style.opacity = '';
        }
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [navigate]);

  // Programmatic navigation helper
  const navigateWithLiquid = useCallback((to, options = {}) => {
    const coords = options.origin || null;
    triggerTransition(to, coords);
  }, [triggerTransition]);

  // Global Capture-Phase Link & Interaction Interceptor
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Prevent double triggering while running
      if (isTransitioningRef.current) {
        const targetLink = e.target.closest('a[href], button[data-navigate]');
        if (targetLink) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      // Allow clicks with modifier keys (open in new tab / new window)
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      // 1. Explicit data-navigate attribute support
      const dataNavEl = e.target.closest('[data-navigate]');
      if (dataNavEl) {
        e.preventDefault();
        e.stopPropagation();
        const target = dataNavEl.getAttribute('data-navigate');
        if (target) {
          triggerTransition(target, { x: e.clientX, y: e.clientY });
        }
        return;
      }

      // 2. Back button detection
      const backBtn = e.target.closest('button[data-back], button[aria-label="Go Back"], button[aria-label="Back"]');
      if (backBtn) {
        e.preventDefault();
        e.stopPropagation();
        const fallbackTarget = window.history.state && window.history.state.idx > 0 ? -1 : '/';
        triggerTransition(fallbackTarget, { x: e.clientX, y: e.clientY });
        return;
      }

      // 3. Anchor links
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref) return;

      // Ignore external URLs, mailto, tel, downloads, target="_blank"
      if (
        rawHref.startsWith('http://') ||
        rawHref.startsWith('https://') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        anchor.getAttribute('target') === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      // Resolve URL against origin
      const currentUrl = new URL(window.location.href);
      const targetUrl = new URL(anchor.href, window.location.origin);

      if (targetUrl.origin !== currentUrl.origin) return;

      // In-page hash jumps
      if (
        targetUrl.pathname === currentUrl.pathname &&
        targetUrl.search === currentUrl.search &&
        targetUrl.hash
      ) {
        return;
      }

      // Identical path click
      if (
        targetUrl.pathname === currentUrl.pathname &&
        targetUrl.search === currentUrl.search &&
        !targetUrl.hash
      ) {
        e.preventDefault();
        return;
      }

      // Intercept and initiate liquid transition
      e.preventDefault();
      e.stopPropagation();

      const destination = targetUrl.pathname + targetUrl.search + targetUrl.hash;
      triggerTransition(destination, { x: e.clientX, y: e.clientY });
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });

    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [triggerTransition]);

  return (
    <LiquidTransitionContext.Provider
      value={{
        isTransitioning,
        navigateWithLiquid,
        contentRef,
      }}
    >
      {/* Page Content Container: GPU composite properties only (scale3d, opacity) */}
      <div
        ref={contentRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          willChange: isTransitioning ? 'transform, opacity' : 'auto',
          transform: 'translateZ(0)',
        }}
      >
        {children}
      </div>

      {/* GPU-Accelerated Liquid Transition Overlay (Mounted ONLY when active to eliminate idle overhead) */}
      {isTransitioning && !reducedMotionActive && (
        <div
          className={`${styles.overlayContainer} ${styles.overlayActive}`}
          aria-hidden="true"
        >
          <LiquidCanvas
            progress={animProgress}
            phase={animPhase}
            origin={origin}
            viewport={viewport}
            isLowPower={isLowPower}
          />
        </div>
      )}

      {/* Accessible Reduced-Motion Curtain */}
      <div
        className={`${styles.reducedMotionCurtain} ${
          reducedMotionActive ? styles.reducedMotionCurtainVisible : ''
        }`}
        aria-hidden="true"
      />
    </LiquidTransitionContext.Provider>
  );
};

export default LiquidTransitionProvider;
