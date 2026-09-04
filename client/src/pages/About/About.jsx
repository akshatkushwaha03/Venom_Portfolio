import React from 'react';
import styles from './About.module.css';

// Optional creator photo: set to an image URL or import when ready
export const About = ({ imageSrc = null, id = 'about' }) => {
  const disciplines = [
    'Cinematography',
    'Videography',
    'Photography',
    'Film Editing',
    'Visual Direction',
    'Social Media Storytelling',
  ];

  const stats = [
    { number: '2+', labelLine1: 'Years', labelLine2: 'Experience' },
    { number: '100+', labelLine1: 'Videos', labelLine2: 'Completed' },
    { number: '5+', labelLine1: 'Brands', labelLine2: 'Collaborated' },
  ];

  return (
    <section id={id} className={styles.aboutSection} aria-label="About Akshat - VENOM">
      {/* Subtle Paper Texture Overlay */}
      <div className={styles.grainOverlay} aria-hidden="true" />

      <div className={styles.container}>
        {/* Editorial Section Header */}
        <div className={styles.sectionHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.slashAccent}>//</span>
            <span className={styles.headerIndex}>01 ABOUT</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.headerSubtitle}>THE EYE BEHIND VENOM</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={styles.grid}>
          {/* Left Column: Visual Stage / Photo Frame */}
          <div className={styles.visualCol}>
            <div className={styles.photoWrapper}>
              {/* Offset Dark Purple Geometric Accent Block (from reference photo) */}
              <div className={styles.accentBackdropBlock} aria-hidden="true" />

              {/* Photo Container / Placeholder Frame */}
              <div
                className={styles.photoCard}
                data-tilt
                data-cursor="card"
                data-cursor-text="PORTRAIT"
              >
                {/* Viewfinder Crosshairs / Framing Corner Accents */}
                <span className={`${styles.viewfinderCorner} ${styles.cornerTL}`} aria-hidden="true" />
                <span className={`${styles.viewfinderCorner} ${styles.cornerTR}`} aria-hidden="true" />
                <span className={`${styles.viewfinderCorner} ${styles.cornerBL}`} aria-hidden="true" />
                <span className={`${styles.viewfinderCorner} ${styles.cornerBR}`} aria-hidden="true" />

                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Akshat — Cinematographer & Editor"
                    className={styles.creatorImage}
                    loading="lazy"
                  />
                ) : (
                  /* Dedicated Space for Photo (as requested) */
                  <div className={styles.photoPlaceholder}>
                    <div className={styles.viewfinderReticle}>
                      <svg
                        className={styles.cameraIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span className={styles.viewfinderPlus}>+</span>
                    </div>

                    <div className={styles.placeholderMeta}>
                      <span className={styles.placeholderTitle}>PORTRAIT SPACE</span>
                      <span className={styles.placeholderDesc}>
                        Space reserved for photo
                      </span>
                    </div>

                    <div className={styles.filmMetadata} aria-hidden="true">
                      <span>ASPECT 4:5</span>
                      <span>•</span>
                      <span>RAW 35MM</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Narrative, Manifesto & Credentials */}
          <div className={styles.contentCol}>
            {/* Top Greeting & Name with Accent Block (matching reference) */}
            <div className={styles.introHeader}>
              <span className={styles.greetingText}>Hi, I am</span>
              <div className={styles.nameRow}>
                <h2 className={styles.creatorName} data-kinetic>AKSHAT</h2>
                {/* Solid Dark Purple Rectangular Block beside name (from reference) */}
                <span className={styles.nameAccentBlock} aria-hidden="true" />
              </div>
              <p className={styles.roleIdentity}>
                Visual Storyteller, Cinematographer & Editor behind{' '}
                <span className={styles.venomHighlight}>VENOM</span>
              </p>
            </div>

            {/* Powerful Manifesto Headline */}
            <div className={styles.manifestoCard}>
              <p className={styles.manifestoLine1}>I DON’T JUST CREATE CONTENT.</p>
              <p className={styles.manifestoLine2}>I CREATE STORIES PEOPLE REMEMBER.</p>
            </div>

            {/* Story & Philosophy Paragraphs */}
            <div className={styles.storyContent}>
              <p className={styles.leadParagraph}>
                I’m obsessed with turning ordinary moments into visuals that feel{' '}
                <span className={styles.textEmphasis}>cinematic, intentional, and alive</span>.
                From capturing a brand’s identity to documenting people, places, and experiences,
                I focus on creating content that doesn’t just look good —{' '}
                <span className={styles.textUnderline}>it makes you feel something</span>.
              </p>

              <p className={styles.bodyParagraph}>
                My work moves across cinematography, videography, photography, editing, and
                social media content, blending authentic storytelling with a sharp visual aesthetic.
              </p>

              {/* The VENOM Creative Creed Quote Box */}
              <div className={styles.creedBox}>
                <div className={styles.creedAccentLine} />
                <div className={styles.creedContent}>
                  <span className={styles.creedTag}>THE VENOM PHILOSOPHY //</span>
                  <blockquote className={styles.creedQuote}>
                    “VENOM is my creative space — where ideas become frames, frames become
                    stories, and stories become experiences.”
                  </blockquote>
                </div>
              </div>
            </div>

            {/* Creative Disciplines Tags */}
            <div className={styles.disciplinesSection}>
              <span className={styles.disciplinesTitle}>CORE DISCIPLINES //</span>
              <div className={styles.disciplineChips}>
                {disciplines.map((item) => (
                  <span key={item} className={styles.chip} data-magnetic>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Credentials Stats Row (from reference image) */}
            <div className={styles.statsRow}>
              {stats.map((stat, idx) => (
                <div key={idx} className={styles.statItem}>
                  <div className={styles.statDivider} aria-hidden="true" />
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{stat.number}</span>
                    <span className={styles.statLabel}>
                      {stat.labelLine1}
                      <br />
                      {stat.labelLine2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
