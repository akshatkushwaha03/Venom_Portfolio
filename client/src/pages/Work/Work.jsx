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

  // Handle YouTube links pasted as thumbnails (including /shorts/)
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
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

  // YouTube & Shorts
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
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


/**
 * Rearranges and packs video projects into balanced, full-width mosaic rows
 * strictly adhering to 16:9 and 9:16 aspect ratios matching the reference layout.
 * Every row fills 100% width with equal heights across items in that row:
 * - Duo Landscape: 2 items (16:9), 50% width each (Row 3 of reference image)
 * - Mixed Trio: [Portrait (9:16), Landscape (16:9), Portrait (9:16)] (Row 1 of reference image)
 * - Trio Portrait: 3 items (9:16), 33.33% width each (Row 4 of reference image)
 * - Quartet Portrait: 4 items (9:16), 25% width each
 * - Mixed Pair: [Landscape (16:9), Portrait (9:16)]
 * - Duo Portrait: 2 items (9:16), 50% width each
 * - Solo Landscape: 1 item (16:9), 100% width cinematic banner
 * - Solo Portrait: 1 item (9:16), centered reel
 */
export const packIntoZeroGapRows = (projectsList, getOrientation) => {
  if (!projectsList || projectsList.length === 0) return [];

  const rows = [];
  const landscapes = [];
  const portraits = [];

  projectsList.forEach((p) => {
    if (getOrientation(p) === 'landscape') {
      landscapes.push(p);
    } else {
      portraits.push(p);
    }
  });

  let lIdx = 0;
  let pIdx = 0;

  while (lIdx < landscapes.length || pIdx < portraits.length) {
    const lRem = landscapes.length - lIdx;
    const pRem = portraits.length - pIdx;
    const rowIndex = rows.length;

    // =========================================================================
    // CASE A: PURE PORTRAIT STREAM (e.g. Model Shoots, Reels category)
    // Irregular Dynamic Partition: Alternates 6, 4, 5, 6, 5, 4 to avoid repetitive
    // uniform rows while keeping cards sleek and compact (no oversized cards).
    // =========================================================================
    if (lRem === 0 && pRem > 0) {
      let take = 5;
      if (pRem >= 12) {
        const rhythm = [6, 4, 5, 6, 5, 4];
        const candidate = rhythm[rowIndex % rhythm.length];
        const remAfter = pRem - candidate;
        if (remAfter === 0 || remAfter >= 4) {
          take = candidate;
        } else if (pRem - 6 >= 4) {
          take = 6;
        } else if (pRem - 5 >= 4) {
          take = 5;
        } else {
          take = 4;
        }
      } else if (pRem === 11) {
        take = 6; // 6 then 5
      } else if (pRem === 10) {
        take = rowIndex % 2 === 0 ? 6 : 5; // 6 then 4, or 5 then 5
      } else if (pRem === 9) {
        take = 5; // 5 then 4
      } else if (pRem === 8) {
        take = 4; // 4 then 4
      } else if (pRem === 7) {
        take = 4; // 4 then 3 compact
      } else if (pRem === 6) {
        take = 6;
      } else if (pRem === 5) {
        take = 5;
      } else if (pRem === 4) {
        take = 4;
      } else {
        take = pRem; // 3, 2, or 1 -> compact centered
      }

      if (take === 6) {
        const items = [];
        for (let i = 0; i < 6; i++) {
          items.push({ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 });
        }
        rows.push({ id: `row-${rowIndex}`, pattern: 'hexad-portrait', items });
        continue;
      } else if (take === 5) {
        const items = [];
        for (let i = 0; i < 5; i++) {
          items.push({ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 });
        }
        rows.push({ id: `row-${rowIndex}`, pattern: 'pentet-portrait', items });
        continue;
      } else if (take === 4) {
        const items = [];
        for (let i = 0; i < 4; i++) {
          items.push({ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 });
        }
        rows.push({ id: `row-${rowIndex}`, pattern: 'quartet-portrait', items });
        continue;
      } else if (take === 3) {
        const items = [];
        for (let i = 0; i < 3; i++) {
          items.push({ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 });
        }
        rows.push({ id: `row-${rowIndex}`, pattern: 'trio-portrait-compact', items });
        continue;
      } else if (take === 2) {
        const items = [];
        for (let i = 0; i < 2; i++) {
          items.push({ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 });
        }
        rows.push({ id: `row-${rowIndex}`, pattern: 'duo-portrait-compact', items });
        continue;
      } else if (take === 1) {
        rows.push({
          id: `row-${rowIndex}`,
          pattern: 'solo-portrait-compact',
          items: [{ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 }],
        });
        continue;
      }
    }

    // =========================================================================
    // CASE B: PURE LANDSCAPE STREAM (e.g. Cinema widescreen category)
    // Compact rows of 4 or 5 widescreen items
    // =========================================================================
    if (pRem === 0 && lRem > 0) {
      if (lRem >= 5 && (rowIndex % 3 === 0 || lRem === 5)) {
        const items = [];
        for (let i = 0; i < 5; i++) {
          items.push({ project: landscapes[lIdx++], orientation: 'landscape', flexGrow: 1 });
        }
        rows.push({ id: `row-${rowIndex}`, pattern: 'pentet-landscape', items });
        continue;
      }
      if (lRem >= 4) {
        const items = [];
        for (let i = 0; i < 4; i++) {
          items.push({ project: landscapes[lIdx++], orientation: 'landscape', flexGrow: 1 });
        }
        rows.push({ id: `row-${rowIndex}`, pattern: 'quartet-landscape', items });
        continue;
      }
      if (lRem === 3) {
        const items = [];
        for (let i = 0; i < 3; i++) {
          items.push({ project: landscapes[lIdx++], orientation: 'landscape', flexGrow: 1 });
        }
        rows.push({ id: `row-${rowIndex}`, pattern: 'trio-landscape-compact', items });
        continue;
      }
      if (lRem === 2) {
        const items = [];
        for (let i = 0; i < 2; i++) {
          items.push({ project: landscapes[lIdx++], orientation: 'landscape', flexGrow: 1 });
        }
        rows.push({ id: `row-${rowIndex}`, pattern: 'duo-landscape-compact', items });
        continue;
      }
      if (lRem === 1) {
        rows.push({
          id: `row-${rowIndex}`,
          pattern: 'solo-landscape-compact',
          items: [{ project: landscapes[lIdx++], orientation: 'landscape', flexGrow: 1 }],
        });
        continue;
      }
    }

    // =========================================================================
    // CASE C: MIXED STREAM (Landscapes + Portraits in "All Projects" or mixed cats)
    // Proportional flex values ensure zero height distortion:
    // flexGrow: 3.1605 for 16:9 Landscape, 1 for 9:16 Portrait
    // =========================================================================

    // 1. Mixed Hexad (6 Cards: 1 Landscape + 5 Portraits: [P, P, L, P, P, P])
    if (lRem >= 1 && pRem >= 5 && rowIndex % 4 === 0) {
      const p1 = portraits[pIdx++];
      const p2 = portraits[pIdx++];
      const l1 = landscapes[lIdx++];
      const p3 = portraits[pIdx++];
      const p4 = portraits[pIdx++];
      const p5 = portraits[pIdx++];
      rows.push({
        id: `row-${rowIndex}`,
        pattern: 'mixed-hexad-1l-5p',
        items: [
          { project: p1, orientation: 'portrait', flexGrow: 1 },
          { project: p2, orientation: 'portrait', flexGrow: 1 },
          { project: l1, orientation: 'landscape', flexGrow: 3.1605 },
          { project: p3, orientation: 'portrait', flexGrow: 1 },
          { project: p4, orientation: 'portrait', flexGrow: 1 },
          { project: p5, orientation: 'portrait', flexGrow: 1 },
        ],
      });
      continue;
    }

    // 2. Mixed Quintet Double (5 Cards: 2 Landscapes + 3 Portraits: [L, P, P, P, L])
    if (lRem >= 2 && pRem >= 3 && rowIndex % 4 === 1) {
      const l1 = landscapes[lIdx++];
      const p1 = portraits[pIdx++];
      const p2 = portraits[pIdx++];
      const p3 = portraits[pIdx++];
      const l2 = landscapes[lIdx++];
      rows.push({
        id: `row-${rowIndex}`,
        pattern: 'mixed-quint-2l-3p',
        items: [
          { project: l1, orientation: 'landscape', flexGrow: 3.1605 },
          { project: p1, orientation: 'portrait', flexGrow: 1 },
          { project: p2, orientation: 'portrait', flexGrow: 1 },
          { project: p3, orientation: 'portrait', flexGrow: 1 },
          { project: l2, orientation: 'landscape', flexGrow: 3.1605 },
        ],
      });
      continue;
    }

    // 3. Mixed Quintet (5 Cards: 1 Landscape + 4 Portraits: [P, P, L, P, P])
    if (lRem >= 1 && pRem >= 4 && rowIndex % 3 !== 2) {
      const p1 = portraits[pIdx++];
      const p2 = portraits[pIdx++];
      const l1 = landscapes[lIdx++];
      const p3 = portraits[pIdx++];
      const p4 = portraits[pIdx++];
      rows.push({
        id: `row-${rowIndex}`,
        pattern: 'mixed-quint-1l-4p',
        items: [
          { project: p1, orientation: 'portrait', flexGrow: 1 },
          { project: p2, orientation: 'portrait', flexGrow: 1 },
          { project: l1, orientation: 'landscape', flexGrow: 3.1605 },
          { project: p3, orientation: 'portrait', flexGrow: 1 },
          { project: p4, orientation: 'portrait', flexGrow: 1 },
        ],
      });
      continue;
    }

    // 4. Mixed Quad (4 Cards: 2 Landscapes + 2 Portraits: [L, P, P, L])
    if (lRem >= 2 && pRem >= 2 && rowIndex % 2 === 1) {
      const l1 = landscapes[lIdx++];
      const p1 = portraits[pIdx++];
      const p2 = portraits[pIdx++];
      const l2 = landscapes[lIdx++];
      rows.push({
        id: `row-${rowIndex}`,
        pattern: 'mixed-quad-2l-2p',
        items: [
          { project: l1, orientation: 'landscape', flexGrow: 3.1605 },
          { project: p1, orientation: 'portrait', flexGrow: 1 },
          { project: p2, orientation: 'portrait', flexGrow: 1 },
          { project: l2, orientation: 'landscape', flexGrow: 3.1605 },
        ],
      });
      continue;
    }

    // 5. Mixed Quad (4 Cards: 1 Landscape + 3 Portraits: [P, L, P, P])
    if (lRem >= 1 && pRem >= 3) {
      const p1 = portraits[pIdx++];
      const l1 = landscapes[lIdx++];
      const p2 = portraits[pIdx++];
      const p3 = portraits[pIdx++];
      rows.push({
        id: `row-${rowIndex}`,
        pattern: 'mixed-quad-1l-3p',
        items: [
          { project: p1, orientation: 'portrait', flexGrow: 1 },
          { project: l1, orientation: 'landscape', flexGrow: 3.1605 },
          { project: p2, orientation: 'portrait', flexGrow: 1 },
          { project: p3, orientation: 'portrait', flexGrow: 1 },
        ],
      });
      continue;
    }

    // 6. Hexad Portraits (6 Cards)
    if (pRem >= 6) {
      const items = [];
      for (let i = 0; i < 6; i++) {
        items.push({ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 });
      }
      rows.push({ id: `row-${rowIndex}`, pattern: 'hexad-portrait', items });
      continue;
    }

    // 7. Pentet Portraits (5 Cards)
    if (pRem >= 5) {
      const items = [];
      for (let i = 0; i < 5; i++) {
        items.push({ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 });
      }
      rows.push({ id: `row-${rowIndex}`, pattern: 'pentet-portrait', items });
      continue;
    }

    // 8. Quartet Portraits (4 Cards)
    if (pRem >= 4) {
      const items = [];
      for (let i = 0; i < 4; i++) {
        items.push({ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 });
      }
      rows.push({ id: `row-${rowIndex}`, pattern: 'quartet-portrait', items });
      continue;
    }

    // 9. Quartet Landscapes (4 Cards)
    if (lRem >= 4) {
      const items = [];
      for (let i = 0; i < 4; i++) {
        items.push({ project: landscapes[lIdx++], orientation: 'landscape', flexGrow: 1 });
      }
      rows.push({ id: `row-${rowIndex}`, pattern: 'quartet-landscape', items });
      continue;
    }

    // 10. Mixed Trio Compact (1 Landscape + 2 Portraits: [P, L, P])
    if (lRem >= 1 && pRem >= 2) {
      const p1 = portraits[pIdx++];
      const l1 = landscapes[lIdx++];
      const p2 = portraits[pIdx++];
      rows.push({
        id: `row-${rowIndex}`,
        pattern: 'mixed-trio-compact',
        items: [
          { project: p1, orientation: 'portrait', flexGrow: 1 },
          { project: l1, orientation: 'landscape', flexGrow: 3.1605 },
          { project: p2, orientation: 'portrait', flexGrow: 1 },
        ],
      });
      continue;
    }

    // 11. Trio Landscapes Compact (3 Cards)
    if (lRem >= 3) {
      const items = [];
      for (let i = 0; i < 3; i++) {
        items.push({ project: landscapes[lIdx++], orientation: 'landscape', flexGrow: 1 });
      }
      rows.push({ id: `row-${rowIndex}`, pattern: 'trio-landscape-compact', items });
      continue;
    }

    // 12. Trio Portraits Compact (3 Cards)
    if (pRem >= 3) {
      const items = [];
      for (let i = 0; i < 3; i++) {
        items.push({ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 });
      }
      rows.push({ id: `row-${rowIndex}`, pattern: 'trio-portrait-compact', items });
      continue;
    }

    // 13. Mixed Pair Compact (1 Landscape + 1 Portrait)
    if (lRem >= 1 && pRem >= 1) {
      const l1 = landscapes[lIdx++];
      const p1 = portraits[pIdx++];
      rows.push({
        id: `row-${rowIndex}`,
        pattern: 'mixed-pair-compact',
        items: [
          { project: l1, orientation: 'landscape', flexGrow: 3.1605 },
          { project: p1, orientation: 'portrait', flexGrow: 1 },
        ],
      });
      continue;
    }

    // 14. Duo Landscapes Compact (2 Cards)
    if (lRem >= 2) {
      const items = [];
      for (let i = 0; i < 2; i++) {
        items.push({ project: landscapes[lIdx++], orientation: 'landscape', flexGrow: 1 });
      }
      rows.push({ id: `row-${rowIndex}`, pattern: 'duo-landscape-compact', items });
      continue;
    }

    // 15. Duo Portraits Compact (2 Cards)
    if (pRem >= 2) {
      const items = [];
      for (let i = 0; i < 2; i++) {
        items.push({ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 });
      }
      rows.push({ id: `row-${rowIndex}`, pattern: 'duo-portrait-compact', items });
      continue;
    }

    // 16. Solo Landscape Compact (1 Card)
    if (lRem === 1) {
      rows.push({
        id: `row-${rowIndex}`,
        pattern: 'solo-landscape-compact',
        items: [{ project: landscapes[lIdx++], orientation: 'landscape', flexGrow: 1 }],
      });
      continue;
    }

    // 17. Solo Portrait Compact (1 Card)
    if (pRem === 1) {
      rows.push({
        id: `row-${rowIndex}`,
        pattern: 'solo-portrait-compact',
        items: [{ project: portraits[pIdx++], orientation: 'portrait', flexGrow: 1 }],
      });
      continue;
    }
  }

  return rows;
};

const getRowStyleClass = (pattern) => {
  switch (pattern) {
    case 'hexad-portrait':
      return styles.rowHexadPortrait;
    case 'mixed-hexad-1l-5p':
      return styles.rowMixedHexad1L5P;
    case 'mixed-quint-1l-4p':
      return styles.rowMixedQuint1L4P;
    case 'mixed-quint-2l-3p':
      return styles.rowMixedQuint2L3P;
    case 'pentet-portrait':
      return styles.rowPentetPortrait;
    case 'pentet-landscape':
      return styles.rowPentetLandscape;
    case 'quartet-portrait':
      return styles.rowQuartetPortrait;
    case 'quartet-landscape':
      return styles.rowQuartetLandscape;
    case 'mixed-quad-1l-3p':
      return styles.rowMixedQuad1L3P;
    case 'mixed-quad-2l-2p':
      return styles.rowMixedQuad2L2P;
    case 'mixed-trio-compact':
      return styles.rowMixedTrioCompact;
    case 'trio-landscape-compact':
      return styles.rowTrioLandscapeCompact;
    case 'trio-portrait-compact':
      return styles.rowTrioPortraitCompact;
    case 'duo-landscape-compact':
      return styles.rowDuoLandscapeCompact;
    case 'duo-portrait-compact':
      return styles.rowDuoPortraitCompact;
    case 'mixed-pair-compact':
      return styles.rowMixedPairCompact;
    case 'solo-landscape-compact':
      return styles.rowSoloLandscapeCompact;
    case 'solo-portrait-compact':
      return styles.rowSoloPortraitCompact;
    default:
      return '';
  }
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

  // Dynamic Thumbnail Dimension & Orientation Tracking (Portrait vs Landscape)
  const [projectAspectRatios, setProjectAspectRatios] = useState({});
  const [projectOrientations, setProjectOrientations] = useState({});

  // 3D Card Interactive Pop & Tilt Dynamics on Video Hover
  const handleCardMouseEnter = (e) => {
    if (isReorderMode) return;
    const card = e.currentTarget;
    card.style.transition = 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease';
  };

  const handleCardMouseMove = (e) => {
    if (isReorderMode) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    // Snappy, tactile 3D pop & tilt towards cursor
    const tiltX = -normY * 9;
    const tiltY = normX * 9;

    card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translate3d(0, -8px, 22px) scale3d(1.025, 1.025, 1.025)`;
  };

  const handleCardMouseLeave = (e) => {
    if (isReorderMode) return;
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0) scale3d(1, 1, 1)';
    card.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease';
  };

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
    const isAll =
      decodedCategory.toLowerCase() === 'all' ||
      decodedCategory.toLowerCase() === 'all projects' ||
      decodedCategory.toLowerCase() === 'all videos';

    return projects
      .filter((p) => {
        if (isAll) return true;
        return (p.category || 'General').toLowerCase() === decodedCategory.toLowerCase();
      })
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
    const isAll =
      decodedCategory.toLowerCase() === 'all' ||
      decodedCategory.toLowerCase() === 'all projects' ||
      decodedCategory.toLowerCase() === 'all videos';

    if (isAll) {
      return {
        id: 'ALL',
        name: 'All Projects',
        discipline: 'COMPLETE PORTFOLIO ARCHIVE',
        description: `Full collection of ${categoryProjects.length} commercial, narrative, and vertical video productions.`,
        projectCount: categoryProjects.length,
      };
    }

    return (
      categoriesList.find((c) => c.name.toLowerCase() === decodedCategory.toLowerCase()) || {
        id: '01',
        name: decodedCategory,
        discipline: `${decodedCategory.toUpperCase()} ARCHIVE`,
        description: `Collection of projects under ${decodedCategory}.`,
        projectCount: categoryProjects.length,
      }
    );
  }, [decodedCategory, categoriesList, categoryProjects]);

  // Record natural aspect ratio and determine portrait vs landscape
  const handleImageDimension = (projectId, width, height) => {
    if (!width || !height) return;
    const ratio = width / height;
    const orientation = ratio < 0.95 ? 'portrait' : 'landscape';
    setProjectAspectRatios((prev) => {
      if (prev[projectId] === ratio) return prev;
      return { ...prev, [projectId]: ratio };
    });
    setProjectOrientations((prev) => {
      if (prev[projectId] === orientation) return prev;
      return { ...prev, [projectId]: orientation };
    });
  };

  // Ratio filtering and smart arrangement states
  const [ratioFilter, setRatioFilter] = useState('all'); // 'all' | 'portrait' | 'landscape'
  const [groupByRatio, setGroupByRatio] = useState(true); // arrange videos according to card ratio

  // Preload and measure thumbnails whenever categoryProjects changes
  useEffect(() => {
    if (!categoryProjects || categoryProjects.length === 0) return;

    categoryProjects.forEach((p) => {
      // Check if YouTube Shorts URL even if no custom thumbnail provided
      const isShorts = p.url && p.url.includes('/shorts/');
      if (isShorts && !p.thumbnailUrl) {
        handleImageDimension(p.id, 9, 16);
      }

      if (!p.thumbnailUrl) return;
      const formatted = formatImageSrc(p.thumbnailUrl);
      if (!formatted) return;

      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          handleImageDimension(p.id, img.naturalWidth, img.naturalHeight);
        }
      };
      img.src = formatted;
    });
  }, [categoryProjects]);

  // Check if current category is predominantly portrait (or labeled Reels / Shorts / TikTok / Vertical / Model)
  const isPortraitCategory = useMemo(() => {
    const nameLower = (currentCategoryMeta?.name || '').toLowerCase();
    const nameSuggestsPortrait = /reel|short|tiktok|vertical|story|stories|portrait|shoot|model/i.test(nameLower);
    if (nameSuggestsPortrait) return true;

    if (!categoryProjects || categoryProjects.length === 0) return false;
    let portraitCount = 0;
    categoryProjects.forEach((p) => {
      const isShorts = p.url && p.url.includes('/shorts/');
      if (projectOrientations[p.id] === 'portrait' || isShorts) {
        portraitCount++;
      }
    });
    return portraitCount >= categoryProjects.length / 2;
  }, [categoryProjects, projectOrientations, currentCategoryMeta]);

  // Reliable orientation lookup for any project
  const getProjectOrientation = (project) => {
    if (!project) return 'portrait';
    if (projectOrientations[project.id]) return projectOrientations[project.id];
    if (project.url && project.url.includes('/shorts/')) return 'portrait';
    const cat = (project.category || '').toLowerCase();
    if (/reel|short|tiktok|vertical|story|stories|portrait|shoot|model/i.test(cat)) {
      return 'portrait';
    }
    return isPortraitCategory ? 'portrait' : 'landscape';
  };

  // Compute counts for ratio tabs
  const { portraitCount, landscapeCount } = useMemo(() => {
    let pCount = 0;
    let lCount = 0;
    categoryProjects.forEach((p) => {
      if (getProjectOrientation(p) === 'portrait') pCount++;
      else lCount++;
    });
    return { portraitCount: pCount, landscapeCount: lCount };
  }, [categoryProjects, projectOrientations, isPortraitCategory]);

  // Reorder mode: one-click auto-packing videos into zero-empty-space sequence (16:9 & 9:16)
  const handleAutoGroupByRatio = () => {
    const list = [...orderedCategoryProjects];
    const rows = packIntoZeroGapRows(list, getProjectOrientation);
    const flattened = rows.flatMap((r) => r.items.map((item) => item.project));
    setOrderedCategoryProjects(flattened);
    showToast('Videos rearranged into zero-empty-space mosaic! Click "SAVE NEW ORDER" to persist.');
  };

  // Active source projects for Stage 2
  const sourceProjects = useMemo(() => {
    return isReorderMode ? orderedCategoryProjects : categoryProjects;
  }, [isReorderMode, orderedCategoryProjects, categoryProjects]);

  // Zero-empty-space packed mosaic rows (Strictly 16:9 & 9:16)
  const mosaicRows = useMemo(() => {
    return packIntoZeroGapRows(sourceProjects, getProjectOrientation);
  }, [sourceProjects, projectOrientations, isPortraitCategory]);

  // Single-format displayed projects when user clicks 9:16 or 16:9 tabs
  const displayedProjects = useMemo(() => {
    if (ratioFilter === 'portrait') {
      return sourceProjects.filter((p) => getProjectOrientation(p) === 'portrait');
    }
    if (ratioFilter === 'landscape') {
      return sourceProjects.filter((p) => getProjectOrientation(p) === 'landscape');
    }
    return sourceProjects;
  }, [sourceProjects, ratioFilter, projectOrientations, isPortraitCategory]);

  // Reusable card renderer enforcing strict 16:9 and 9:16 card ratios
  const renderProjectCard = (project, index, customFlex = null) => {
    const orientation = getProjectOrientation(project);
    const isPortrait = orientation === 'portrait';

    return (
      <article
        key={project.id}
        className={`${styles.projectCard} ${
          isPortrait ? styles.projectCardPortrait : styles.projectCardLandscape
        } ${isReorderMode ? styles.projectCardReorderable : ''} ${
          draggedIndex === index ? styles.cardDragging : ''
        } ${dragOverIndex === index ? styles.cardDragOver : ''}`}
        style={customFlex ? { flex: customFlex } : undefined}
        draggable={isReorderMode}
        onMouseEnter={!isReorderMode ? handleCardMouseEnter : undefined}
        onMouseMove={!isReorderMode ? handleCardMouseMove : undefined}
        onMouseLeave={!isReorderMode ? handleCardMouseLeave : undefined}
        onDragStart={isReorderMode ? (e) => handleDragStart(e, index) : undefined}
        onDragOver={isReorderMode ? (e) => handleDragOver(e, index) : undefined}
        onDrop={isReorderMode ? (e) => handleDrop(e, index) : undefined}
        onDragEnd={isReorderMode ? handleDragEnd : undefined}
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
                disabled={index === sourceProjects.length - 1}
                className={styles.shiftBtn}
                title="Move Down"
              >
                ▼
              </button>
            </div>
          </div>
        )}

        <div
          className={`${styles.thumbnailStage} ${
            isPortrait ? styles.portraitStage : styles.landscapeStage
          }`}
        >
          {/* Strict Aspect Ratio Badge: 9:16 or 16:9 */}
          <span className={styles.cardRatioBadge}>
            {isPortrait ? '9:16' : '16:9'}
          </span>

          {/* Static Thumbnail Backdrop (Always shown - pristine thumbnail only) */}
          {project.thumbnailUrl ? (
            <img
              src={formatImageSrc(project.thumbnailUrl)}
              alt={project.description || "Project thumbnail"}
              className={styles.thumbnailImg}
              loading="lazy"
              referrerPolicy="no-referrer"
              onLoad={(e) => {
                if (e.target.naturalWidth && e.target.naturalHeight) {
                  handleImageDimension(project.id, e.target.naturalWidth, e.target.naturalHeight);
                }
              }}
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
        </div>

        {(project.description || isReorderMode) && (
          <div className={styles.projectInfo}>
            {project.description && (
              <p className={styles.projectDesc}>{project.description}</p>
            )}

            {isReorderMode && (
              <div className={styles.projectActionRow}>
                <span className={styles.watchText}>
                  DRAG OR USE ▲ ▼ TO MOVE
                </span>
              </div>
            )}
          </div>
        )}
      </article>
    );
  };

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
                {/* ALL PROJECTS COMPLETE ARCHIVE CARD */}
                <div
                  className={`${styles.categoryCard} ${styles.allCategoryCard}`}
                  data-tilt
                  data-magnetic
                  onClick={() => navigate('/work/All')}
                >
                  <div className={styles.catCardTop}>
                    <span className={styles.catIndex}>[ALL]</span>
                    <span className={styles.catCountBadge}>
                      {projects.length} {projects.length === 1 ? 'PROJECT' : 'PROJECTS'}
                    </span>
                  </div>

                  <div className={styles.catCardBody}>
                    <span className={styles.catDiscipline}>COMPLETE ARCHIVE // 16:9 & 9:16</span>
                    <h2 className={styles.catTitle}>ALL PROJECTS</h2>
                    <p className={styles.catDesc}>
                      Explore all published videos and vertical reels in a balanced zero-empty-space mosaic archive.
                    </p>
                  </div>

                  <div className={styles.catCardFooter}>
                    <span className={styles.exploreLink}>EXPLORE ALL VIDEOS →</span>
                  </div>
                </div>

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
                    onClick={handleAutoGroupByRatio}
                    className={styles.autoGroupBtn}
                    title="Automatically arrange videos into balanced rows so all 9:16 vertical and 16:9 widescreen videos fill every row with zero empty space"
                  >
                    ⚡ AUTO-PACK (NO EMPTY SPACE)
                  </button>
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

            {/* Aspect Ratio Filter & Smart Arrangement Control Bar */}
            {categoryProjects.length > 0 && !isReorderMode && (
              <div className={styles.filterControlBar}>
                <div className={styles.ratioTabs}>
                  <button
                    type="button"
                    className={`${styles.ratioTab} ${ratioFilter === 'all' ? styles.ratioTabActive : ''}`}
                    onClick={() => setRatioFilter('all')}
                  >
                    <span>ALL (BALANCED MOSAIC)</span>
                    <span className={styles.tabCountBadge}>{sourceProjects.length}</span>
                  </button>

                  {portraitCount > 0 && (
                    <button
                      type="button"
                      className={`${styles.ratioTab} ${ratioFilter === 'portrait' ? styles.ratioTabActive : ''}`}
                      onClick={() => setRatioFilter('portrait')}
                    >
                      <span className={styles.tabIcon}>📱</span>
                      <span>VERTICAL (9:16)</span>
                      <span className={styles.tabCountBadge}>{portraitCount}</span>
                    </button>
                  )}

                  {landscapeCount > 0 && (
                    <button
                      type="button"
                      className={`${styles.ratioTab} ${ratioFilter === 'landscape' ? styles.ratioTabActive : ''}`}
                      onClick={() => setRatioFilter('landscape')}
                    >
                      <span className={styles.tabIcon}>🎬</span>
                      <span>CINEMATIC (16:9)</span>
                      <span className={styles.tabCountBadge}>{landscapeCount}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Projects Grid — Zero Empty Space Mosaic Layout */}
            {loading ? (
              <div className={styles.loadingBox}>
                <div className={styles.spinner} />
                <p>Fetching projects for {currentCategoryMeta?.name}...</p>
              </div>
            ) : sourceProjects.length > 0 ? (
              ratioFilter === 'all' ? (
                /* Balanced Mosaic Rows (Zero Empty Space, strictly 16:9 and 9:16) */
                <div className={styles.mosaicContainer}>
                  {mosaicRows.map((row) => (
                    <div
                      key={row.id}
                      className={`${styles.mosaicRow} ${getRowStyleClass(row.pattern)}`}
                    >
                      {row.items.map((item) => {
                        const itemIndex = sourceProjects.findIndex((p) => p.id === item.project.id);
                        const flexVal = item.flexGrow ? `${item.flexGrow} 1 0%` : undefined;
                        return renderProjectCard(
                          item.project,
                          itemIndex >= 0 ? itemIndex : 0,
                          flexVal
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                /* Single Format Grids (Strict 9:16 or 16:9) */
                <div
                  className={`${styles.formatGrid} ${
                    ratioFilter === 'portrait' ? styles.formatGridPortrait : styles.formatGridLandscape
                  }`}
                >
                  {displayedProjects.map((project, idx) => {
                    const originalIdx = sourceProjects.findIndex((p) => p.id === project.id);
                    return renderProjectCard(
                      project,
                      originalIdx >= 0 ? originalIdx : idx,
                      null
                    );
                  })}
                </div>
              )
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
      {activeVideoProject && (() => {
        const isCurrentActivePortrait =
          projectOrientations[activeVideoProject.id] === 'portrait' ||
          (activeVideoProject.url && activeVideoProject.url.includes('/shorts/'));

        return (
          <div
            className={styles.modalOverlay}
            onClick={() => setActiveVideoProject(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className={`${styles.modalCard} ${
                isCurrentActivePortrait ? styles.modalCardPortrait : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
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
              <div
                className={`${styles.videoContainer} ${
                  isCurrentActivePortrait ? styles.videoContainerPortrait : ''
                }`}
              >
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
        );
      })()}



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
