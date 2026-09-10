/**
 * Venom Portfolio API Client Service
 * Connects the React frontend with the Express backend & Supabase Storage.
 */

const getApiBase = () => {
  let url = import.meta.env.VITE_API_URL;
  if (url) {
    url = url.replace(/\/+$/, '');
    if (url.endsWith('/api')) {
      url = url.slice(0, -4);
    }
    return url;
  }
  // If running locally in development without VITE_API_URL, target local backend port 5000
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:5000';
  }
  return '';
};

export const API_BASE = getApiBase();

/**
 * Check backend connection status
 */
export async function checkServerHealth() {
  try {
    let res = await fetch(`${API_BASE}/api/health`, {
      headers: { Accept: 'application/json' },
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await fetch('/api/health', {
        headers: { Accept: 'application/json' },
      }).catch(() => null);
    }

    if (!res || !res.ok) {
      res = await fetch('http://localhost:5000/api/health', {
        headers: { Accept: 'application/json' },
      }).catch(() => null);
    }

    if (!res || !res.ok) throw new Error(`HTTP status ${res ? res.status : 'network error'}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Health check failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all projects from database
 * @param {string} [category] - Optional filter by category (e.g., 'Personal Projects')
 */
export async function getProjects(category) {
  try {
    const url = category && category !== 'all' 
      ? `${API_BASE}/api/projects?category=${encodeURIComponent(category)}`
      : `${API_BASE}/api/projects`;

    const res = await fetch(url);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to fetch projects (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error('[API] Error fetching projects:', err);
    throw err;
  }
}

/**
 * Fetch distinct categories from database
 */
export async function getCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/projects/categories`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error('[API] Error fetching categories:', err);
    return [];
  }
}

/**
 * Fetch a single project by ID
 */
export async function getProjectById(id) {
  const res = await fetch(`${API_BASE}/api/projects/${id}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to fetch project');
  }
  const data = await res.json();
  return data.data;
}

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('venom_token');
  }
  return null;
};

export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('venom_token', token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('venom_token');
  }
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Login Admin with username and password
 */
export async function loginAdmin(username, password) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
  } catch (err) {
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      try {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
      } catch {
        throw new Error(`Cannot connect to backend server at ${API_BASE}. Make sure the server is running.`);
      }
    } else {
      throw new Error('Network error: Unable to reach backend API.');
    }
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('API server returned unexpected non-JSON response. Please check server status.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Invalid username or password.');
  }

  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

/**
 * Verify current active user session
 */
export async function getMe() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      removeAuthToken();
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

/**
 * Update Admin Username/Password in Database
 */
export async function updateAdminCredentials(currentPassword, newUsername, newPassword) {
  const res = await fetch(`${API_BASE}/api/auth/update-credentials`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ currentPassword, newUsername, newPassword }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update admin credentials');
  }

  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

/**
 * Reset Admin Password & Optional Username using Master Recovery Key
 */
export async function resetAdminPassword(masterKey, newPassword, newUsername) {
  const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ masterKey, newPassword, newUsername }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Password reset failed');
  }
  return data;
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id) {
  const res = await fetch(`${API_BASE}/api/projects/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to delete project');
  }
  return await res.json();
}

/**
 * Batch update the order sequence of projects
 * @param {string[]} orderedIds - Array of project IDs in new sequence
 */
export async function reorderProjects(orderedIds) {
  const res = await fetch(`${API_BASE}/api/projects/reorder`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to update project order');
  }
  return await res.json();
}

