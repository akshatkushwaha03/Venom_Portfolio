import React, { useState, useEffect } from 'react';
import Hero from './Hero';
import About from '../About';
import Work from '../Work';
import Services from '../Services';
import Contact from '../Contact';
import KineticMarquee from '@/components/common/KineticMarquee';
import useInteractionLayer from '@/hooks/useInteractionLayer';
import styles from './Home.module.css';

export const Home = () => {
  // Initialize magnetic buttons, 3D tilts, and scroll velocity kinetics
  useInteractionLayer();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleSections, setVisibleSections] = useState({
    hero: true,
    about: false,
    work: false,
    services: false,
    contact: false,
  });

  // Track global scroll progress for the top glowing purple bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for cinematic scroll entry transitions
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.08,
    };

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section-id');
          if (sectionId) {
            setVisibleSections((prev) => ({ ...prev, [sectionId]: true }));
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const elements = document.querySelectorAll('[data-section-id]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <main className={styles.page}>
      {/* Top Cinematic Glowing Scroll Progress Bar */}
      <div
        className={styles.scrollProgressBar}
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* 01 — HERO SECTION */}
      <div
        data-section-id="hero"
        className={`${styles.sectionWrapper} ${styles.heroWrapper}`}
      >
        <Hero />
      </div>

      <div className={styles.interSectionDivider} aria-hidden="true">
        <span className={styles.dividerGlowDot} />
      </div>

      {/* 02 — ABOUT SECTION */}
      <div
        data-section-id="about"
        className={`${styles.sectionWrapper} ${visibleSections.about ? styles.sectionVisible : ''}`}
      >
        <About id="about" />
      </div>

      <div className={styles.interSectionDivider} aria-hidden="true">
        <span className={styles.dividerGlowDot} />
      </div>

      {/* 03 — WORK SECTION */}
      <div
        data-section-id="work"
        className={`${styles.sectionWrapper} ${visibleSections.work ? styles.sectionVisible : ''}`}
      >
        <Work id="work" />
      </div>

      <div className={styles.interSectionDivider} aria-hidden="true">
        <span className={styles.dividerGlowDot} />
      </div>

      {/* 04 — SERVICES SECTION */}
      <div
        data-section-id="services"
        className={`${styles.sectionWrapper} ${visibleSections.services ? styles.sectionVisible : ''}`}
      >
        <Services id="services" />
      </div>

      {/* INTERACTIVE CINEMATIC MARQUEE */}
      <KineticMarquee />

      {/* 05 — CONTACT SECTION */}
      <div
        data-section-id="contact"
        className={`${styles.sectionWrapper} ${visibleSections.contact ? styles.sectionVisible : ''}`}
      >
        <Contact id="contact" />
      </div>
    </main>
  );
};

export default Home;
