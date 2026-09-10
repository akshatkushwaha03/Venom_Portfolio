import { useState, useEffect } from 'react';
import styles from './Admin.module.css';
import {
  loginAdmin,
  getMe,
  updateAdminCredentials,
  resetAdminPassword,
  getAuthHeaders,
  removeAuthToken,
} from '../../services/api';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    const trimmed = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  // Auto-detect local development environment
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:5000/api';
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

const formatImageSrc = (url) => {
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

export const Admin = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' | 'reset'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Password Reset State
  const [masterKey, setMasterKey] = useState('');
  const [newResetUsername, setNewResetUsername] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  // Key / Credentials Settings Modal State (Inside Admin)
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyFormData, setKeyFormData] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmNewPassword: '',
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
  const [thumbAspectInfo, setThumbAspectInfo] = useState(null);

  // Filter state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');

  // Video Reordering Modal State
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderCategory, setReorderCategory] = useState('');
  const [reorderList, setReorderList] = useState([]);
  const [savingReorder, setSavingReorder] = useState(false);

  // Check Auth Session on Mount & Fetch Projects
  useEffect(() => {
    checkHealth();
    const verifySession = async () => {
      try {
        const user = await getMe();
        if (user) {
          setIsAuthenticated(true);
          fetchProjects();
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    verifySession();
  }, []);

  const checkHealth = async () => {
    try {
      let res = await fetch(`${API_BASE_URL}/health`, {
        headers: { Accept: 'application/json' },
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('/api/health', {
          headers: { Accept: 'application/json' },
        }).catch(() => null);
      }

      if (
        (!res || !res.ok) &&
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ) {
        res = await fetch('http://localhost:5000/api/health', {
          headers: { Accept: 'application/json' },
        }).catch(() => null);
      }

      if (res && res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json().catch(() => null);
          if (data && (data.status === 'OK' || data.success !== false)) {
            setApiStatus('online');
            return;
          }
        }
      }
      setApiStatus('offline');
    } catch {
      setApiStatus('offline');
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Authenticate Admin User
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both username and password.');
      return;
    }

    setAuthSubmitting(true);
    try {
      await loginAdmin(username.trim(), password);
      setIsAuthenticated(true);
      setLoginError('');
      showToast('Welcome back, Admin.');
      fetchProjects();
    } catch (err) {
      setLoginError(err.message || 'Invalid username or password.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Reset Admin Password using Master Key
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!masterKey.trim()) {
      setResetError('Master recovery key is required.');
      return;
    }

    if (!newResetPassword.trim() || newResetPassword.trim().length < 3) {
      setResetError('New password must be at least 3 characters long.');
      return;
    }

    if (newResetPassword.trim() !== confirmResetPassword.trim()) {
      setResetError('Passwords do not match.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await resetAdminPassword(
        masterKey.trim(),
        newResetPassword.trim(),
        newResetUsername.trim()
      );
      showToast(res.message || 'Credentials reset successfully! Please log in.');
      setAuthView('login');
      if (res.user && res.user.username) {
        setUsername(res.user.username);
      }
      setPassword(newResetPassword.trim());
      setMasterKey('');
      setNewResetUsername('');
      setNewResetPassword('');
      setConfirmResetPassword('');
      setResetError('');
    } catch (err) {
      setResetError(err.message || 'Password reset failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Update Credentials (Username & Password in DB)
  const handleUpdateKeySettings = async (e) => {
    e.preventDefault();
    setKeyFormError('');

    if (!keyFormData.currentPassword) {
      setKeyFormError('Current password is required to save changes.');
      return;
    }

    if (keyFormData.newPassword && keyFormData.newPassword !== keyFormData.confirmNewPassword) {
      setKeyFormError('New passwords do not match.');
      return;
    }

    try {
      const res = await updateAdminCredentials(
        keyFormData.currentPassword,
        keyFormData.newUsername,
        keyFormData.newPassword
      );

      showToast(res.message || 'Admin credentials updated successfully!');
      setIsKeyModalOpen(false);
      setKeyFormData({
        currentPassword: '',
        newUsername: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (err) {
      setKeyFormError(err.message || 'Failed to update admin credentials.');
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    showToast('Logged out successfully.');
  };

  // Fetch projects from backend
  const fetchProjects = async () => {
    setLoading(true);
    try {
      let res = await fetch(`${API_BASE_URL}/projects`).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch('/api/projects').catch(() => null);
      }
      if (
        (!res || !res.ok) &&
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ) {
        res = await fetch('http://localhost:5000/api/projects').catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setProjects(data.data || []);
          setApiStatus('online');
          return;
        }
      }
      showToast('Failed to fetch projects', 'error');
      setApiStatus('offline');
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
        category: categoriesPresent[0] || 'Personal Projects',
      });
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    } else {
      setFormData({
        description: '',
        url: '',
        thumbnailUrl: '',
        category: 'Personal Projects',
      });
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    }
    setThumbAspectInfo(null);
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
    setThumbAspectInfo(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProjectId(null);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setThumbAspectInfo(null);
  };

  // Submit Project (Create or Update)
  const handleSubmitProject = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.url.trim()) {
      setFormError('Video / Media URL (e.g. Google Drive link) is required.');
      return;
    }

    setFormSubmitting(true);

    try {
      const finalCategory = (formData.category && formData.category.trim()) || 'Personal Projects';
      const payload = {
        description: formData.description ? formData.description.trim() : '',
        url: formData.url.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim() || null,
        category: finalCategory,
      };

      const method = editingProjectId ? 'PUT' : 'POST';
      const endpoint = editingProjectId
        ? `${API_BASE_URL}/projects/${editingProjectId}`
        : `${API_BASE_URL}/projects`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
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
        headers: {
          ...getAuthHeaders(),
        },
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

  // Reordering handlers for Admin
  const openReorderModal = (categoryToReorder) => {
    const targetCat = categoryToReorder || (categoriesPresent[0] || '');
    setReorderCategory(targetCat);
    const catItems = projects
      .filter((p) => p.category === targetCat)
      .sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    setReorderList(catItems);
    setIsReorderModalOpen(true);
  };

  const handleCategoryChangeInReorder = (cat) => {
    setReorderCategory(cat);
    const catItems = projects
      .filter((p) => p.category === cat)
      .sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    setReorderList(catItems);
  };

  const moveReorderItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= reorderList.length) return;
    const updated = [...reorderList];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setReorderList(updated);
  };

  const handleAutoGroupByRatioInAdmin = () => {
    if (!reorderList || reorderList.length <= 1) return;
    const portraits = [];
    const landscapes = [];
    reorderList.forEach((p) => {
      const isShorts = p.url && p.url.includes('/shorts/');
      const isModelOrReel = /reel|short|tiktok|vertical|story|stories|portrait|shoot|model/i.test(p.category || '');
      const orientation = isShorts || isModelOrReel ? 'portrait' : 'landscape';
      if (orientation === 'portrait') {
        portraits.push(p);
      } else {
        landscapes.push(p);
      }
    });
    setReorderList([...portraits, ...landscapes]);
    showToast('Videos arranged by aspect ratio! Click "SAVE NEW SEQUENCE" to persist.');
  };

  const handleSaveReorderInAdmin = async () => {
    try {
      setSavingReorder(true);
      const orderedIds = reorderList.map((p) => p.id);
      const res = await fetch(`${API_BASE_URL}/projects/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ orderedIds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Video order updated successfully! Visitors will see this sequence.');
        setIsReorderModalOpen(false);
        fetchProjects();
      } else {
        showToast(data.message || 'Failed to update video order', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving video order', 'error');
    } finally {
      setSavingReorder(false);
    }
  };

  // Filtered Projects (Sorted by order ASC, then createdAt DESC)
  const filteredProjects = projects
    .filter((p) => {
      if (activeCategoryFilter === 'All') return true;
      return p.category === activeCategoryFilter;
    })
    .sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  // ADMIN LOGIN & RESET SCREEN
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className={styles.statusPill}>
                    <span
                      className={`${styles.statusDot} ${
                        apiStatus === 'online' ? styles.dotOnline : styles.dotOffline
                      }`}
                    />
                    <span>API: {apiStatus.toUpperCase()}</span>
                  </div>
                  <span className={styles.authBadge}>ADMIN PORTAL</span>
                </div>
              </div>

              <h2 className={styles.authTitle}>STUDIO CONTROL ACCESS</h2>
              <p className={styles.authSubtitle}>
                Enter your admin credentials to access project management, uploads, and distribution.
              </p>

              <form onSubmit={handleLogin} className={styles.authForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="username" className={styles.label}>
                    USERNAME
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter admin username"
                    className={styles.input}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.inputGroup}>
                  <div className={styles.labelRow}>
                    <label htmlFor="password" className={styles.label}>
                      PASSWORD
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className={styles.toggleVisibilityBtn}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className={styles.input}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('reset');
                      setLoginError('');
                      setResetError('');
                    }}
                    className={styles.forgotBtn}
                  >
                    Forgot Password?
                  </button>
                </div>

                {loginError && <p className={styles.errorMessage}>{loginError}</p>}

                <button type="submit" className={styles.authBtn} disabled={authSubmitting} data-magnetic>
                  {authSubmitting ? 'AUTHENTICATING...' : 'UNLOCK DASHBOARD →'}
                </button>
              </form>

              <div className={styles.authFootnoteBox}>
                <span className={styles.authFootnoteStatus}>
                  🔒 Secure DB-backed JWT Authentication
                </span>
              </div>
            </>
          ) : (
            <>
              <div className={styles.authHeader}>
                <span className={styles.authBrand}>
                  VENOM<span className={styles.dot}>.</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className={styles.statusPill}>
                    <span
                      className={`${styles.statusDot} ${
                        apiStatus === 'online' ? styles.dotOnline : styles.dotOffline
                      }`}
                    />
                    <span>API: {apiStatus.toUpperCase()}</span>
                  </div>
                  <span className={styles.authBadge}>PASSWORD RESET</span>
                </div>
              </div>

              <h2 className={styles.authTitle}>RESET ADMIN PASSWORD</h2>
              <p className={styles.authSubtitle}>
                Enter your Master Recovery Key to reset your admin password in the database.
              </p>

              <form onSubmit={handleResetPassword} className={styles.authForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="masterKey" className={styles.label}>
                    MASTER RECOVERY KEY
                  </label>
                  <input
                    id="masterKey"
                    type="password"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    placeholder="Enter Master Recovery Key"
                    className={styles.input}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="newResetUsername" className={styles.label}>
                    NEW USERNAME (OPTIONAL)
                  </label>
                  <input
                    id="newResetUsername"
                    type="text"
                    value={newResetUsername}
                    onChange={(e) => setNewResetUsername(e.target.value)}
                    placeholder="Enter new admin username (leave blank to keep current)"
                    className={styles.input}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="newResetPassword" className={styles.label}>
                    NEW PASSWORD
                  </label>
                  <input
                    id="newResetPassword"
                    type="password"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="Enter new password (min. 3 characters)"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="confirmResetPassword" className={styles.label}>
                    CONFIRM NEW PASSWORD
                  </label>
                  <input
                    id="confirmResetPassword"
                    type="password"
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={styles.input}
                    required
                  />
                </div>

                {resetError && <p className={styles.errorMessage}>{resetError}</p>}

                <button type="submit" className={styles.authBtn} disabled={authSubmitting} data-magnetic>
                  {authSubmitting ? 'RESETTING...' : 'RESET PASSWORD & RETURN TO LOGIN →'}
                </button>

                <div className={styles.recoveryActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('login');
                      setResetError('');
                    }}
                    className={styles.backBtnInline}
                  >
                    ← Back to Login
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
                  currentPassword: '',
                  newUsername: '',
                  newPassword: '',
                  confirmNewPassword: '',
                });
                setKeyFormError('');
                setIsKeyModalOpen(true);
              }}
              className={styles.keySettingsBtn}
              title="Change admin username & password"
            >
              <span>🔑</span>
              <span>CHANGE CREDENTIALS</span>
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

          {categoriesPresent.length > 0 && (
            <button
              type="button"
              onClick={() =>
                openReorderModal(
                  activeCategoryFilter !== 'All' ? activeCategoryFilter : categoriesPresent[0]
                )
              }
              className={styles.adminReorderBtn}
              title="Arrange and customize video display order"
            >
              <span>⇄</span>
              <span>ARRANGE VIDEOS</span>
            </button>
          )}
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
                  <th style={{ width: '80px' }}># ORDER</th>
                  <th>THUMBNAIL / PREVIEW</th>
                  <th>CATEGORY</th>
                  <th>DESCRIPTION</th>
                  <th>URL / MEDIA LINK</th>
                  <th>CREATED AT</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p, idx) => (
                  <tr key={p.id} className={styles.tableRow}>
                    <td>
                      <span className={styles.orderBadge}>#{idx + 1}</span>
                    </td>
                    <td>
                      <div className={styles.thumbWrapper}>
                        {p.thumbnailUrl ? (
                          <img
                            src={formatImageSrc(p.thumbnailUrl)}
                            alt="Project thumbnail"
                            className={styles.thumbImg}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const ph = e.target.parentElement?.querySelector(`.${styles.thumbPlaceholder}`);
                              if (ph) ph.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={styles.thumbPlaceholder}
                          style={{ display: p.thumbnailUrl ? 'none' : 'flex' }}
                        >
                          <span>VIDEO</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.catBadge}>{p.category}</span>
                    </td>
                    <td>
                      <p className={styles.descText}>
                        {p.description || (
                          <span style={{ color: 'rgba(255, 255, 255, 0.35)', fontStyle: 'italic' }}>
                            No description
                          </span>
                        )}
                      </p>
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
                <label className={styles.fieldLabel}>CATEGORY (OPTIONAL)</label>
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
                      placeholder="Type category name (optional, defaults to 'Personal Projects')"
                      value={isCustomCategory ? customCategoryInput : formData.category}
                      onChange={(e) => {
                        setCustomCategoryInput(e.target.value);
                        setFormData((prev) => ({ ...prev, category: e.target.value }));
                      }}
                      className={styles.input}
                      autoFocus
                    />
                    {categoriesPresent.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setFormData((prev) => ({ ...prev, category: categoriesPresent[0] || 'Personal Projects' }));
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
                <label className={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Project description, equipment details, or notes (optional)..."
                  className={styles.textarea}
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
                  Paste Google Drive image link or any direct web image link for the poster preview.
                  <br />
                  💡 <strong>Important for Google Drive:</strong> The file sharing permission MUST be set to <strong>"Anyone with the link can view"</strong>, otherwise Google blocks the image from displaying.
                </p>

                {/* Live Preview */}
                {formData.thumbnailUrl && (
                  <div className={styles.previewBox}>
                    <div className={styles.previewHeaderRow}>
                      <span className={styles.previewLabel}>THUMBNAIL PREVIEW:</span>
                      {thumbAspectInfo && (
                        <span
                          className={
                            thumbAspectInfo.isPortrait
                              ? styles.portraitBadge
                              : styles.landscapeBadge
                          }
                        >
                          {thumbAspectInfo.isPortrait ? '📱 PORTRAIT' : '🖥️ LANDSCAPE'} ({thumbAspectInfo.width}×{thumbAspectInfo.height})
                        </span>
                      )}
                    </div>
                    <img
                      src={formatImageSrc(formData.thumbnailUrl)}
                      alt="Preview"
                      className={styles.previewImg}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        setThumbAspectInfo(null);
                        const errBox = document.getElementById('thumb-preview-error');
                        if (errBox) errBox.style.display = 'block';
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                        const errBox = document.getElementById('thumb-preview-error');
                        if (errBox) errBox.style.display = 'none';
                        if (e.target.naturalWidth && e.target.naturalHeight) {
                          const w = e.target.naturalWidth;
                          const h = e.target.naturalHeight;
                          setThumbAspectInfo({
                            width: w,
                            height: h,
                            isPortrait: w < h,
                          });
                        }
                      }}
                    />
                    {thumbAspectInfo && (
                      <p className={styles.aspectHint}>
                        {thumbAspectInfo.isPortrait
                          ? '✓ Detected portrait image. Will be displayed with native vertical proportions in the portfolio.'
                          : '✓ Detected landscape image. Will be displayed with native widescreen proportions in the portfolio.'}
                      </p>
                    )}
                    <div
                      id="thumb-preview-error"
                      style={{
                        display: 'none',
                        color: '#fca5a5',
                        fontSize: '0.8rem',
                        marginTop: '8px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        lineHeight: 1.5,
                      }}
                    >
                      ⚠️ <strong>Thumbnail preview failed to load.</strong><br />
                      If this is a Google Drive image, please ensure its sharing permission is set to <strong>"Anyone with the link can view"</strong> (in Google Drive: right-click image → <em>Share</em> → <em>General access</em> → <em>Anyone with the link</em>).
                    </div>
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

      {/* ADMIN CREDENTIALS MODAL */}
      {isKeyModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsKeyModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>ADMIN CREDENTIAL SETTINGS</h3>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <p className={styles.fieldNote} style={{ marginBottom: '16px' }}>
              Update the admin username or password stored securely in the database.
            </p>

            {keyFormError && <div className={styles.formErrorBox}>{keyFormError}</div>}

            <form onSubmit={handleUpdateKeySettings} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>CURRENT PASSWORD *</label>
                <input
                  type="password"
                  value={keyFormData.currentPassword}
                  onChange={(e) =>
                    setKeyFormData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  placeholder="Enter current password"
                  className={styles.input}
                  required
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>NEW USERNAME (OPTIONAL)</label>
                <input
                  type="text"
                  value={keyFormData.newUsername}
                  onChange={(e) =>
                    setKeyFormData((prev) => ({ ...prev, newUsername: e.target.value }))
                  }
                  placeholder="Enter new admin username"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>NEW PASSWORD (OPTIONAL)</label>
                <input
                  type="password"
                  value={keyFormData.newPassword}
                  onChange={(e) =>
                    setKeyFormData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter new password (min. 3 characters)"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>CONFIRM NEW PASSWORD</label>
                <input
                  type="password"
                  value={keyFormData.confirmNewPassword}
                  onChange={(e) =>
                    setKeyFormData((prev) => ({ ...prev, confirmNewPassword: e.target.value }))
                  }
                  placeholder="Re-type new password"
                  className={styles.input}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  CANCEL
                </button>
                <button type="submit" className={styles.submitBtn}>
                  SAVE CREDENTIALS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REORDER CATEGORY MODAL */}
      {isReorderModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsReorderModalOpen(false)}>
          <div className={styles.reorderModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.reorderModalHeader}>
              <h3 className={styles.modalTitle}>ARRANGE VIDEO SEQUENCE</h3>
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            {/* Category selection & Auto-group action */}
            <div className={styles.reorderCategorySelector}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
                <label className={styles.reorderCategoryLabel}>SELECT CATEGORY:</label>
                <select
                  value={reorderCategory}
                  onChange={(e) => handleCategoryChangeInReorder(e.target.value)}
                  className={styles.select}
                >
                  {categoriesPresent.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({projects.filter((p) => p.category === cat).length} videos)
                    </option>
                  ))}
                </select>
              </div>

              {reorderList.length > 1 && (
                <button
                  type="button"
                  onClick={handleAutoGroupByRatioInAdmin}
                  className={styles.reorderAutoRatioBtn}
                  title="Group videos by card ratio (vertical 9:16 together, horizontal 16:9 together)"
                >
                  ⚡ AUTO-GROUP BY RATIO
                </button>
              )}
            </div>

            {/* Reorderable list */}
            <div className={styles.reorderListContainer}>
              {reorderList.length > 0 ? (
                reorderList.map((item, idx) => (
                  <div key={item.id} className={styles.reorderItemCard}>
                    <span className={styles.reorderHandle} title="Drag item">⠿</span>
                    <span className={styles.reorderItemIndex}>#{idx + 1}</span>

                    {item.thumbnailUrl ? (
                      <img
                        src={formatImageSrc(item.thumbnailUrl)}
                        alt=""
                        className={styles.reorderThumb}
                      />
                    ) : (
                      <div className={styles.reorderThumbPlaceholder}>
                        <span>VID</span>
                      </div>
                    )}

                    <div className={styles.reorderItemInfo}>
                      <p className={styles.reorderItemTitle}>
                        {item.description || item.category || 'Untitled Project'}
                      </p>
                    </div>

                    <div className={styles.reorderShiftBtns}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveReorderItem(idx, idx - 1)}
                        className={styles.reorderShiftBtn}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === reorderList.length - 1}
                        onClick={() => moveReorderItem(idx, idx + 1)}
                        className={styles.reorderShiftBtn}
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px 0' }}>
                  No videos in this category.
                </p>
              )}
            </div>

            <div className={styles.reorderModalFooter}>
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className={styles.cancelBtn}
                disabled={savingReorder}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSaveReorderInAdmin}
                className={styles.submitBtn}
                disabled={savingReorder || reorderList.length === 0}
              >
                {savingReorder ? 'SAVING SEQUENCE...' : '✓ SAVE SEQUENCE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
