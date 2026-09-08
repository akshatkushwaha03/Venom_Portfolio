/**
 * Venom Portfolio API Client Service
 * Connects the React frontend with the Express backend & Supabase Storage.
 */

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  // If running locally in development without VITE_API_URL, target local backend port 3000
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:3000';
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
      res = await fetch('http://localhost:3000/api/health', {
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

/**
 * Delete a project by ID
 */
export async function deleteProject(id) {
  const res = await fetch(`${API_BASE}/api/projects/${id}`, {
    method: 'DELETE',
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
    },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to update project order');
  }
  return await res.json();
}

