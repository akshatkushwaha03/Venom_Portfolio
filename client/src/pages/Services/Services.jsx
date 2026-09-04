import React from 'react';
import styles from './Services.module.css';

export const Services = ({ id = 'services' }) => {
  const services = [
    {
      num: '01',
      title: '01 — VIDEOGRAPHY',
      desc: 'Professional video production for brands, campaigns, events, and creative projects.',
      bgTexture: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=70',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
          <rect x="3" y="6" width="12" height="12" rx="2" />
          <circle cx="8.5" cy="12" r="2" />
          <path d="M6 9h2" />
        </svg>
      ),
    },
    {
      num: '02',
      title: '02 — CINEMATOGRAPHY',
      desc: 'Cinematic visual storytelling with intentional composition, lighting, movement, and atmosphere.',
      bgTexture: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=70',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="7" r="3" />
          <circle cx="15" cy="7" r="3" />
          <path d="M4 14h16v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
          <path d="M20 14l3-2v8l-3-2" />
          <circle cx="12" cy="17.5" r="1.5" />
        </svg>
      ),
    },
    {
      num: '03',
      title: '03 — VIDEO EDITING',
      desc: 'Story-driven editing with pacing, sound design, color, transitions, and rhythm.',
      bgTexture: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=70',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M8 8l5 4-5 4V8z" />
          <path d="M15 8v8" />
          <path d="M18 11v2" />
        </svg>
      ),
    },
    {
      num: '04',
      title: '04 — PHOTOGRAPHY',
      desc: 'Editorial and lifestyle photography focused on atmosphere, people, products, and moments.',
      bgTexture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=70',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      ),
    },
    {
      num: '05',
      title: '05 — SOCIAL CONTENT',
      desc: 'Short-form videos, reels, vertical content, and social-first visual storytelling.',
      bgTexture: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&w=600&q=70',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="3" />
          <path d="M12 18h.01" />
          <path d="M10 8.5l4 2.5-4 2.5v-5z" />
          <path d="M9 5h6" />
        </svg>
      ),
    },
  ];

  return (
    <section id={id} className={styles.servicesSection} aria-label="Venom Services">
      {/* Subtle Analog Film Grain Overlay */}
      <div className={styles.grainOverlay} aria-hidden="true" />

      {/* Atmospheric Ambient Glows */}
      <div className={styles.ambientGlowTop} aria-hidden="true" />
      <div className={styles.ambientGlowBottom} aria-hidden="true" />

      <div className={styles.container}>
        {/* Section Header */}
        <header className={styles.sectionHeader}>
          <div className={styles.systemTagRow}>
            <span className={styles.systemTag}>// SERVICES & CAPABILITIES</span>
            <span className={styles.dotDivider}>•</span>
            <span className={styles.categoryCount}>05 DISCIPLINES</span>
          </div>

          <h2 className={styles.mainHeading} data-kinetic>
            SERVICES <span className={styles.headingAccent}>— OFFERINGS</span>
          </h2>

          <p className={styles.statementText}>
            “I help brands, artists, and businesses bring their ideas to life through powerful visual content.
            <br />
            From concept to final cut — every frame with purpose.”
          </p>
        </header>

        {/* 5-Column Services Grid */}
        <div className={styles.gridWrapper}>
          <div className={styles.servicesGrid}>
            {services.map((item) => (
              <article
                key={item.num}
                className={styles.serviceCard}
                tabIndex={0}
                data-tilt
                data-cursor="card"
                data-cursor-text={item.num}
              >
                {/* Subtle Cinematic Background Image Texture inside Card */}
                <div
                  className={styles.cardTexture}
                  style={{ backgroundImage: `url(${item.bgTexture})` }}
                  aria-hidden="true"
                />
                <div className={styles.cardTextureOverlay} aria-hidden="true" />

                {/* Top Row: Number & Minimal Purple Line Icon */}
                <div className={styles.cardTop}>
                  <span className={styles.cardNumber}>{item.num}</span>
                  <div className={styles.cardIcon}>{item.icon}</div>
                </div>

                {/* Body: Large Condensed Service Title & Readable Description */}
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardDesc}>{item.desc}</p>
                </div>

                {/* Subtle Hover Border & Glow Highlight */}
                <div className={styles.cardGlowBorder} aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
