import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProjects, reorderProjects, getAuthToken } from '@/services/api';
import useInteractionLayer from '@/hooks/useInteractionLayer';
import styles from './Work.module.css';

// Helper to transform Google Drive / YouTube image URLs into embeddable thumbnail URLs
export const formatImageSrc = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Match all Google Drive link variations
  const gdriveMatch = trimmed.match(
    /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=|thumbnail\?id=)|lh3\.googleusercontent\.com\/d\/)([\w-]+)/
  );
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w1000`;
  }

  // Handle YouTube links pasted as thumbnails
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  return trimmed;
};

// Helper to parse video embed links (Google Drive / YouTube / Vimeo / Direct MP4)
const parseMediaSource = (url) => {
  if (!url) return { type: 'none', src: '' };

  // Google Drive Video
  const gdriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return { type: 'iframe', src: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview` };
  }

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

  // Direct MP4 / WebM video link
  return { type: 'video', src: url };
};

export const Work = ({ id = 'work', actionLink = null, isPreview = false }) => {
  useInteractionLayer();

  const { categoryName } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoProject, setActiveVideoProject] = useState(null);

  // Video Reordering States
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [orderedCategoryProjects, setOrderedCategoryProjects] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

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
      const catProjects = projects.filter(
        (p) => (p.category || 'General').toLowerCase() === catName.toLowerCase()
      );

      return {
        id: idx < 9 ? `0${idx + 1}` : `${idx + 1}`,
        name: catName,
        discipline: `${catName.toUpperCase()} ARCHIVE`,
        description: `Collection of ${catProjects.length} ${
          catProjects.length === 1 ? 'project' : 'projects'
        } published under ${catName}.`,
        projectCount: catProjects.length,
      };
    });
  }, [projects]);

  // Decode selected category name from route params
  const decodedCategory = categoryName ? decodeURIComponent(categoryName) : null;

  // Filter projects by active category for Stage 2, preserving order
  const categoryProjects = useMemo(() => {
    if (!decodedCategory) return [];
    return projects
      .filter(
        (p) => (p.category || 'General').toLowerCase() === decodedCategory.toLowerCase()
      )
      .sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [projects, decodedCategory]);

  // Handle entering reorder mode
  const handleStartReorder = () => {
    const isAuth = Boolean(getAuthToken());
    if (isAuth) {
      setOrderedCategoryProjects([...categoryProjects]);
      setIsReorderMode(true);
    } else {
      navigate('/admin');
    }
  };

  const handleCancelReorder = () => {
    setOrderedCategoryProjects([]);
    setIsReorderMode(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveProject = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= orderedCategoryProjects.length) return;
    const updated = [...orderedCategoryProjects];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setOrderedCategoryProjects(updated);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    moveProject(draggedIndex, targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveOrder = async () => {
    try {
      setIsSavingOrder(true);
      const orderedIds = orderedCategoryProjects.map((p) => p.id);
      await reorderProjects(orderedIds);

      // Persist the updated sequence in local projects state
      const orderMap = new Map();
      orderedIds.forEach((id, idx) => orderMap.set(id, idx));

      setProjects((prev) =>
        prev.map((p) => {
          if (orderMap.has(p.id)) {
            return { ...p, order: orderMap.get(p.id) };
          }
          return p;
        })
      );

      setIsReorderMode(false);
      setOrderedCategoryProjects([]);
      showToast('Video sequence saved! Visitors will now see this order.');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to save order', 'error');
    } finally {
      setIsSavingOrder(false);
    }
  };

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
                    onClick={() => navigate(`/work/${encodeURIComponent(cat.name)}`)}
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
                onClick={() => {
                  if (isReorderMode) handleCancelReorder();
                  navigate('/work');
                }}
              >
                <span className={styles.backArrow}>←</span> ALL CATEGORIES
              </button>

              <span className={styles.breadCrumb}>
                WORK // <strong style={{ color: '#14b8a6' }}>{currentCategoryMeta?.name}</strong>
              </span>

              {/* REORDER BUTTON (Available whenever category has projects) */}
              {categoryProjects.length > 0 && !isReorderMode && (
                <button
                  type="button"
                  onClick={handleStartReorder}
                  className={styles.reorderToggleBtn}
                  title="Arrange videos according to your preference in this category"
                >
                  <span className={styles.reorderIcon}>⇄</span>
                  <span>REORDER VIDEOS</span>
                  <span className={styles.adminMiniBadge}>ADMIN</span>
                </button>
              )}
            </div>

            {/* Sticky Reorder Control Bar (when Reorder Mode is active) */}
            {isReorderMode && (
              <div className={styles.reorderStickyBar}>
                <div className={styles.reorderInfo}>
                  <div className={styles.reorderStatusRow}>
                    <span className={styles.livePulseDot} />
                    <span className={styles.reorderHeading}>REORDER MODE ACTIVE</span>
                    <span className={styles.reorderCountBadge}>
                      {orderedCategoryProjects.length} VIDEOS
                    </span>
                  </div>
                  <p className={styles.reorderHint}>
                    Drag items or use the ▲ / ▼ buttons to rearrange the sequence. Visitors will see this exact order.
                  </p>
                </div>

                <div className={styles.reorderActions}>
                  <button
                    type="button"
                    onClick={handleCancelReorder}
                    className={styles.cancelReorderBtn}
                    disabled={isSavingOrder}
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOrder}
                    className={styles.saveReorderBtn}
                    disabled={isSavingOrder}
                  >
                    {isSavingOrder ? 'SAVING...' : '✓ SAVE NEW ORDER'}
                  </button>
                </div>
              </div>
            )}

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
            ) : (isReorderMode ? orderedCategoryProjects : categoryProjects).length > 0 ? (
              <div className={styles.projectsGrid}>
                {(isReorderMode ? orderedCategoryProjects : categoryProjects).map((project, index) => (
                  <article
                    key={project.id}
                    className={`${styles.projectCard} ${isReorderMode ? styles.projectCardReorderable : ''} ${
                      draggedIndex === index ? styles.cardDragging : ''
                    } ${dragOverIndex === index ? styles.cardDragOver : ''}`}
                    draggable={isReorderMode}
                    onDragStart={isReorderMode ? (e) => handleDragStart(e, index) : undefined}
                    onDragOver={isReorderMode ? (e) => handleDragOver(e, index) : undefined}
                    onDrop={isReorderMode ? (e) => handleDrop(e, index) : undefined}
                    onDragEnd={isReorderMode ? handleDragEnd : undefined}
                    data-tilt={!isReorderMode}
                    onClick={!isReorderMode ? () => setActiveVideoProject(project) : undefined}
                  >
                    {isReorderMode && (
                      <div className={styles.reorderControlHeader}>
                        <div className={styles.reorderIndexBadge}>
                          <span className={styles.dragHandleIcon} title="Drag to rearrange">⠿</span>
                          <span className={styles.indexNum}>#{index + 1}</span>
                        </div>
                        <div className={styles.shiftButtonGroup}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveProject(index, index - 1);
                            }}
                            disabled={index === 0}
                            className={styles.shiftBtn}
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveProject(index, index + 1);
                            }}
                            disabled={index === orderedCategoryProjects.length - 1}
                            className={styles.shiftBtn}
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={styles.thumbnailStage}>
                      {project.thumbnailUrl ? (
                        <img
                          src={formatImageSrc(project.thumbnailUrl)}
                          alt="Project thumbnail"
                          className={styles.thumbnailImg}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const ph = e.target.parentElement?.querySelector(`.${styles.placeholderStage}`);
                            if (ph) ph.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={styles.placeholderStage}
                        style={{ display: project.thumbnailUrl ? 'none' : 'flex' }}
                      >
                        <span className={styles.playIconLarge}>▶</span>
                        <span>WATCH FILM</span>
                      </div>

                      {!isReorderMode && (
                        <div className={styles.stageOverlay}>
                          <button type="button" className={styles.playBadgeBtn}>
                            ▶ PLAY VIDEO
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={styles.projectInfo}>
                      <div className={styles.projectMetaRow}>
                        <span className={styles.catPill}>{project.category}</span>
                        <span className={styles.dateBadge}>
                          {isReorderMode ? `POSITION #${index + 1}` : new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {project.description && (
                        <p className={styles.projectDesc}>{project.description}</p>
                      )}

                      <div className={styles.projectActionRow}>
                        <span className={styles.watchText}>
                          {isReorderMode ? 'DRAG OR USE ▲ ▼ TO MOVE' : 'CLICK TO PLAY ↗'}
                        </span>
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
                    onClick={() => navigate('/work')}
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
                <h3 className={styles.modalTitle}>
                  {activeVideoProject.description || activeVideoProject.category || 'Featured Project'}
                </h3>
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
                    <>
                      <iframe
                        src={source.src}
                        title={activeVideoProject.description || activeVideoProject.category || 'Project Video'}
                        className={styles.iframePlayer}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                      <div className={styles.iframeTopShield} aria-hidden="true" />
                    </>
                  );
                }

                return (
                  <video
                    src={activeVideoProject.url}
                    controls
                    autoPlay
                    playsInline
                    className={styles.htmlVideoPlayer}
                    poster={formatImageSrc(activeVideoProject.thumbnailUrl)}
                  >
                    Your browser does not support HTML5 video streaming.
                  </video>
                );
              })()}
            </div>

            {activeVideoProject.description && (
              <div className={styles.modalFooter}>
                <p className={styles.modalDesc}>{activeVideoProject.description}</p>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`${styles.toast} ${
            toastMessage.type === 'error' ? styles.toastError : styles.toastSuccess
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}
    </section>
  );
};

export default Work;
