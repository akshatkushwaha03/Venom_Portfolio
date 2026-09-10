import { useEffect, useRef } from 'react';

/**
 * useInteractionLayer
 * Provides high-performance, 60fps micro-interactions:
 * 1. Magnetic hover physics on CTAs & buttons
 * 2. 3D card tilt & dynamic glare on service/portfolio cards
 * 3. Scroll velocity kinetic tilt on major headings
 */
export const useInteractionLayer = () => {
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const velocityRafId = useRef(null);

  useEffect(() => {
    const isTouch = !window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion) {
      return;
    }

    // -------------------------------------------------------------
    // 1. Magnetic Hover Physics on [data-magnetic] & CTAs
    // -------------------------------------------------------------
    const magneticElements = document.querySelectorAll(
      '[data-magnetic], button[type="submit"], a[href="#contact"]'
    );

    const handleMagneticMove = (e) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * 0.28;
      const deltaY = (e.clientY - centerY) * 0.28;

      el.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
      el.style.transition = 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)';
    };

    const handleMagneticLeave = (e) => {
      const el = e.currentTarget;
      el.style.transform = 'translate3d(0, 0, 0)';
      el.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
    };

    magneticElements.forEach((el) => {
      el.addEventListener('mousemove', handleMagneticMove, { passive: true });
      el.addEventListener('mouseleave', handleMagneticLeave);
    });

    // -------------------------------------------------------------
    // 2. 3D Tilt on [data-tilt] Cards
    // -------------------------------------------------------------
    const tiltElements = document.querySelectorAll('[data-tilt]');

    const handleTiltMove = (e) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();

      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;

      const tiltX = -normY * 7; // Max 7 deg
      const tiltY = normX * 7;

      card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translate3d(0, -6px, 16px) scale3d(1.02, 1.02, 1.02)`;
      card.style.transition = 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease';
    };

    const handleTiltLeave = (e) => {
      const card = e.currentTarget;
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0) scale3d(1, 1, 1)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease';
    };

    tiltElements.forEach((card) => {
      card.addEventListener('mousemove', handleTiltMove, { passive: true });
      card.addEventListener('mouseleave', handleTiltLeave);
    });

    // -------------------------------------------------------------
    // 3. Scroll Velocity Kinetic Heading Dynamics
    // -------------------------------------------------------------
    const kineticHeadings = document.querySelectorAll('[data-kinetic]');

    const checkScrollVelocity = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const timeDelta = Math.max(1, currentTime - lastScrollTime.current);
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Compute velocity (pixels per ms)
      const rawVelocity = scrollDelta / timeDelta;
      // Clamp velocity to prevent extreme distortion
      const clampedVelocity = Math.max(-25, Math.min(25, rawVelocity * 10));
      const skewAngle = clampedVelocity * 0.04; // subtle max ~1 deg

      kineticHeadings.forEach((heading) => {
        heading.style.transform = `skewY(${skewAngle.toFixed(2)}deg)`;
        heading.style.transition = 'transform 0.25s ease-out';
      });

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = currentTime;

      velocityRafId.current = requestAnimationFrame(checkScrollVelocity);
    };

    velocityRafId.current = requestAnimationFrame(checkScrollVelocity);

    // Cleanup listeners
    return () => {
      magneticElements.forEach((el) => {
        el.removeEventListener('mousemove', handleMagneticMove);
        el.removeEventListener('mouseleave', handleMagneticLeave);
      });

      tiltElements.forEach((card) => {
        card.removeEventListener('mousemove', handleTiltMove);
        card.removeEventListener('mouseleave', handleTiltLeave);
      });

      if (velocityRafId.current) cancelAnimationFrame(velocityRafId.current);
    };
  }, []);
};

export default useInteractionLayer;
