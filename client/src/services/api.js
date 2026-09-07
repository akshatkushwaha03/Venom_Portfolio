/**
 * Venom Portfolio API Client Service
 * Connects the React frontend with the Express backend & Supabase Storage.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Check backend connection status
 */
export async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
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
