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
 * @param {string} [genre] - Optional filter by genre (e.g., 'cinema', 'the-cut')
 */
export async function getProjects(genre) {
  try {
    const url = genre && genre !== 'all' 
      ? `${API_BASE}/api/projects?genre=${encodeURIComponent(genre)}`
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
 * Upload a new project with video to private Supabase Storage & save to Prisma
 * Uses XMLHttpRequest to provide real-time upload progress tracking.
 * 
 * @param {FormData} formData - Contains { title, shortDescription, genre, video (file) }
 * @param {function} [onProgress] - Callback (percent: number) => void
 */
export function createProjectWithUpload(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/projects`);

    if (xhr.upload && onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.onload = () => {
      let responseJson = null;
      try {
        responseJson = JSON.parse(xhr.responseText);
      } catch (e) {
        // response was not JSON
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(responseJson?.data || responseJson);
      } else {
        const errorMsg = responseJson?.message || `Upload failed with HTTP ${xhr.status}`;
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error: Unable to reach the server. Make sure the backend is running on port 5001.'));
    };

    xhr.send(formData);
  });
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
 * Check Supabase Storage bucket status
 */
export async function getStorageStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/projects/storage/status`);
    if (!res.ok) return { configured: false };
    return await res.json();
  } catch (err) {
    return { configured: false, error: err.message };
  }
}
