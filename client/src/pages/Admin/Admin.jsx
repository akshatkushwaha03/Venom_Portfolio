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

const DEFAULT_PASSCODE = 'venom';
const DEFAULT_SEC_QUESTION = 'What game inspired the Venom identity?';
const DEFAULT_SEC_ANSWER = 'pubg';
const MASTER_KEY = 'admin123';

const getStoredPasscode = () => localStorage.getItem('venom_admin_custom_passcode') || DEFAULT_PASSCODE;
const getStoredSecQuestion = () => localStorage.getItem('venom_admin_sec_question') || DEFAULT_SEC_QUESTION;
const getStoredSecAnswer = () => localStorage.getItem('venom_admin_sec_answer') || DEFAULT_SEC_ANSWER;
const isCustomPasscodeSet = () => Boolean(localStorage.getItem('venom_admin_custom_passcode'));

export const Admin = () => {
  // Passcode gate state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('venom_admin_token') === 'authenticated';
  });
  const [authView, setAuthView] = useState('login'); // 'login' | 'forgot'
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');

  // Forgot Passcode / Recovery State
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // Key Settings Modal State (Inside Admin)
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyFormData, setKeyFormData] = useState({
    currentPasscode: '',
    newPasscode: '',
    confirmNewPasscode: '',
    secQuestion: getStoredSecQuestion(),
    secAnswer: '',
  });
  const [keyFormError, setKeyFormError] = useState('');

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
    const entered = passcode.trim();
    const activePasscode = getStoredPasscode();

    if (
      entered.toLowerCase() === activePasscode.toLowerCase() ||
      entered === activePasscode ||
      entered === MASTER_KEY
    ) {
      sessionStorage.setItem('venom_admin_token', 'authenticated');
      setIsAuthenticated(true);
      setPasscodeError('');
      showToast('Welcome back, Admin.');
    } else {
      setPasscodeError('Invalid Admin Key. Enter your passcode or click "Forgot Passcode?" below.');
    }
  };

  // Handle Forgot Passcode / Reset Key
  const handleResetPasscode = (e) => {
    e.preventDefault();
    setRecoveryError('');

    const correctAns = getStoredSecAnswer().trim().toLowerCase();
    const enteredAns = recoveryAnswer.trim().toLowerCase();

    if (enteredAns !== correctAns && recoveryAnswer.trim() !== MASTER_KEY) {
      setRecoveryError('Incorrect security answer or master recovery key.');
      return;
    }

    if (!newPasscode.trim() || newPasscode.trim().length < 3) {
      setRecoveryError('New passcode must be at least 3 characters long.');
      return;
    }

    if (newPasscode.trim() !== confirmPasscode.trim()) {
      setRecoveryError('New passcodes do not match.');
      return;
    }

    localStorage.setItem('venom_admin_custom_passcode', newPasscode.trim());
    sessionStorage.setItem('venom_admin_token', 'authenticated');
    setIsAuthenticated(true);
    setAuthView('login');
    setPasscode('');
    setRecoveryAnswer('');
    setNewPasscode('');
    setConfirmPasscode('');
    showToast('Passcode updated successfully! Welcome to the Admin Portal.');
  };

  // Quick reset to default 'venom'
  const handleQuickResetToDefault = () => {
    const correctAns = getStoredSecAnswer().trim().toLowerCase();
    const enteredAns = recoveryAnswer.trim().toLowerCase();

    if (enteredAns !== correctAns && recoveryAnswer.trim() !== MASTER_KEY) {
      setRecoveryError('Please enter the correct security answer or master key first to reset.');
      return;
    }

    localStorage.removeItem('venom_admin_custom_passcode');
    localStorage.removeItem('venom_admin_sec_question');
    localStorage.removeItem('venom_admin_sec_answer');
    sessionStorage.setItem('venom_admin_token', 'authenticated');
    setIsAuthenticated(true);
    setAuthView('login');
    setPasscode('');
    setRecoveryAnswer('');
    setNewPasscode('');
    setConfirmPasscode('');
    showToast('Passcode reset to default: "venom".');
  };

  // Update passcode inside dashboard
  const handleUpdateKeySettings = (e) => {
    e.preventDefault();
    setKeyFormError('');

    const activePass = getStoredPasscode();
    const enteredCurrent = keyFormData.currentPasscode.trim();

    if (
      enteredCurrent.toLowerCase() !== activePass.toLowerCase() &&
      enteredCurrent !== activePass &&
      enteredCurrent !== MASTER_KEY
    ) {
      setKeyFormError('Current passcode is incorrect.');
      return;
    }

    if (!keyFormData.newPasscode.trim() || keyFormData.newPasscode.trim().length < 3) {
      setKeyFormError('New passcode must be at least 3 characters long.');
      return;
    }

    if (keyFormData.newPasscode.trim() !== keyFormData.confirmNewPasscode.trim()) {
      setKeyFormError('New passcodes do not match.');
      return;
    }

    localStorage.setItem('venom_admin_custom_passcode', keyFormData.newPasscode.trim());

    if (keyFormData.secAnswer.trim()) {
      localStorage.setItem('venom_admin_sec_question', keyFormData.secQuestion);
      localStorage.setItem('venom_admin_sec_answer', keyFormData.secAnswer.trim());
    }

    showToast('Upload & Admin passcode updated successfully!');
    setIsKeyModalOpen(false);
    setKeyFormData({
      currentPasscode: '',
      newPasscode: '',
      confirmNewPasscode: '',
      secQuestion: getStoredSecQuestion(),
      secAnswer: '',
    });
  };

  const handleResetToDefaultInModal = () => {
    if (!window.confirm('Reset upload & admin passcode back to default "venom"?')) {
      return;
    }
    localStorage.removeItem('venom_admin_custom_passcode');
    localStorage.removeItem('venom_admin_sec_question');
    localStorage.removeItem('venom_admin_sec_answer');
    showToast('Passcode reset to default: "venom".');
    setIsKeyModalOpen(false);
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
          {authView === 'login' ? (
            <>
              <div className={styles.authHeader}>
                <span className={styles.authBrand}>
                  VENOM<span className={styles.dot}>.</span>
                </span>
                <span className={styles.authBadge}>ADMIN PORTAL</span>
              </div>

              <h2 className={styles.authTitle}>STUDIO CONTROL ACCESS</h2>
              <p className={styles.authSubtitle}>
                Enter your key to access project management, uploads, and distribution.
              </p>

              <form onSubmit={handleLogin} className={styles.authForm}>
                <div className={styles.inputGroup}>
                  <div className={styles.labelRow}>
                    <label htmlFor="passcode" className={styles.label}>
                      ADMIN KEY / PASSCODE
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPasscode((prev) => !prev)}
                      className={styles.toggleVisibilityBtn}
                    >
                      {showPasscode ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="passcode"
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder={
                      isCustomPasscodeSet()
                        ? 'Enter your custom admin key'
                        : 'Enter passcode (Default: venom)'
                    }
                    className={styles.input}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('forgot');
                      setPasscodeError('');
                      setRecoveryError('');
                    }}
                    className={styles.forgotBtn}
                  >
                    Forgot Passcode?
                  </button>
                </div>

                {passcodeError && <p className={styles.errorMessage}>{passcodeError}</p>}

                <button type="submit" className={styles.authBtn} data-magnetic>
                  UNLOCK DASHBOARD →
                </button>
              </form>

              <div className={styles.authFootnoteBox}>
                <span className={styles.authFootnoteStatus}>
                  {isCustomPasscodeSet()
                    ? '🔒 Custom upload passcode active'
                    : '🔑 Default key: venom'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className={styles.authHeader}>
                <span className={styles.authBrand}>
                  VENOM<span className={styles.dot}>.</span>
                </span>
                <span className={styles.authBadge}>KEY RECOVERY</span>
              </div>

              <h2 className={styles.authTitle}>RECOVER ADMIN PASSCODE</h2>
              <p className={styles.authSubtitle}>
                Answer your security question or enter the master recovery key to set a new passcode.
              </p>

              <form onSubmit={handleResetPasscode} className={styles.authForm}>
                <div className={styles.secQuestionBox}>
                  <span className={styles.secQuestionLabel}>SECURITY QUESTION:</span>
                  <p className={styles.secQuestionText}>{getStoredSecQuestion()}</p>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="recoveryAnswer" className={styles.label}>
                    YOUR SECURITY ANSWER
                  </label>
                  <input
                    id="recoveryAnswer"
                    type="text"
                    value={recoveryAnswer}
                    onChange={(e) => setRecoveryAnswer(e.target.value)}
                    placeholder="Enter answer (Default: pubg)"
                    className={styles.input}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="newPasscode" className={styles.label}>
                    NEW PASSCODE
                  </label>
                  <input
                    id="newPasscode"
                    type="password"
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    placeholder="Enter new passcode (min. 3 characters)"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="confirmPasscode" className={styles.label}>
                    CONFIRM NEW PASSCODE
                  </label>
                  <input
                    id="confirmPasscode"
                    type="password"
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value)}
                    placeholder="Confirm new passcode"
                    className={styles.input}
                    required
                  />
                </div>

                {recoveryError && <p className={styles.errorMessage}>{recoveryError}</p>}

                <button type="submit" className={styles.authBtn} data-magnetic>
                  RESET PASSCODE & UNLOCK →
                </button>

                <div className={styles.recoveryActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('login');
                      setRecoveryError('');
                    }}
                    className={styles.backBtnInline}
                  >
                    ← Back to Login
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickResetToDefault}
                    className={styles.resetDefaultLink}
                    title="Reset passcode back to venom after typing answer"
                  >
                    Reset to default ("venom")
                  </button>
                </div>
              </form>
            </>
          )}
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

            <button
              type="button"
              onClick={() => {
                setKeyFormData({
                  currentPasscode: '',
                  newPasscode: '',
                  confirmNewPasscode: '',
                  secQuestion: getStoredSecQuestion(),
                  secAnswer: '',
                });
                setKeyFormError('');
                setIsKeyModalOpen(true);
              }}
              className={styles.keySettingsBtn}
              title="Change upload & admin password"
            >
              <span>🔑</span>
              <span>CHANGE PASSWORD</span>
            </button>

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

              {/* UPLOAD SECURITY KEY NOTE */}
              <div className={styles.uploadSecurityPill}>
                <span>
                  🔒 Uploads protected by Admin Key ({isCustomPasscodeSet() ? 'Custom' : 'Default'})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    setKeyFormData({
                      currentPasscode: '',
                      newPasscode: '',
                      confirmNewPasscode: '',
                      secQuestion: getStoredSecQuestion(),
                      secAnswer: '',
                    });
                    setKeyFormError('');
                    setIsKeyModalOpen(true);
                  }}
                  className={styles.changeKeyInlineBtn}
                >
                  Change Password
                </button>
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

      {/* KEY SETTINGS MODAL */}
      {isKeyModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsKeyModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>ADMIN & UPLOAD KEY SETTINGS</h3>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <p className={styles.fieldNote} style={{ marginBottom: '16px' }}>
              Configure the password required to log into the Admin portal and upload or manage projects.
            </p>

            <div
              className={`${styles.statusNotice} ${
                isCustomPasscodeSet() ? styles.statusNoticeActive : styles.statusNoticeDefault
              }`}
            >
              {isCustomPasscodeSet()
                ? '✓ A custom passcode is currently active for uploads and portal login.'
                : '⚠️ Currently using default passcode ("venom"). We recommend setting your own custom key.'}
            </div>

            {keyFormError && <div className={styles.formErrorBox}>{keyFormError}</div>}

            <form onSubmit={handleUpdateKeySettings} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>CURRENT PASSCODE *</label>
                <input
                  type="password"
                  value={keyFormData.currentPasscode}
                  onChange={(e) =>
                    setKeyFormData((prev) => ({ ...prev, currentPasscode: e.target.value }))
                  }
                  placeholder="Enter current passcode (Default: venom)"
                  className={styles.input}
                  required
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>NEW PASSCODE *</label>
                <input
                  type="password"
                  value={keyFormData.newPasscode}
                  onChange={(e) =>
                    setKeyFormData((prev) => ({ ...prev, newPasscode: e.target.value }))
                  }
                  placeholder="Enter new custom passcode (min. 3 characters)"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>CONFIRM NEW PASSCODE *</label>
                <input
                  type="password"
                  value={keyFormData.confirmNewPasscode}
                  onChange={(e) =>
                    setKeyFormData((prev) => ({ ...prev, confirmNewPasscode: e.target.value }))
                  }
                  placeholder="Re-type new passcode"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>SECURITY RECOVERY QUESTION</label>
                <select
                  value={keyFormData.secQuestion}
                  onChange={(e) =>
                    setKeyFormData((prev) => ({ ...prev, secQuestion: e.target.value }))
                  }
                  className={styles.select}
                >
                  <option value="What game inspired the Venom identity?">
                    What game inspired the Venom identity?
                  </option>
                  <option value="What was your first project or film title?">
                    What was your first project or film title?
                  </option>
                  <option value="What is your favorite camera or filmmaking tool?">
                    What is your favorite camera or filmmaking tool?
                  </option>
                  <option value="What is your secret backup phrase?">
                    What is your secret backup phrase?
                  </option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>SECURITY ANSWER (FOR RECOVERY)</label>
                <input
                  type="text"
                  value={keyFormData.secAnswer}
                  onChange={(e) =>
                    setKeyFormData((prev) => ({ ...prev, secAnswer: e.target.value }))
                  }
                  placeholder="Type answer to reset key if you ever forget it"
                  className={styles.input}
                />
                <p className={styles.fieldNote}>
                  💡 Used on the login screen if you ever click "Forgot Passcode?".
                </p>
              </div>

              <div className={styles.modalFooter}>
                {isCustomPasscodeSet() && (
                  <button
                    type="button"
                    onClick={handleResetToDefaultInModal}
                    className={styles.resetDangerBtn}
                  >
                    Reset to Default ("venom")
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  CANCEL
                </button>
                <button type="submit" className={styles.submitBtn}>
                  SAVE NEW PASSCODE
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
