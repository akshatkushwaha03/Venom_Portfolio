import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import aboutPosterImg from '@/assets/images/about_poster.png';
import styles from './About.module.css';

// Default creator poster artwork imported from assets
export const About = ({ imageSrc = aboutPosterImg, id = 'about', actionLink = null, isPreview = false }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
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
    <section
      id={id}
      className={`${styles.aboutSection} ${isPreview ? styles.aboutSectionPreview : ''}`}
      aria-label="About Akshat - VENOM"
    >
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
            {isPreview ? (
              actionLink && (
                <Link
                  to={actionLink}
                  className={styles.sectionIconBtn}
                  title="Go to About page"
                  aria-label="Go to About page"
                  data-magnetic
                >
                  <span>EXPLORE</span>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </Link>
              )
            ) : (
              <button
                type="button"
                className={styles.backBtn}
                onClick={handleBack}
                aria-label="Go Back"
                title="Go back to previous page"
                data-magnetic
              >
                <span className={styles.backArrow}>←</span>
                <span>BACK</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={styles.grid}>
          {/* Left Column: Visual Stage — Only the artwork PNG */}
          <div className={styles.visualCol}>
            <div className={styles.posterWrapper} data-tilt>
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="VENOM — Akshat Kushwaha"
                  className={styles.posterImage}
                  loading="lazy"
                />
              ) : (
                /* Fallback Placeholder Frame */
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

            {/* Core Disciplines below photo - ONLY on outside home page */}
            {isPreview && (
              <div className={styles.visualDisciplines}>
                <span className={styles.disciplinesTitle}>CORE DISCIPLINES //</span>
                <div className={styles.disciplineChips}>
                  {disciplines.map((item) => (
                    <span key={item} className={styles.chip} data-magnetic>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Narrative, Manifesto & Credentials */}
          <div className={styles.contentCol}>
            {/* Top Greeting & Name with Accent Block (matching reference) */}
            <div className={styles.introHeader}>
              <span className={styles.greetingText}>Hi, I am</span>
              <div className={styles.nameRow}>
                <h2 className={styles.creatorName} data-kinetic>AKSHAT</h2>
                {/* Venom Eye Logo */}
                <div
                  className={styles.venomEyeLogo}
                  title="VENOM"
                  aria-label="VENOM Eye Emblem"
                  data-magnetic
                >
                  <svg
                    viewBox="0 0 100 45"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.venomEyeSvg}
                  >
                    <defs>
                      <linearGradient id="venomEyeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="65%" stopColor="#f0fdfa" />
                        <stop offset="100%" stopColor="#5eead4" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M45 33 C42 36 36 40 26 42 C16 41 8 32 4 20 C2 14 2 8 4 4 C7 9 12 14 16 15 C19 12 21 8 24 10 C23 14 24 17 28 18 C31 15 33 11 36 14 C35 18 36 21 38 24 C41 27 44 30 45 33 Z"
                      fill="url(#venomEyeGlow)"
                    />
                    <path
                      d="M55 33 C58 36 64 40 74 42 C84 41 92 32 96 20 C98 14 98 8 96 4 C93 9 88 14 84 15 C81 12 79 8 76 10 C77 14 76 17 72 18 C69 15 67 11 64 14 C65 18 64 21 62 24 C59 27 56 30 55 33 Z"
                      fill="url(#venomEyeGlow)"
                    />
                  </svg>
                </div>
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

            {/* Why "Venom"? — Identity Origin Story */}
            {isPreview ? (
              <div className={styles.originTeaserCard}>
                <div className={styles.originTeaserInfo}>
                  <div className={styles.originTeaserTagRow}>
                    <span className={styles.originTag}>// ORIGIN STORY</span>
                    <span className={styles.originTeaserPill}>THE IDENTITY</span>
                  </div>
                  <h3 className={styles.originTeaserTitle}>WHY “VENOM”?</h3>
                  <p className={styles.originTeaserDesc}>
                    From a PUBG gaming tag to cinematic storytelling — discover how the identity was born.
                  </p>
                </div>
                <div className={styles.originTeaserActions}>
                  <Link
                    to="/about"
                    className={styles.originTeaserBtn}
                    data-magnetic
                    aria-label="Read full origin story inside About page"
                  >
                    <span>READ STORY</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.originStoryBox}>
                <div className={styles.originHeader}>
                  <span className={styles.originTag}>// ORIGIN STORY</span>
                  <h3 className={styles.originTitle}>WHY “VENOM”?</h3>
                </div>

                <div className={styles.originStoryBody}>
                  <p className={styles.originLead}>
                    Honestly, I never planned for “VENOM” to become my identity.
                  </p>

                  <p className={styles.originParagraph}>
                    It all started with a game — <strong className={styles.highlightWhite}>PUBG</strong>. I needed a name, and somehow, I chose <em>VENOM</em>.
                  </p>

                  <p className={styles.originParagraph}>
                    Then I started making gaming content and uploading it on Instagram. Since “VENOM” was already my name in the game, I carried it over to Instagram too.
                  </p>

                  <p className={styles.originMutedLine}>
                    At that time, I had no idea where it would take me.
                  </p>

                  <p className={styles.originParagraph}>
                    Slowly, I started exploring. Gaming turned into editing. Editing turned into cinematic videos. Then photography, shoots, creative experiments… and so much more.
                  </p>

                  <p className={styles.originParagraph}>
                    I kept changing my niche, trying new things, learning, failing, improving and creating.
                  </p>

                  <p className={styles.originConstantLine}>
                    But one thing never changed — <span className={styles.tealAccent}>THE NAME</span>.
                  </p>

                  <p className={styles.originParagraph}>
                    What started as a random username in a game slowly became a part of my journey, my work, and eventually, a part of who I am.
                  </p>

                  <div className={styles.identityCard}>
                    <p className={styles.identityLine1}>I didn’t choose “VENOM” knowing it would become my identity.</p>
                    <p className={styles.identityLine2}>It became my identity because I grew with it.</p>
                  </div>
                </div>
              </div>
            )}

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

            {/* Creative Disciplines Tags - inside full About page */}
            {!isPreview && (
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
            )}

            {/* Preview Prompt to Explore Full Story */}
            {isPreview && (
              <div className={styles.previewExplorePrompt}>
                <Link to="/about" className={styles.previewExploreLink} data-magnetic>
                  <span>EXPLORE MY FULL JOURNEY & CREATIVE APPROACH</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* =============================================================
           EXTENDED STORY, JOURNEY & MY APPROACH SECTION
           Visible when user explores the full About page
           ============================================================= */}
        {!isPreview && (
          <div className={styles.extendedAbout}>
            {/* Section Separation Badge */}
            <div className={styles.editorialDivider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerBadge}>THE STORY & PHILOSOPHY</span>
              <span className={styles.dividerLine} />
            </div>

            {/* 2-Column Journey & Evolution Grid */}
            <div className={styles.journeyGrid}>
              {/* Card 1: The Journey */}
              <div className={styles.storyCard} data-tilt>
                <div className={styles.storyCardHeader}>
                  <span className={styles.storyCardIndex}>// 01 ORIGIN</span>
                  <span className={styles.storyCardTag}>CURIOSITY & PASSION</span>
                </div>
                <h3 className={styles.storyCardTitle}>THE JOURNEY</h3>
                <p className={styles.storyCardText}>
                  My journey started with a curiosity for cameras, films and storytelling. What began as an interest in creating visuals gradually became a deeper passion for filmmaking, editing and understanding how a simple idea can be transformed into a story people can feel.
                </p>
                <div className={styles.storyCardFooter}>
                  <span className={styles.storyKeyword}>Curiosity</span>
                  <span className={styles.storyBullet}>•</span>
                  <span className={styles.storyKeyword}>Filmmaking</span>
                  <span className={styles.storyBullet}>•</span>
                  <span className={styles.storyKeyword}>Emotion</span>
                </div>
              </div>

              {/* Card 2: Visual Storytelling & Evolution */}
              <div className={styles.storyCard} data-tilt>
                <div className={styles.storyCardHeader}>
                  <span className={styles.storyCardIndex}>// 02 EVOLUTION</span>
                  <span className={styles.storyCardTag}>CRAFT & MASTERY</span>
                </div>
                <h3 className={styles.storyCardTitle}>VISUAL STORYTELLING</h3>
                <p className={styles.storyCardText}>
                  Over time, I’ve explored different forms of visual storytelling—from shooting and editing content to experimenting with cinematography, photography, creative direction and short-form media. Every project has helped me develop my own visual language and understand what makes a frame meaningful.
                </p>
                <div className={styles.storyCardFooter}>
                  <span className={styles.storyKeyword}>Cinematography</span>
                  <span className={styles.storyBullet}>•</span>
                  <span className={styles.storyKeyword}>Direction</span>
                  <span className={styles.storyBullet}>•</span>
                  <span className={styles.storyKeyword}>Meaningful Frames</span>
                </div>
              </div>
            </div>

            {/* Featured Showcase: MY APPROACH */}
            <div className={styles.approachSection}>
              <div className={styles.approachGlow} aria-hidden="true" />
              <div className={styles.approachCard}>
                <div className={styles.approachHeader}>
                  <div className={styles.approachBadgeRow}>
                    <span className={styles.approachPulseDot} />
                    <span className={styles.approachBadgeText}>CREATIVE PHILOSOPHY</span>
                  </div>
                  <h2 className={styles.approachHeading}>MY APPROACH</h2>
                </div>

                <blockquote className={styles.approachQuote}>
                  “I believe good visuals are more than just beautiful frames. They should have a mood, a purpose and a story. I focus on combining cinematic visuals, strong composition, sound and editing to create content that connects.”
                </blockquote>

                {/* 4 Core Pillars of the Approach */}
                <div className={styles.approachPillars}>
                  <div className={styles.pillarItem}>
                    <div className={styles.pillarIcon}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        <path d="M2 12h20" />
                      </svg>
                    </div>
                    <h4 className={styles.pillarTitle}>Mood & Atmosphere</h4>
                    <p className={styles.pillarDesc}>
                      Intentional lighting, tone and color science that give every frame a distinct emotional presence.
                    </p>
                  </div>

                  <div className={styles.pillarItem}>
                    <div className={styles.pillarIcon}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12h20" />
                        <path d="M20 12l-4-4m4 4l-4 4" />
                        <circle cx="6" cy="12" r="3" />
                      </svg>
                    </div>
                    <h4 className={styles.pillarTitle}>Purposeful Story</h4>
                    <p className={styles.pillarDesc}>
                      Transforming simple concepts into meaningful stories with strong narrative intent that viewers remember.
                    </p>
                  </div>

                  <div className={styles.pillarItem}>
                    <div className={styles.pillarIcon}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    </div>
                    <h4 className={styles.pillarTitle}>Sound & Editing Rhythm</h4>
                    <p className={styles.pillarDesc}>
                      Harmonizing cinematography, pacing, transitions, and audio design to build seamless kinetic flow.
                    </p>
                  </div>

                  <div className={styles.pillarItem}>
                    <div className={styles.pillarIcon}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                    <h4 className={styles.pillarTitle}>Human Connection</h4>
                    <p className={styles.pillarDesc}>
                      Going beyond visual aesthetic to evoke genuine feeling and create lasting resonance with the audience.
                    </p>
                  </div>
                </div>

                {/* Credentials Stats Row (2+ Years Exp, 100+ Videos, 5+ Brands) */}
                <div className={styles.bottomStatsRow}>
                  {stats.map((stat, idx) => (
                    <div key={idx} className={styles.bottomStatItem}>
                      <div className={styles.bottomStatDivider} aria-hidden="true" />
                      <div className={styles.bottomStatInfo}>
                        <span className={styles.bottomStatNumber}>{stat.number}</span>
                        <span className={styles.bottomStatLabel}>
                          {stat.labelLine1}
                          <br />
                          {stat.labelLine2}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom CTA within the card */}
                <div className={styles.approachCta}>
                  <div className={styles.ctaText}>
                    <span className={styles.ctaTagline}>HAVE A STORY TO TELL?</span>
                    <span className={styles.ctaSub}>
                      Let’s collaborate on your next film, commercial, or creative visual project.
                    </span>
                  </div>
                  <Link to="/contact" className={styles.approachBtn} data-magnetic>
                    <span>GET IN TOUCH</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default About;
