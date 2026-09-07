import { useState, useEffect } from 'react';
import { uploadMediaFile } from '@/services/api';
import styles from './Admin.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

const DEFAULT_CATEGORIES = [
  'Personal Projects',
  'Commercials',
  'Music Videos',
  'Cinematography',
  'Documentary',
  'Fashion & Editorial',
];

export const Admin = () => {
  // Passcode gate state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('venom_admin_token') === 'authenticated';
  });
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Data states
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [toastMessage, setToastMessage] = useState(null);

  // Form / Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);

  // Form input modes & files
  const [videoInputMode, setVideoInputMode] = useState('file'); // 'file' | 'url'
  const [imageInputMode, setImageInputMode] = useState('file'); // 'file' | 'url'

  const [formData, setFormData] = useState({
    description: '',
    url: '',
    thumbnailUrl: '',
    category: 'Personal Projects',
  });

  const [videoFile, setVideoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadStatusText, setUploadStatusText] = useState('');

  // Filter state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');

  // Check Auth on Mount & Fetch Projects
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    checkHealth();
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/immutability
      fetchProjects();
    }
  }, [isAuthenticated]);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch {
      setApiStatus('offline');
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Authenticate Passcode
  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode.trim().toLowerCase() === 'venom' || passcode.trim() === 'admin123') {
      sessionStorage.setItem('venom_admin_token', 'authenticated');
      setIsAuthenticated(true);
      setPasscodeError('');
      showToast('Welcome back, Admin.');
    } else {
      setPasscodeError('Invalid Admin Key. Enter "venom" to access.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('venom_admin_token');
    setIsAuthenticated(false);
  };

  // Fetch projects from backend
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/projects`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.data || []);
        setApiStatus('online');
      } else {
        showToast('Failed to fetch projects', 'error');
      }
    } catch (err) {
      console.error(err);
      setApiStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  // Form input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVideoFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleImageFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Generate immediate local preview URL
      const localPreviewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, thumbnailUrl: localPreviewUrl }));
    }
  };

  const openCreateModal = () => {
    setEditingProjectId(null);
    setFormData({
      description: '',
      url: '',
      thumbnailUrl: '',
      category: 'Personal Projects',
    });
    setVideoFile(null);
    setImageFile(null);
    setVideoUploadProgress(0);
    setImageUploadProgress(0);
    setVideoInputMode('file');
    setImageInputMode('file');
    setFormError('');
    setUploadStatusText('');
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProjectId(project.id);
    setFormData({
      description: project.description || '',
      url: project.url || '',
      thumbnailUrl: project.thumbnailUrl || '',
      category: project.category || 'Personal Projects',
    });
    setVideoFile(null);
    setImageFile(null);
    setVideoUploadProgress(0);
    setImageUploadProgress(0);
    setVideoInputMode('url');
    setImageInputMode(project.thumbnailUrl ? 'url' : 'file');
    setFormError('');
    setUploadStatusText('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProjectId(null);
  };

  // Submit Project (Create or Update)
  const handleSubmitProject = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.description.trim()) {
      setFormError('Project description is required.');
      return;
    }

    if (videoInputMode === 'url' && !formData.url.trim()) {
      setFormError('Video / Project URL is required when using URL mode.');
      return;
    }

    if (videoInputMode === 'file' && !videoFile && !formData.url) {
      setFormError('Please select a video file to upload.');
      return;
    }

    setFormSubmitting(true);

    try {
      let finalVideoUrl = formData.url;
      let finalThumbnailUrl = formData.thumbnailUrl;

      // Step 1: Upload Video file if selected
      if (videoInputMode === 'file' && videoFile) {
        setUploadStatusText('Uploading video to Supabase storage...');
        const videoUploadRes = await uploadMediaFile(videoFile, 'video', (percent) => {
          setVideoUploadProgress(percent);
        });
        if (videoUploadRes.success && videoUploadRes.url) {
          finalVideoUrl = videoUploadRes.url;
        } else {
          throw new Error('Failed to upload video file.');
        }
      }

      // Step 2: Upload Image file if selected
      if (imageInputMode === 'file' && imageFile) {
        setUploadStatusText('Uploading thumbnail image to Supabase storage...');
        const imageUploadRes = await uploadMediaFile(imageFile, 'image', (percent) => {
          setImageUploadProgress(percent);
        });
        if (imageUploadRes.success && imageUploadRes.url) {
          finalThumbnailUrl = imageUploadRes.url;
        } else {
          throw new Error('Failed to upload thumbnail image file.');
        }
      }

      setUploadStatusText('Saving project record to database...');

      const payload = {
        description: formData.description.trim(),
        url: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl || null,
        category: formData.category,
      };

      const method = editingProjectId ? 'PUT' : 'POST';
      const endpoint = editingProjectId
        ? `${API_BASE_URL}/projects/${editingProjectId}`
        : `${API_BASE_URL}/projects`;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        showToast(
          editingProjectId ? 'Project updated successfully!' : 'Project published successfully!'
        );
        closeModal();
        fetchProjects();
      } else {
        setFormError(result.message || 'Operation failed.');
      }
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Server error while saving project.');
    } finally {
      setFormSubmitting(false);
      setUploadStatusText('');
    }
  };

  // Delete Project
  const handleDeleteProject = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this project?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Project deleted successfully.');
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        showToast(data.message || 'Failed to delete project.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to backend API.', 'error');
    }
  };

  // Filtered Projects
  const filteredProjects = projects.filter((p) => {
    if (activeCategoryFilter === 'All') return true;
    return p.category === activeCategoryFilter;
  });

  const categoriesPresent = Array.from(new Set(projects.map((p) => p.category)));

  // PASSCODE LOCK SCREEN
  if (!isAuthenticated) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <span className={styles.authBrand}>VENOM<span className={styles.dot}>.</span></span>
            <span className={styles.authBadge}>ADMIN PORTAL</span>
          </div>

          <h2 className={styles.authTitle}>STUDIO CONTROL ACCESS</h2>
          <p className={styles.authSubtitle}>
            Enter your key to access project management, uploads, and distribution.
          </p>

          <form onSubmit={handleLogin} className={styles.authForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="passcode" className={styles.label}>ADMIN KEY / PASSCODE</label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (Default: venom)"
                className={styles.input}
                autoFocus
              />
            </div>

            {passcodeError && <p className={styles.errorMessage}>{passcodeError}</p>}

            <button type="submit" className={styles.authBtn} data-magnetic>
              UNLOCK DASHBOARD →
            </button>
          </form>

          <p className={styles.authFootnote}>
            Default key: <code>venom</code>
          </p>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD INTERFACE
  return (
    <div className={styles.adminPage}>
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

      <div className={styles.container}>
        {/* Top Action Header */}
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.tagline}>VENOM // CONTROL CENTER</span>
            <h1 className={styles.title}>PROJECT MANAGER</h1>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.statusPill}>
              <span
                className={`${styles.statusDot} ${
                  apiStatus === 'online' ? styles.dotOnline : styles.dotOffline
                }`}
              />
              <span>API: {apiStatus.toUpperCase()}</span>
            </div>

            <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
              LOCK PORTAL
            </button>

            <button type="button" onClick={openCreateModal} className={styles.createBtn} data-magnetic>
              + ADD NEW PROJECT
            </button>
          </div>
        </header>

        {/* Overview Stat Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statVal}>{projects.length}</span>
            <span className={styles.statLbl}>TOTAL PROJECTS</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statVal}>{categoriesPresent.length}</span>
            <span className={styles.statLbl}>ACTIVE CATEGORIES</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statVal}>SUPABASE</span>
            <span className={styles.statLbl}>POSTGRES & STORAGE</span>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className={styles.filterBar}>
          <span className={styles.filterTitle}>FILTER CATEGORY:</span>
          <div className={styles.pillList}>
            {['All', ...DEFAULT_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.filterPill} ${
                  activeCategoryFilter === cat ? styles.filterPillActive : ''
                }`}
                onClick={() => setActiveCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Table / Cards Area */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Fetching portfolio records from Supabase database...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>THUMBNAIL / PREVIEW</th>
                  <th>CATEGORY</th>
                  <th>DESCRIPTION</th>
                  <th>URL / MEDIA LINK</th>
                  <th>CREATED AT</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => (
                  <tr key={p.id} className={styles.tableRow}>
                    <td>
                      <div className={styles.thumbWrapper}>
                        {p.thumbnailUrl ? (
                          <img
                            src={p.thumbnailUrl}
                            alt="Project thumbnail"
                            className={styles.thumbImg}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={styles.thumbPlaceholder}>
                            <span>VIDEO</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={styles.catBadge}>{p.category}</span>
                    </td>
                    <td>
                      <p className={styles.descText}>{p.description}</p>
                    </td>
                    <td>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.urlLink}
                      >
                        OPEN MEDIA ↗
                      </a>
                    </td>
                    <td>
                      <span className={styles.dateText}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionsGroup}>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className={styles.editBtn}
                        >
                          EDIT
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.id)}
                          className={styles.deleteBtn}
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>NO PROJECTS PUBLISHED YET</h3>
            <p>Click "+ ADD NEW PROJECT" above to upload your first video, edit, or photography project.</p>
            <button type="button" onClick={openCreateModal} className={styles.createBtn}>
              + ADD PROJECT NOW
            </button>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingProjectId ? 'EDIT PROJECT' : 'ADD NEW PROJECT'}
              </h3>
              <button type="button" onClick={closeModal} className={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProject} className={styles.modalForm}>
              {formError && <div className={styles.formErrorBox}>{formError}</div>}

              {/* Category */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>CATEGORY</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>DESCRIPTION *</label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Cinematic commercial shot in 4K RAW for Nike Autumn campaign..."
                  className={styles.textarea}
                  required
                />
              </div>

              {/* VIDEO SECTION: FILE UPLOAD VS URL */}
              <div className={styles.sectionBox}>
                <div className={styles.sectionBoxHeader}>
                  <label className={styles.fieldLabel}>VIDEO MEDIA *</label>
                  <div className={styles.toggleGroup}>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${
                        videoInputMode === 'file' ? styles.toggleBtnActive : ''
                      }`}
                      onClick={() => setVideoInputMode('file')}
                    >
                      📁 Upload File
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${
                        videoInputMode === 'url' ? styles.toggleBtnActive : ''
                      }`}
                      onClick={() => setVideoInputMode('url')}
                    >
                      🔗 Video URL
                    </button>
                  </div>
                </div>

                {videoInputMode === 'file' ? (
                  <div className={styles.dropZone}>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className={styles.fileInput}
                      id="videoFileInput"
                    />
                    <label htmlFor="videoFileInput" className={styles.dropZoneLabel}>
                      <span className={styles.dropIcon}>🎥</span>
                      {videoFile ? (
                        <span className={styles.fileName}>{videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                      ) : (
                        <span>Click or drag a video file (.mp4, .mov, .webm)</span>
                      )}
                    </label>

                    {videoUploadProgress > 0 && (
                      <div className={styles.progressContainer}>
                        <div className={styles.progressBar} style={{ width: `${videoUploadProgress}%` }} />
                        <span className={styles.progressText}>Uploading video... {videoUploadProgress}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://vimeo.com/... or https://youtube.com/... or Supabase video link"
                    className={styles.input}
                  />
                )}
              </div>

              {/* THUMBNAIL IMAGE SECTION: FILE UPLOAD VS URL */}
              <div className={styles.sectionBox}>
                <div className={styles.sectionBoxHeader}>
                  <label className={styles.fieldLabel}>THUMBNAIL IMAGE (OPTIONAL)</label>
                  <div className={styles.toggleGroup}>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${
                        imageInputMode === 'file' ? styles.toggleBtnActive : ''
                      }`}
                      onClick={() => setImageInputMode('file')}
                    >
                      🖼 Upload Image
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${
                        imageInputMode === 'url' ? styles.toggleBtnActive : ''
                      }`}
                      onClick={() => setImageInputMode('url')}
                    >
                      🔗 Image URL
                    </button>
                  </div>
                </div>

                {imageInputMode === 'file' ? (
                  <div className={styles.dropZone}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className={styles.fileInput}
                      id="imageFileInput"
                    />
                    <label htmlFor="imageFileInput" className={styles.dropZoneLabel}>
                      <span className={styles.dropIcon}>📷</span>
                      {imageFile ? (
                        <span className={styles.fileName}>{imageFile.name}</span>
                      ) : (
                        <span>Click or drag a poster image file (.png, .jpg, .webp)</span>
                      )}
                    </label>

                    {imageUploadProgress > 0 && (
                      <div className={styles.progressContainer}>
                        <div className={styles.progressBar} style={{ width: `${imageUploadProgress}%` }} />
                        <span className={styles.progressText}>Uploading image... {imageUploadProgress}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    name="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={handleInputChange}
                    placeholder="https://images.unsplash.com/... or image web link"
                    className={styles.input}
                  />
                )}

                {/* Live Preview */}
                {formData.thumbnailUrl && (
                  <div className={styles.previewBox}>
                    <span className={styles.previewLabel}>THUMBNAIL PREVIEW:</span>
                    <img
                      src={formData.thumbnailUrl}
                      alt="Preview"
                      className={styles.previewImg}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {uploadStatusText && (
                <div className={styles.statusBox}>
                  <span>{uploadStatusText}</span>
                </div>
              )}

              <div className={styles.modalFooter}>
                <button type="button" onClick={closeModal} className={styles.cancelBtn}>
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className={styles.submitBtn}
                >
                  {formSubmitting
                    ? 'UPLOADING & SAVING...'
                    : editingProjectId
                    ? 'UPDATE PROJECT'
                    : 'PUBLISH PROJECT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
