import { useState, useEffect } from 'react';
import styles from './Admin.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

const formatImageSrc = (url) => {
  if (!url) return '';
  const gdriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w1000`;
  }
  return url;
};

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

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [formData, setFormData] = useState({
    description: '',
    url: '',
    thumbnailUrl: '',
    category: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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

  const openCreateModal = () => {
    setEditingProjectId(null);
    if (categoriesPresent.length > 0) {
      setFormData({
        description: '',
        url: '',
        thumbnailUrl: '',
        category: categoriesPresent[0],
      });
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    } else {
      setFormData({
        description: '',
        url: '',
        thumbnailUrl: '',
        category: '',
      });
      setIsCustomCategory(true);
      setCustomCategoryInput('');
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProjectId(project.id);
    const projCat = project.category || '';
    const isExisting = categoriesPresent.includes(projCat);
    setFormData({
      description: project.description || '',
      url: project.url || '',
      thumbnailUrl: project.thumbnailUrl || '',
      category: projCat,
    });
    if (isExisting) {
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    } else {
      setIsCustomCategory(true);
      setCustomCategoryInput(projCat);
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProjectId(null);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
  };

  // Submit Project (Create or Update)
  const handleSubmitProject = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.description.trim()) {
      setFormError('Project description is required.');
      return;
    }

    if (!formData.url.trim()) {
      setFormError('Video / Media URL (e.g. Google Drive link) is required.');
      return;
    }

    setFormSubmitting(true);

    try {
      const payload = {
        description: formData.description.trim(),
        url: formData.url.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim() || null,
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

  const categoriesPresent = Array.from(
    new Set(projects.map((p) => p.category).filter((c) => c && c.trim().length > 0))
  );

  // Filtered Projects
  const filteredProjects = projects.filter((p) => {
    if (activeCategoryFilter === 'All') return true;
    return p.category === activeCategoryFilter;
  });

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
            <span className={styles.statVal}>DATABASE</span>
            <span className={styles.statLbl}>POSTGRES & GDRIVE LINKS</span>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className={styles.filterBar}>
          <span className={styles.filterTitle}>FILTER CATEGORY:</span>
          <div className={styles.pillList}>
            {['All', ...categoriesPresent].map((cat) => (
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
                            src={formatImageSrc(p.thumbnailUrl)}
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
                      <span className={styles.urlBadge} title={p.url}>
                        {p.url ? (p.url.includes('drive.google.com') ? 'GDRIVE LINK' : 'MEDIA LINK') : 'NO LINK'}
                      </span>
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
                <label className={styles.fieldLabel}>CATEGORY *</label>
                {categoriesPresent.length > 0 && !isCustomCategory ? (
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsCustomCategory(true);
                        setCustomCategoryInput('');
                        setFormData((prev) => ({ ...prev, category: '' }));
                      } else {
                        setIsCustomCategory(false);
                        setFormData((prev) => ({ ...prev, category: e.target.value }));
                      }
                    }}
                    className={styles.select}
                  >
                    {categoriesPresent.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__NEW__">+ CREATE NEW CUSTOM CATEGORY...</option>
                  </select>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Type category name (e.g., Commercials, Music Videos, Cinematography...)"
                      value={isCustomCategory ? customCategoryInput : formData.category}
                      onChange={(e) => {
                        setCustomCategoryInput(e.target.value);
                        setFormData((prev) => ({ ...prev, category: e.target.value }));
                      }}
                      className={styles.input}
                      required
                      autoFocus
                    />
                    {categoriesPresent.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setFormData((prev) => ({ ...prev, category: categoriesPresent[0] }));
                        }}
                        style={{
                          marginTop: '6px',
                          background: 'none',
                          border: 'none',
                          color: '#14b8a6',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        ← Choose existing category
                      </button>
                    )}
                  </div>
                )}
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

              {/* VIDEO URL INPUT */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>VIDEO / MEDIA URL *</label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="e.g. https://drive.google.com/file/d/... or YouTube / Vimeo link"
                  className={styles.input}
                  required
                />
                <p className={styles.fieldNote}>
                  💡 Google Drive Link Support: Ensure your GDrive file sharing permission is set to <strong>"Anyone with the link can view"</strong>.
                </p>
              </div>

              {/* THUMBNAIL IMAGE URL INPUT */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>THUMBNAIL IMAGE URL (OPTIONAL)</label>
                <input
                  type="url"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleInputChange}
                  placeholder="e.g. Google Drive image link or direct web image link"
                  className={styles.input}
                />
                <p className={styles.fieldNote}>
                  Paste Google Drive image link or any image web link for the poster preview.
                </p>

                {/* Live Preview */}
                {formData.thumbnailUrl && (
                  <div className={styles.previewBox}>
                    <span className={styles.previewLabel}>THUMBNAIL PREVIEW:</span>
                    <img
                      src={formatImageSrc(formData.thumbnailUrl)}
                      alt="Preview"
                      className={styles.previewImg}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

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
                    ? 'SAVING PROJECT...'
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
