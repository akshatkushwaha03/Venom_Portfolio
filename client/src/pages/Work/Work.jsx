import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProjects } from '@/services/api';
import useInteractionLayer from '@/hooks/useInteractionLayer';
import { useLiquidTransition } from '@/components/common/LiquidTransition';
import styles from './Work.module.css';

// Helper to parse video embed links (YouTube / Vimeo / Direct MP4)
const parseMediaSource = (url) => {
  if (!url) return { type: 'none', src: '' };

  // YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0` };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&title=0&byline=0&portrait=0` };
  }

  // Direct MP4 / WebM or Supabase storage link
  return { type: 'video', src: url };
};

export const Work = ({ id = 'work', actionLink = null, isPreview = false }) => {
  useInteractionLayer();
  const { navigateWithLiquid } = useLiquidTransition();

  const { categoryName } = useParams();
  const navigate = useNavigate();

  const handleBack = (e) => {
    const origin = e && typeof e.clientX === 'number' ? { x: e.clientX, y: e.clientY } : null;
    if (window.history.state && window.history.state.idx > 0) {
      navigateWithLiquid(-1, { origin });
    } else {
      navigateWithLiquid('/', { origin });
    }
  };

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoProject, setActiveVideoProject] = useState(null);

  // Fetch all projects dynamically from server API
  useEffect(() => {
    fetchServerProjects();
  }, []);

  const fetchServerProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[WORK PAGE] Failed to fetch server projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Derive categories strictly from server database projects
  const categoriesList = useMemo(() => {
    if (!projects || projects.length === 0) return [];

    const dbCategoryNames = Array.from(new Set(projects.map((p) => p.category || 'General')));

    return dbCategoryNames.map((catName, idx) => {
      const categoryProjects = projects.filter(
        (p) => (p.category || 'General').toLowerCase() === catName.toLowerCase()
      );

      return {
        id: idx < 9 ? `0${idx + 1}` : `${idx + 1}`,
        name: catName,
        discipline: `${catName.toUpperCase()} ARCHIVE`,
        description: `Collection of ${categoryProjects.length} ${
          categoryProjects.length === 1 ? 'project' : 'projects'
        } published under ${catName}.`,
        projectCount: categoryProjects.length,
      };
    });
  }, [projects]);

  // Decode selected category name from route params
  const decodedCategory = categoryName ? decodeURIComponent(categoryName) : null;

  // Filter projects by active category for Stage 2
  const categoryProjects = useMemo(() => {
    if (!decodedCategory) return [];
    return projects.filter(
      (p) => (p.category || 'General').toLowerCase() === decodedCategory.toLowerCase()
    );
  }, [projects, decodedCategory]);

  // Active Category metadata object
  const currentCategoryMeta = useMemo(() => {
    if (!decodedCategory) return null;
    return categoriesList.find((c) => c.name.toLowerCase() === decodedCategory.toLowerCase()) || {
      id: '01',
      name: decodedCategory,
      discipline: `${decodedCategory.toUpperCase()} ARCHIVE`,
      description: `Collection of projects under ${decodedCategory}.`,
      projectCount: categoryProjects.length,
    };
  }, [decodedCategory, categoriesList, categoryProjects]);

  return (
    <section
      id={id}
      className={`${styles.workSection} ${isPreview ? styles.workSectionPreview : ''}`}
      aria-label="Portfolio Work Archive"
    >
      <div className={styles.grainOverlay} aria-hidden="true" />

      <div className={styles.container}>
        {/* =================================================================
           STAGE 1: CATEGORIES DIRECTORY (When no category is selected)
           ================================================================= */}
        {!decodedCategory ? (
          <div className={styles.stageDirectory}>
            <div className={styles.topActionRow}>
              <div className={styles.headerTagRow}>
                <span className={styles.slashAccent}>//</span>
                <span className={styles.headerIndex}>02 WORK</span>
              </div>
              {isPreview ? (
                actionLink && (
                  <Link
                    to={actionLink}
                    className={styles.sectionIconBtn}
                    title="Open Full Work Archive"
                    aria-label="Open Full Work Archive"
                    data-magnetic
                  >
                    <span>VIEW ARCHIVE</span>
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
            <header className={styles.headerBlock}>
              <span className={styles.headerTag}>// VENOM STUDIOS // LIVE ARCHIVE</span>
              <h1 className={styles.mainHeading} data-kinetic>
                WORK CATEGORIES
              </h1>
              <p className={styles.mainDesc}>
                Select a category below to view all published videos, commercial work, and edits.
              </p>
            </header>

            {loading ? (
              <div className={styles.loadingBox}>
                <div className={styles.spinner} />
                <p>Loading live portfolio categories from server...</p>
              </div>
            ) : categoriesList.length > 0 ? (
              <div className={styles.categoriesGrid}>
                {categoriesList.map((cat) => (
                  <div
                    key={cat.name}
                    className={styles.categoryCard}
                    data-tilt
                    data-magnetic
                    onClick={(e) => navigateWithLiquid(`/work/${encodeURIComponent(cat.name)}`, { origin: { x: e.clientX, y: e.clientY } })}
                  >
                    <div className={styles.catCardTop}>
                      <span className={styles.catIndex}>[{cat.id}]</span>
                      <span className={styles.catCountBadge}>
                        {cat.projectCount} {cat.projectCount === 1 ? 'PROJECT' : 'PROJECTS'}
                      </span>
                    </div>

                    <div className={styles.catCardBody}>
                      <span className={styles.catDiscipline}>{cat.discipline}</span>
                      <h2 className={styles.catTitle}>{cat.name}</h2>
                      <p className={styles.catDesc}>{cat.description}</p>
                    </div>

                    <div className={styles.catCardFooter}>
                      <span className={styles.exploreLink}>EXPLORE CATEGORY →</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Zero Database Projects State */
              <div className={styles.emptyBox}>
                <h3>NO PUBLISHED PROJECTS IN DATABASE</h3>
                <p>There are no projects in the database yet. Use the Admin Dashboard to upload and publish your first project.</p>
                <div className={styles.emptyActionRow}>
                  <Link to="/admin" className={styles.adminBtn}>
                    + ADD PROJECT IN ADMIN DASHBOARD →
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =================================================================
             STAGE 2: CATEGORY PROJECTS GRID (When category is clicked)
             ================================================================= */
          <div className={styles.stageCategoryView}>
            {/* Navigation back bar */}
            <div className={styles.navBar}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={(e) => navigateWithLiquid('/work', { origin: { x: e.clientX, y: e.clientY } })}
              >
                <span className={styles.backArrow}>←</span> ALL CATEGORIES
              </button>

              <span className={styles.breadCrumb}>
                WORK // <strong style={{ color: '#14b8a6' }}>{currentCategoryMeta?.name}</strong>
              </span>
            </div>

            {/* Category Banner */}
            <header className={styles.categoryHeader}>
              <span className={styles.categoryTag}>[{currentCategoryMeta?.id}] {currentCategoryMeta?.discipline}</span>
              <h1 className={styles.categoryTitle}>{currentCategoryMeta?.name}</h1>
              <p className={styles.categoryDesc}>{currentCategoryMeta?.description}</p>
            </header>

            {/* Projects Grid */}
            {loading ? (
              <div className={styles.loadingBox}>
                <div className={styles.spinner} />
                <p>Fetching projects for {currentCategoryMeta?.name}...</p>
              </div>
            ) : categoryProjects.length > 0 ? (
              <div className={styles.projectsGrid}>
                {categoryProjects.map((project) => (
                  <article
                    key={project.id}
                    className={styles.projectCard}
                    data-tilt
                    onClick={() => setActiveVideoProject(project)}
                  >
                    <div className={styles.thumbnailStage}>
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt="Project thumbnail"
                          className={styles.thumbnailImg}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.placeholderStage}>
                          <span className={styles.playIconLarge}>▶</span>
                          <span>WATCH FILM</span>
                        </div>
                      )}

                      <div className={styles.stageOverlay}>
                        <button type="button" className={styles.playBadgeBtn}>
                          ▶ PLAY VIDEO
                        </button>
                      </div>
                    </div>

                    <div className={styles.projectInfo}>
                      <div className={styles.projectMetaRow}>
                        <span className={styles.catPill}>{project.category}</span>
                        <span className={styles.dateBadge}>
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className={styles.projectDesc}>{project.description}</p>

                      <div className={styles.projectActionRow}>
                        <span className={styles.watchText}>CLICK TO PLAY ↗</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              /* Empty Category State */
              <div className={styles.emptyBox}>
                <h3>NO PROJECTS IN THIS CATEGORY</h3>
                <p>Add video projects for <strong>{currentCategoryMeta?.name}</strong> from your Admin Dashboard.</p>
                <div className={styles.emptyActionRow}>
                  <Link to="/admin" className={styles.adminBtn}>
                    + ADD PROJECT IN ADMIN DASHBOARD →
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => navigateWithLiquid('/work', { origin: { x: e.clientX, y: e.clientY } })}
                    className={styles.backLinkBtn}
                  >
                    ← VIEW OTHER CATEGORIES
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =================================================================
         CINEMA VIDEO PLAYER MODAL
         ================================================================= */}
      {activeVideoProject && (
        <div
          className={styles.modalOverlay}
          onClick={() => setActiveVideoProject(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleBlock}>
                <span className={styles.modalCatTag}>[{activeVideoProject.category}]</span>
                <h3 className={styles.modalTitle}>{activeVideoProject.description}</h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideoProject(null)}
                className={styles.modalCloseBtn}
                aria-label="Close Video Player"
              >
                <span>CLOSE [ESC]</span>
                <span className={styles.closeX}>✕</span>
              </button>
            </div>

            {/* Video Stage */}
            <div className={styles.videoContainer}>
              {(() => {
                const source = parseMediaSource(activeVideoProject.url);
                if (source.type === 'iframe') {
                  return (
                    <iframe
                      src={source.src}
                      title={activeVideoProject.description}
                      className={styles.iframePlayer}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }

                return (
                  <video
                    src={activeVideoProject.url}
                    controls
                    autoPlay
                    playsInline
                    className={styles.htmlVideoPlayer}
                    poster={activeVideoProject.thumbnailUrl}
                  >
                    Your browser does not support HTML5 video streaming.
                  </video>
                );
              })()}
            </div>

            <div className={styles.modalFooter}>
              <p className={styles.modalDesc}>{activeVideoProject.description}</p>
              <div className={styles.modalActionRow}>
                <a
                  href={activeVideoProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLinkBtn}
                >
                  OPEN ORIGINAL SOURCE ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Work;
