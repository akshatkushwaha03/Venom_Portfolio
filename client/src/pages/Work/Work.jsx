import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GENRE_CATEGORIES } from './projectsData';
import { getProjects, deleteProject } from '@/services/api';
import ProjectUploadModal from './ProjectUploadModal';
import styles from './Work.module.css';

export const Work = ({ id = 'work' }) => {
  // Navigation & interaction states
  const [activeGenreKey, setActiveGenreKey] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [dbProjects, setDbProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const sectionRef = useRef(null);

  // Fetch projects from server / Supabase PostgreSQL database
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setDbProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('[WORK] Could not load database projects:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Active genre object
  const activeGenre = useMemo(() => {
    if (!activeGenreKey) return null;
    return GENRE_CATEGORIES.find((g) => g.key === activeGenreKey) || null;
  }, [activeGenreKey]);

  // Projects of the active genre (merges DB projects with any static archive items)
  const currentProjects = useMemo(() => {
    const staticProjects = activeGenre?.projects || [];
    if (!activeGenreKey) {
      return [...dbProjects, ...staticProjects];
    }
    const matchingDb = dbProjects.filter(
      (p) => (p.genre || '').toLowerCase() === activeGenreKey.toLowerCase()
    );
    return [...matchingDb, ...staticProjects];
  }, [activeGenreKey, dbProjects, activeGenre]);

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Delete this project and its private video?')) return;
    try {
      await deleteProject(projectId);
      setDbProjects((prev) => prev.filter((p) => p.id !== projectId));
      setActiveProject(null);
    } catch (err) {
      alert(`Failed to delete project: ${err.message}`);
    }
  };

  // Keyboard accessibility: ESC key closes modal or returns to all work
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeProject) {
          setActiveProject(null);
        } else if (activeGenreKey) {
          setActiveGenreKey(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProject, activeGenreKey]);

  // Prevent background body scroll when project modal is open
  useEffect(() => {
    if (activeProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeProject]);

  // Switch between genres seamlessly without reloading or re-rendering the hero
  const handleSelectGenre = (genreKey) => {
    setActiveGenreKey(genreKey);
  };

  // Return to the main 8-genre directory
  const handleBackToAllWork = () => {
    setActiveGenreKey(null);
    setActiveProject(null);
  };

  return (
    <section id={id} ref={sectionRef} className={styles.workSection} aria-label="Venom Work Archive">
      {/* Subtle Analog Grain Overlay */}
      <div className={styles.grainOverlay} aria-hidden="true" />

      {/* Atmospheric Background Ambient Glows */}
      <div className={styles.ambientGlowTop} aria-hidden="true" />
      <div className={styles.ambientGlowBottom} aria-hidden="true" />

      <div className={styles.container}>
        {/* =============================================================
           STATE 1: MAIN WORK DIRECTORY (Shown only on main page)
           ============================================================= */}
        {!activeGenreKey ? (
          <div className={styles.mainDirectoryView}>
            {/* System Header / Archive Metadata */}
            <header className={styles.archiveHeader}>
              <div className={styles.headerMetaLeft}>
                <span className={styles.systemTag}>// VENOM // THE ARTIST</span>
                <span className={styles.dotDivider}>•</span>
                <span className={styles.locationTag}>FILM / PHOTOGRAPHY / EDITING</span>
              </div>

              <div className={styles.headerMetaRight}>
                <div className={styles.headerActionsRight}>
                  <button
                    type="button"
                    className={styles.uploadActionBtn}
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    <span className={styles.uploadPlusIcon}>+</span>
                    <span>UPLOAD PROJECT</span>
                  </button>
                  <span className={styles.statusBadge}>
                    <span className={styles.pulseDot} />
                    <span>ACTIVE ARCHIVE : 08 DISCIPLINES</span>
                  </span>
                </div>
              </div>
            </header>

            {/* Primary Section Title — ONLY visible on main WORK page */}
            <div className={styles.titleWrapper}>
              <h2 className={styles.mainTitle} data-kinetic>
                VENOM <span className={styles.titleMuted}>— THE ARTIST</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                FILM / EDITING / PHOTOGRAPHY / STORYTELLING / CULTURE / COMMERCIAL WORK
              </p>
            </div>

            {/* The 8 Interactive Genre Categories */}
            <div className={styles.directoryList} role="list">
              {GENRE_CATEGORIES.map((genre) => (
                <div
                  key={genre.id}
                  className={styles.genreRow}
                  role="listitem"
                  data-cursor="card"
                  data-cursor-text="OPEN"
                  onClick={() => handleSelectGenre(genre.key)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectGenre(genre.key);
                    }
                  }}
                >
                  {/* Left Number */}
                  <div className={styles.numberWrapper}>
                    <span className={styles.genreNumber}>{genre.id}</span>
                  </div>

                  {/* Center Title & Discipline */}
                  <div className={styles.titleCol}>
                    <h3 className={styles.genreTitle}>{genre.title}</h3>
                    <p className={styles.genreTagline}>{genre.description}</p>
                  </div>

                  {/* Right Meta & Arrow Indicator */}
                  <div className={styles.indicatorCol}>
                    <span className={styles.disciplineBadge}>{genre.discipline}</span>
                    <div className={styles.arrowCircle} data-magnetic>
                      <span className={styles.arrowIcon}>↗</span>
                    </div>
                  </div>

                  {/* Subtle Hover Gradient Underline */}
                  <div className={styles.rowHoverLine} aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* =============================================================
             STATE 2: SELECTED GENRE ARCHIVE (Direct transition, NO replay of VENOM — THE ARTIST)
             ============================================================= */
          <div key={activeGenre?.key} className={styles.genreArchiveView}>
            {/* Top Navigation Bar with Back Control and Genre Switcher */}
            <div className={styles.genreTopBar}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleBackToAllWork}
                  aria-label="Return to all categories"
                >
                  <span className={styles.backArrow}>←</span>
                  <span>ALL WORK</span>
                </button>

                <button
                  type="button"
                  className={styles.uploadActionBtn}
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <span className={styles.uploadPlusIcon}>+</span>
                  <span>NEW VIDEO</span>
                </button>
              </div>

              {/* Direct Genre Switcher Pills */}
              <div className={styles.genreSwitchPills} role="tablist">
                {GENRE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={cat.key === activeGenreKey}
                    className={`${styles.switchPill} ${
                      cat.key === activeGenreKey ? styles.switchPillActive : ''
                    }`}
                    onClick={() => handleSelectGenre(cat.key)}
                  >
                    <span className={styles.pillNum}>{cat.id}</span> {cat.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Genre Becomes the Primary Visual Heading */}
            <header className={styles.genreHeaderBlock}>
              <div className={styles.genreIndexLabel}>
                <span className={styles.genreLargeIndex}>{activeGenre?.id}</span>
                <span className={styles.genreSlash}>//</span>
                <span className={styles.genreDisciplineTag}>{activeGenre?.discipline}</span>
              </div>

              <h2 className={styles.selectedGenreTitle}>{activeGenre?.title}</h2>
              <p className={styles.selectedGenreDesc}>{activeGenre?.description}</p>
            </header>

            {/* Portfolio Content Area */}
            {currentProjects.length > 0 ? (
              /* Editorial Project Grid (ready for real projects when user adds them) */
              <div className={styles.projectGrid}>
                {currentProjects.map((project) => (
                  <article
                    key={project.id}
                    className={`${styles.projectCard} ${
                      project.featured ? styles.cardFeatured : ''
                    }`}
                    onClick={() => setActiveProject(project)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveProject(project);
                      }
                    }}
                  >
                    <div className={styles.cardVisualStage}>
                      {project.videoUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <video
                            src={project.videoUrl}
                            muted
                            playsInline
                            preload="metadata"
                            className={styles.projectThumbnail}
                            style={{ objectFit: 'cover' }}
                          />
                          <span className={styles.cardVideoTag}>▶ VIDEO</span>
                        </div>
                      ) : (
                        <img
                          src={project.thumbnail || '/creator.jpg'}
                          alt={project.title}
                          className={styles.projectThumbnail}
                          loading="lazy"
                        />
                      )}
                      <div className={styles.cardImageOverlay} />
                      <div className={styles.viewBadge}>VIEW ↗</div>
                      <div className={styles.cardTypeTag}>{project.genre || project.projectType || 'CINEMA'}</div>
                    </div>

                    <div className={styles.cardInfo}>
                      <div className={styles.cardMetaRow}>
                        <span className={styles.cardYear}>{project.year}</span>
                        <span className={styles.metaDivider}>•</span>
                        <span className={styles.cardClient}>{project.client}</span>
                      </div>

                      <h4 className={styles.cardTitle}>{project.title}</h4>
                      <p className={styles.cardRole}>{project.role}</p>
                      <p className={styles.cardShortDesc}>{project.shortDescription}</p>

                      {project.tools && (
                        <div className={styles.cardToolsRow}>
                          {project.tools.slice(0, 3).map((tool, idx) => (
                            <span key={idx} className={styles.toolPill}>
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              /* Clean Minimalist Empty Archive State — Zero Fake Data */
              <div className={styles.emptyArchiveStage}>
                <div className={styles.emptyCard}>
                  <div className={styles.emptyHeaderRow}>
                    <span className={styles.emptyGenreTag}>[{activeGenre?.id}] {activeGenre?.title}</span>
                    <span className={styles.emptyStatusPill}>EMPTY ARCHIVE</span>
                  </div>

                  <h3 className={styles.emptyHugeText}>ARCHIVE EMPTY</h3>
                  <p className={styles.emptySubtext}>
                    No projects published in this discipline yet. Real visual works, cinematography logs,
                    and editorial cuts will be indexed here.
                  </p>

                  <div className={styles.emptyDividerLine} />

                  <div className={styles.emptyFooterRow}>
                    <span className={styles.emptyFootMeta}>STATUS // READY FOR INGESTION</span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className={styles.uploadActionBtn}
                        onClick={() => setIsUploadModalOpen(true)}
                      >
                        <span className={styles.uploadPlusIcon}>+</span>
                        <span>UPLOAD VIDEO TO {activeGenre?.title}</span>
                      </button>
                      <button
                        type="button"
                        className={styles.emptyBackLink}
                        onClick={handleBackToAllWork}
                      >
                        ← RETURN TO ARCHIVE DIRECTORY
                      </button>
                    </div>
                  </div>

                  {/* Editorial Reticles */}
                  <span className={`${styles.cornerReticle} ${styles.reticleTL}`} />
                  <span className={`${styles.cornerReticle} ${styles.reticleBR}`} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =============================================================
         STATE 3: Full-Screen Project Detail Modal (For real projects)
         ============================================================= */}
      {activeProject && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label={`Project detail: ${activeProject.title}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveProject(null);
          }}
        >
          <div className={styles.modalContent}>
            {/* Modal Top Sticky Bar */}
            <div className={styles.modalTopBar}>
              <div className={styles.modalBreadcrumb}>
                <span className={styles.modalGenreTag}>
                  [{activeGenre?.id}] {activeGenre?.title}
                </span>
                <span className={styles.breadcrumbSlash}>//</span>
                <span className={styles.modalProjectTag}>{activeProject.title}</span>
              </div>

              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setActiveProject(null)}
                aria-label="Close project modal"
              >
                <span>CLOSE [ESC]</span>
                <span className={styles.closeCross}>✕</span>
              </button>
            </div>

            {/* Hero Visual or Private Video Stream */}
            <div className={styles.modalHeroVisual}>
              {activeProject.videoUrl ? (
                <div className={styles.videoPlayerContainer}>
                  <div className={styles.videoMetaBadge}>
                    <span className={styles.badgeDot} />
                    <span>PRIVATE SUPABASE STREAM</span>
                  </div>
                  <video
                    src={activeProject.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className={styles.modalVideoPlayer}
                    poster={activeProject.thumbnailUrl || activeProject.thumbnail}
                  >
                    Your browser does not support HTML5 video streaming.
                  </video>
                </div>
              ) : (
                <>
                  <img
                    src={activeProject.heroImage || activeProject.thumbnail || '/creator.jpg'}
                    alt={activeProject.title}
                    className={styles.modalHeroImage}
                  />
                  <div className={styles.modalHeroGradient} />
                </>
              )}
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              <div className={styles.modalHeaderBlock}>
                <span className={styles.modalYearBadge}>{activeProject.year}</span>
                <h3 className={styles.modalTitle}>{activeProject.title}</h3>
                <p className={styles.modalClientName}>
                  Client / Commission: <strong>{activeProject.client}</strong>
                </p>
              </div>

              <div className={styles.specGrid}>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>ROLE //</span>
                  <span className={styles.specValue}>{activeProject.role}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>TYPE //</span>
                  <span className={styles.specValue}>{activeProject.projectType}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>YEAR //</span>
                  <span className={styles.specValue}>{activeProject.year}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>GENRE //</span>
                  <span className={styles.specValue}>{activeGenre?.title}</span>
                </div>
              </div>

              {activeProject.fullDescription && (
                <div className={styles.modalNarrativeSection}>
                  <h4 className={styles.sectionSmallHeading}>DIRECTOR’S ARCHIVE LOG //</h4>
                  <p className={styles.modalFullDesc}>{activeProject.fullDescription}</p>
                </div>
              )}

              {activeProject.tools && activeProject.tools.length > 0 && (
                <div className={styles.modalToolsSection}>
                  <h4 className={styles.sectionSmallHeading}>TECHNICAL SPECIFICATIONS & GEAR //</h4>
                  <div className={styles.modalToolsList}>
                    {activeProject.tools.map((t, idx) => (
                      <span key={idx} className={styles.modalToolTag}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeProject.gallery && activeProject.gallery.length > 0 && (
                <div className={styles.modalGallerySection}>
                  <h4 className={styles.sectionSmallHeading}>PRODUCTION FRAMES //</h4>
                  <div className={styles.galleryGrid}>
                    {activeProject.gallery.map((imgUrl, idx) => (
                      <div key={idx} className={styles.galleryCard}>
                        <img
                          src={imgUrl}
                          alt={`${activeProject.title} frame ${idx + 1}`}
                          className={styles.galleryImage}
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeProject.credits && activeProject.credits.length > 0 && (
                <div className={styles.modalCreditsSection}>
                  <h4 className={styles.sectionSmallHeading}>CREDITS //</h4>
                  <div className={styles.creditsList}>
                    {activeProject.credits.map((credit, idx) => (
                      <div key={idx} className={styles.creditRow}>
                        <span className={styles.creditRole}>{credit.role}</span>
                        <span className={styles.creditDots} />
                        <span className={styles.creditName}>{credit.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.modalBottomBar}>
                <button
                  type="button"
                  className={styles.modalBottomCloseBtn}
                  onClick={() => setActiveProject(null)}
                >
                  <span>← BACK TO {activeGenre?.title || 'ARCHIVE'}</span>
                </button>

                {activeProject.id && (
                  <button
                    type="button"
                    className={styles.deleteProjectBtn}
                    onClick={() => handleDeleteProject(activeProject.id)}
                  >
                    <span>🗑 DELETE PROJECT</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Upload Modal for Private Supabase Video Ingestion */}
      <ProjectUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialGenreKey={activeGenreKey || 'cinema'}
        onProjectCreated={(newProject) => {
          setDbProjects((prev) => [newProject, ...prev]);
          if (activeGenreKey && (newProject.genre || '').toLowerCase() !== activeGenreKey.toLowerCase()) {
            setActiveGenreKey(newProject.genre);
          }
        }}
      />
    </section>
  );
};

export default Work;
