import React, { useState, useRef } from 'react';
import { createProjectWithUpload } from '@/services/api';
import { GENRE_CATEGORIES } from './projectsData';
import styles from './ProjectUploadModal.module.css';

export const ProjectUploadModal = ({ isOpen, onClose, onProjectCreated, initialGenreKey }) => {
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [genre, setGenre] = useState(initialGenreKey || 'cinema');
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file (.mp4, .mov, .webm)');
        return;
      }
      setVideoFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Project title is required');
      return;
    }

    if (!shortDescription.trim()) {
      setError('Short description is required');
      return;
    }

    if (!videoFile) {
      setError('Please select a video file to upload to the private Supabase bucket');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(0);
      setStatusMessage('Transmitting video to private Supabase bucket...');

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('shortDescription', shortDescription.trim());
      formData.append('genre', genre);
      formData.append('video', videoFile);

      const createdProject = await createProjectWithUpload(formData, (percent) => {
        setProgress(percent);
        if (percent === 100) {
          setStatusMessage('Ingesting metadata to Supabase PostgreSQL via Prisma...');
        } else {
          setStatusMessage(`Uploading video: ${percent}%`);
        }
      });

      setStatusMessage('Upload complete!');
      setTimeout(() => {
        onProjectCreated(createdProject);
        handleClose();
      }, 700);
    } catch (err) {
      console.error('Project upload error:', err);
      setError(err.message || 'Failed to upload project. Check server connection.');
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setTitle('');
    setShortDescription('');
    setVideoFile(null);
    setProgress(0);
    setError(null);
    setStatusMessage('');
    onClose();
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) handleClose();
      }}
    >
      <div className={styles.modal}>
        {/* Top Bar */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.systemTag}>// VENOM ARCHIVE INGESTION</span>
            <h3 id="upload-modal-title" className={styles.modalHeading}>
              NEW CINEMA PROJECT
            </h3>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            disabled={uploading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBanner} role="alert">
              <span className={styles.errorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Project Title */}
          <div className={styles.formGroup}>
            <label htmlFor="project-title" className={styles.label}>
              PROJECT TITLE <span className={styles.reqStar}>*</span>
            </label>
            <input
              id="project-title"
              type="text"
              className={styles.input}
              placeholder="e.g. HYPERION PROTOCOL // 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              required
            />
          </div>

          {/* Genre Category */}
          <div className={styles.formGroup}>
            <label htmlFor="project-genre" className={styles.label}>
              DISCIPLINE / GENRE <span className={styles.reqStar}>*</span>
            </label>
            <select
              id="project-genre"
              className={styles.select}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={uploading}
            >
              {GENRE_CATEGORIES.map((g) => (
                <option key={g.key} value={g.key}>
                  [{g.id}] {g.title} — {g.discipline}
                </option>
              ))}
            </select>
          </div>

          {/* Short Description */}
          <div className={styles.formGroup}>
            <label htmlFor="project-desc" className={styles.label}>
              SHORT DESCRIPTION <span className={styles.reqStar}>*</span>
            </label>
            <textarea
              id="project-desc"
              className={styles.textarea}
              rows={3}
              placeholder="Brief narrative summary, lighting mood, or director statement..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              disabled={uploading}
              required
            />
          </div>

          {/* Video File Picker */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              VIDEO ASSET (PRIVATE BUCKET) <span className={styles.reqStar}>*</span>
            </label>
            <div
              className={`${styles.dropZone} ${videoFile ? styles.dropZoneActive : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/*"
                className={styles.hiddenFileInput}
                onChange={handleFileChange}
                disabled={uploading}
              />
              <div className={styles.dropZoneContent}>
                <span className={styles.uploadCloudIcon}>🎬</span>
                {videoFile ? (
                  <div className={styles.fileSelectedInfo}>
                    <p className={styles.fileName}>{videoFile.name}</p>
                    <p className={styles.fileMeta}>
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB • {videoFile.type || 'Video'}
                    </p>
                    <span className={styles.changeFileTag}>Click to change file</span>
                  </div>
                ) : (
                  <div>
                    <p className={styles.dropMainText}>Click or drag video file here</p>
                    <p className={styles.dropSubText}>Supported: MP4, WebM, MOV (Private Supabase Storage)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className={styles.progressContainer}>
              <div className={styles.progressBarWrapper}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className={styles.progressMetaRow}>
                <span className={styles.statusText}>{statusMessage}</span>
                <span className={styles.percentText}>{progress}%</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={uploading}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={uploading}
            >
              {uploading ? 'INGESTING TO SUPABASE...' : 'UPLOAD TO PRIVATE STORAGE ↗'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectUploadModal;
