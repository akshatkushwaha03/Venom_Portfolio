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
  useInteractionLayer();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleSections, setVisibleSections] = useState({
    hero: true,
    about: false,
    work: false,
    services: false,
    contact: false,
  });

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

      {/* 02 — ABOUT PREVIEW */}
      <div
        data-section-id="about"
        className={`${styles.sectionWrapper} ${visibleSections.about ? styles.sectionVisible : ''}`}
      >
        <About id="about" actionLink="/about" isPreview={true} />
      </div>

      {/* 03 — WORK PREVIEW */}
      <div
        data-section-id="work"
        className={`${styles.sectionWrapper} ${visibleSections.work ? styles.sectionVisible : ''}`}
      >
        <Work id="work" actionLink="/work" isPreview={true} />
      </div>

      {/* 04 — SERVICES PREVIEW */}
      <div
        data-section-id="services"
        className={`${styles.sectionWrapper} ${visibleSections.services ? styles.sectionVisible : ''}`}
      >
        <Services id="services" isPreview={true} />
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
