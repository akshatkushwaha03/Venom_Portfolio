/**
 * Supabase Storage Integration Service
 * Manages private bucket provisioning, video uploads, and signed URL generation.
 */

const path = require('path');
const crypto = require('crypto');

let createClient = null;
try {
  const supabaseModule = require('@supabase/supabase-js');
  createClient = supabaseModule.createClient;
} catch (e) {
  // @supabase/supabase-js not yet installed; will use native fetch fallback
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mntlrqjxwzompvjtmzcs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'portfolio-videos';

let supabaseClient = null;
if (createClient && SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn('[SUPABASE] Failed to initialize Supabase client:', err.message);
  }
}

/**
 * Check if Supabase key is configured
 */
function isConfigured() {
  return Boolean(SUPABASE_KEY && SUPABASE_KEY.trim().length > 10);
}

/**
 * Ensure the private storage bucket exists on Supabase.
 * The bucket is strictly private (public: false) as required.
 */
async function ensureBucket() {
  if (!isConfigured()) {
    console.warn('[SUPABASE STORAGE] SUPABASE_SERVICE_ROLE_KEY is not set. Private bucket operations will require this key.');
    return false;
  }

  try {
    if (supabaseClient) {
      const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();
      if (!listError && buckets) {
        const bucketExists = buckets.some((b) => b.name === BUCKET_NAME);
        if (!bucketExists) {
          const { error: createError } = await supabaseClient.storage.createBucket(BUCKET_NAME, {
            public: false, // Bucket is explicitly private
            fileSizeLimit: 1048576000, // 1GB
            allowedMimeTypes: ['video/*'],
          });
          if (createError) {
            console.error(`[SUPABASE STORAGE] Error creating private bucket '${BUCKET_NAME}':`, createError.message);
            return false;
          }
          console.log(`[SUPABASE STORAGE] Created private storage bucket: '${BUCKET_NAME}'`);
        }
        return true;
      }
    }

    // Direct REST API Fallback
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apiKey: SUPABASE_KEY,
      },
    });

    if (listRes.ok) {
      const buckets = await listRes.json();
      const exists = buckets.some((b) => b.name === BUCKET_NAME);
      if (!exists) {
        const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SUPABASE_KEY}`,
            apiKey: SUPABASE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: BUCKET_NAME,
            name: BUCKET_NAME,
            public: false, // Explicitly private
            file_size_limit: 1048576000,
            allowed_mime_types: ['video/*'],
          }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          console.error(`[SUPABASE STORAGE] REST failed to create bucket:`, errText);
          return false;
        }
        console.log(`[SUPABASE STORAGE] Created private storage bucket via REST: '${BUCKET_NAME}'`);
      }
      return true;
    }
  } catch (err) {
    console.error('[SUPABASE STORAGE] Error checking/creating bucket:', err.message);
  }

  return false;
}

/**
 * Upload a video file to the private Supabase bucket.
 * @param {Buffer} fileBuffer - The video file buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - e.g. 'video/mp4'
 * @returns {Promise<string>} The storage path inside the bucket
 */
async function uploadVideo(fileBuffer, originalName = 'video.mp4', mimeType = 'video/mp4') {
  if (!isConfigured()) {
    throw new Error('Supabase Storage is not configured. Please set SUPABASE_SERVICE_ROLE_KEY in server/.env');
  }

  // Generate unique file path
  const ext = path.extname(originalName) || '.mp4';
  const uniqueId = crypto.randomUUID();
  const sanitizedBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = `videos/${Date.now()}-${uniqueId.substring(0, 8)}-${sanitizedBase}${ext}`;

  // Make sure bucket exists
  await ensureBucket();

  if (supabaseClient) {
    const { error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
    }

    return filePath;
  }

  // REST API Fallback
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apiKey: SUPABASE_KEY,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload video via REST: ${errorText}`);
  }

  return filePath;
}

/**
 * Generate a time-limited signed URL for private video playback.
 * Since the bucket is private, this allows the browser to stream the video securely.
 * @param {string} videoPath - Storage path inside the bucket (e.g. 'videos/123-intro.mp4')
 * @param {number} expiresIn - Expiration in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} The signed URL
 */
async function getSignedVideoUrl(videoPath, expiresIn = 3600) {
  if (!videoPath) return null;

  // If already a full http/https URL (e.g. external link), return as-is
  if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
    return videoPath;
  }

  if (!isConfigured()) {
    // Return a relative backend streaming proxy route if direct Supabase signed URL cannot be computed
    return `/api/projects/stream?path=${encodeURIComponent(videoPath)}`;
  }

  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .createSignedUrl(videoPath, expiresIn);

      if (error) {
        console.warn(`[SUPABASE STORAGE] Error creating signed URL for ${videoPath}:`, error.message);
        return `/api/projects/stream?path=${encodeURIComponent(videoPath)}`;
      }

      return data.signedUrl;
    }

    // Direct REST API Fallback for signed URL
    const signUrl = `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET_NAME}/${videoPath}`;
    const response = await fetch(signUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apiKey: SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn }),
    });

    if (response.ok) {
      const data = await response.json();
      // Supabase returns relative signedURL: /object/sign/bucket/...
      if (data.signedURL) {
        return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
      }
    }
  } catch (err) {
    console.error(`[SUPABASE STORAGE] Failed to generate signed URL:`, err.message);
  }

  return `/api/projects/stream?path=${encodeURIComponent(videoPath)}`;
}

/**
 * Delete a video file from the private Supabase bucket
 * @param {string} videoPath - Storage path inside the bucket
 */
async function deleteVideo(videoPath) {
  if (!videoPath || !isConfigured()) return false;

  try {
    if (supabaseClient) {
      await supabaseClient.storage.from(BUCKET_NAME).remove([videoPath]);
      return true;
    }

    const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}`;
    await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apiKey: SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [videoPath] }),
    });
    return true;
  } catch (err) {
    console.warn(`[SUPABASE STORAGE] Could not delete video ${videoPath}:`, err.message);
    return false;
  }
}

module.exports = {
  isConfigured,
  ensureBucket,
  uploadVideo,
  getSignedVideoUrl,
  deleteVideo,
  BUCKET_NAME,
  SUPABASE_URL,
};
