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
 * Upload a media file (video or image) to Supabase Storage with progress tracking
 * @param {File} file - The file object
 * @param {'video' | 'image'} type - The file type
 * @param {function} [onProgress] - Progress callback (percent: number) => void
 */
export function uploadMediaFile(file, type = 'video', onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    const endpoint = type === 'image' ? `${API_BASE}/api/upload/image` : `${API_BASE}/api/upload/video`;
    xhr.open('POST', endpoint);

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
        resolve(responseJson);
      } else {
        const errorMsg = responseJson?.message || `Upload failed with HTTP ${xhr.status}`;
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload. Check backend connection.'));
    };

    xhr.send(formData);
  });
}

/**
 * Upload a project with video directly
 */
export function createProjectWithUpload(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/upload/video`);

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
      reject(new Error('Network error during file upload. Check backend connection.'));
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
