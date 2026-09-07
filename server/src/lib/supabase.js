/**
 * Supabase Storage Integration Service
 * Manages public bucket provisioning, video/image uploads, and active non-expiring public URLs.
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
 * Ensure the public storage bucket exists on Supabase.
 * The bucket is explicitly public (public: true) so URLs never expire.
 */
async function ensureBucket() {
  if (!isConfigured()) {
    console.warn('[SUPABASE STORAGE] SUPABASE_SERVICE_ROLE_KEY is not set. Storage operations will require this key.');
    return false;
  }

  try {
    if (supabaseClient) {
      const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();
      if (!listError && buckets) {
        const bucketExists = buckets.some((b) => b.name === BUCKET_NAME);
        if (!bucketExists) {
          const { error: createError } = await supabaseClient.storage.createBucket(BUCKET_NAME, {
            public: true, // Bucket is public for non-expiring URLs
            fileSizeLimit: 1048576000, // 1GB
            allowedMimeTypes: ['video/*', 'image/*'],
          });
          if (createError) {
            console.error(`[SUPABASE STORAGE] Error creating public bucket '${BUCKET_NAME}':`, createError.message);
            return false;
          }
          console.log(`[SUPABASE STORAGE] Created public storage bucket: '${BUCKET_NAME}'`);
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
            public: true, // Explicitly public
            file_size_limit: 1048576000,
            allowed_mime_types: ['video/*', 'image/*'],
          }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          console.error(`[SUPABASE STORAGE] REST failed to create bucket:`, errText);
          return false;
        }
        console.log(`[SUPABASE STORAGE] Created public storage bucket via REST: '${BUCKET_NAME}'`);
      }
      return true;
    }
  } catch (err) {
    console.error('[SUPABASE STORAGE] Error checking/creating bucket:', err.message);
  }

  return false;
}

/**
 * Upload a video file to the public Supabase bucket.
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
 * Upload an image file to the public Supabase bucket.
 * @param {Buffer} fileBuffer - The image file buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - e.g. 'image/jpeg', 'image/png'
 * @returns {Promise<string>} The storage path inside the bucket
 */
async function uploadImage(fileBuffer, originalName = 'image.png', mimeType = 'image/png') {
  if (!isConfigured()) {
    throw new Error('Supabase Storage is not configured. Please set SUPABASE_SERVICE_ROLE_KEY in server/.env');
  }

  const ext = path.extname(originalName) || '.png';
  const uniqueId = crypto.randomUUID();
  const sanitizedBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = `images/${Date.now()}-${uniqueId.substring(0, 8)}-${sanitizedBase}${ext}`;

  await ensureBucket();

  if (supabaseClient) {
    const { error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload image to Supabase Storage: ${error.message}`);
    }

    return filePath;
  }

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
    throw new Error(`Failed to upload image via REST: ${errorText}`);
  }

  return filePath;
}

/**
 * Get permanent, non-expiring public URL for a file in the public Supabase bucket.
 * @param {string} filePath - Storage path inside the bucket (e.g. 'videos/123-intro.mp4')
 * @returns {string|null} The active, non-expiring public URL
 */
function getPublicVideoUrl(filePath) {
  if (!filePath) return null;

  // If already a full http/https URL (e.g. external link), return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  if (supabaseClient) {
    const { data } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (data && data.publicUrl) {
      return data.publicUrl;
    }
  }

  // Direct REST / URL construction fallback for public buckets
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
}

/**
 * Backward-compatible alias function for getPublicVideoUrl (does not expire).
 * @param {string} videoPath - Storage path inside the bucket
 * @returns {Promise<string>|string} Permanent public URL
 */
async function getSignedVideoUrl(videoPath) {
  return getPublicVideoUrl(videoPath);
}

/**
 * Delete a video or image file from the Supabase bucket
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
    console.warn(`[SUPABASE STORAGE] Could not delete file ${videoPath}:`, err.message);
    return false;
  }
}

module.exports = {
  isConfigured,
  ensureBucket,
  uploadVideo,
  uploadImage,
  getPublicVideoUrl,
  getPublicUrl: getPublicVideoUrl,
  getSignedVideoUrl,
  deleteVideo,
  BUCKET_NAME,
  SUPABASE_URL,
};
