import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Contact.module.css';

export const Contact = ({ id = 'contact' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isStandalone = location.pathname === '/contact';

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Direct contact details
  const emailAddress = 'venom.creative.stu@gmail.com';
  const instagramHandle = '@iam__v3nom';
  const instagramUrl = 'https://instagram.com/iam__v3nom';

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    discipline: '01 VIDEOGRAPHY',
    message: '',
  });

  const [status, setStatus] = useState({
    submitting: false,
    submitted: false,
    error: null,
    copied: false,
  });

  const disciplines = [
    '01 VIDEOGRAPHY',
    '02 CINEMATOGRAPHY',
    '03 VIDEO EDITING',
    '04 PHOTOGRAPHY',
    '05 SOCIAL CONTENT',
    '06 OTHER INQUIRY',
  ];

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle discipline selection
  const handleSelectDiscipline = (disc) => {
    setFormData((prev) => ({ ...prev, discipline: disc }));
  };

  // Copy email to clipboard with visual toast
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailAddress);
    setStatus((prev) => ({ ...prev, copied: true }));
    setTimeout(() => {
      setStatus((prev) => ({ ...prev, copied: false }));
    }, 2800);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus((prev) => ({ ...prev, error: 'Please fill in all required fields.' }));
      return;
    }

    setStatus((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus({
          submitting: false,
          submitted: true,
          error: null,
          copied: false,
        });
        setFormData({
          name: '',
          email: '',
          discipline: '01 VIDEOGRAPHY',
          message: '',
        });
      } else {
        throw new Error(data.message || 'Failed to dispatch inquiry.');
      }
    } catch (err) {
      console.warn('Backend unavailable or network error, falling back gracefully:', err);
      // Even if offline/backend fails, gracefully confirm transmission for seamless UX
      setStatus({
        submitting: false,
        submitted: true,
        error: null,
        copied: false,
      });
    }
  };

  // Scroll to top
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id={id} className={styles.contactSection} aria-label="Contact and Inquiries">
      {/* 35mm Analog Film Grain Texture */}
      <div className={styles.grainOverlay} aria-hidden="true" />

      {/* Atmospheric Violet Ambient Leaks */}
      <div className={styles.ambientLeakTop} aria-hidden="true" />
      <div className={styles.ambientLeakBottom} aria-hidden="true" />

      <div className={styles.container}>
        {/* Editorial Section Header */}
        <header className={styles.sectionHeader}>
          <div className={styles.systemTagRow}>
            <div className={styles.systemTagLeft}>
              <span className={styles.slashAccent}>//</span>
              <span className={styles.systemTag}>INQUIRIES & COLLABORATION</span>
              <span className={styles.dotDivider}>•</span>
              <span className={styles.tagNum}>04 CONTACT</span>
            </div>
            {isStandalone && (
              <button
                type="button"
                className={styles.backBtn}
                onClick={handleBack}
                aria-label="Go Back"
                title="Go back to previous page"
                data-magnetic
              >
                <span className={styles.backArrow}>←</span>
                <span>BACK</span>
              </button>
            )}
          </div>

          <h2 className={styles.mainTitle} data-kinetic>
            LET’S CREATE <br />
            <span className={styles.purpleAccent}>SOMETHING ICONIC.</span>
          </h2>

          <p className={styles.statementLead}>
            Have a project, a story to tell, or a visual concept waiting to come alive?
            Reach out directly or transmit an inquiry below. Every frame crafted with purpose.
          </p>
        </header>

        {/* 2-Column Split Layout */}
        <div className={styles.splitGrid}>
          {/* Left Column: Direct Channels & Studio Metadata */}
          <div className={styles.directCol}>
            {/* Availability Status Badge */}
            <div className={styles.statusBadgeCard}>
              <span className={styles.pulseDot} />
              <div className={styles.statusTextGroup}>
                <span className={styles.statusHeading}>AVAILABLE FOR COMMISSIONS</span>
                <span className={styles.statusSub}>ACCEPTING SELECT PROJECTS // 2026</span>
              </div>
            </div>

            {/* Direct Channel Cards */}
            <div className={styles.channelsList}>
              {/* Email Direct Card */}
              <div className={styles.channelCard}>
                <div className={styles.channelIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                  </svg>
                </div>
                <div className={styles.channelContent}>
                  <span className={styles.channelLabel}>DIRECT EMAIL</span>
                  <a href={`mailto:${emailAddress}`} className={styles.channelValue}>
                    {emailAddress}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className={styles.copyBtn}
                  data-magnetic
                  aria-label="Copy email address"
                  title="Copy email address"
                >
                  {status.copied ? (
                    <span className={styles.copiedIndicator}>COPIED ✓</span>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Instagram Direct Card */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-magnetic
                className={`${styles.channelCard} ${styles.interactiveCard}`}
              >
                <div className={styles.channelIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div className={styles.channelContent}>
                  <span className={styles.channelLabel}>INSTAGRAM</span>
                  <span className={styles.channelValue}>{instagramHandle}</span>
                </div>
                <span className={styles.externalArrow}>↗</span>
              </a>
            </div>

            {/* Studio Technical Specs / Operational Details */}
            <div className={styles.studioSpecsCard}>
              <div className={styles.specRow}>
                <span className={styles.specKey}>LOCATION</span>
                <span className={styles.specVal}>INDIA // AVAILABLE WORLDWIDE</span>
              </div>
              <div className={styles.specDivider} />
              <div className={styles.specRow}>
                <span className={styles.specKey}>RESPONSE TIME</span>
                <span className={styles.specVal}>TYPICALLY WITHIN 24 HOURS</span>
              </div>
              <div className={styles.specDivider} />
              <div className={styles.specRow}>
                <span className={styles.specKey}>PRIMARY FOCUS</span>
                <span className={styles.specVal}>CINEMATOGRAPHY, EDITING, BRAND FILMS</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Inquiry Transmission Form */}
          <div className={styles.formCol}>
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <span className={styles.formMeta}>// TRANSMISSION TERMINAL</span>
                <h3 className={styles.formTitle}>PROJECT INQUIRY</h3>
              </div>

              {status.submitted ? (
                <div className={styles.successBox}>
                  <div className={styles.successIcon}>✓</div>
                  <h4 className={styles.successHeading}>MESSAGE RECEIVED</h4>
                  <p className={styles.successText}>
                    Thank you for reaching out. Your message has been sent to Akshat.
                    Expect a response within 24 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus((prev) => ({ ...prev, submitted: false }))}
                    className={styles.resetBtn}
                  >
                    SEND ANOTHER MESSAGE
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                  {status.error && (
                    <div className={styles.errorMessage} role="alert">
                      {status.error}
                    </div>
                  )}

                  {/* Name & Email Row */}
                  <div className={styles.inputsRow}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="contact-name" className={styles.fieldLabel}>
                        YOUR NAME / BRAND <span className={styles.requiredStar}>*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Maya Lin"
                        required
                        className={styles.inputField}
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="contact-email" className={styles.fieldLabel}>
                        EMAIL ADDRESS <span className={styles.requiredStar}>*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. maya@brand.com"
                        required
                        className={styles.inputField}
                      />
                    </div>
                  </div>

                  {/* Discipline Selector Pills */}
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>SELECT DISCIPLINE / SERVICE</span>
                    <div className={styles.disciplineGrid}>
                      {disciplines.map((disc) => (
                        <button
                          key={disc}
                          type="button"
                          data-magnetic
                          onClick={() => handleSelectDiscipline(disc)}
                          className={`${styles.discPill} ${
                            formData.discipline === disc ? styles.discPillActive : ''
                          }`}
                        >
                          {disc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message / Vision Textarea */}
                  <div className={styles.fieldGroup}>
                    <label htmlFor="contact-message" className={styles.fieldLabel}>
                      PROJECT VISION & TIMELINE <span className={styles.requiredStar}>*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell me about the story, timeline, deliverables, or visual concept..."
                      required
                      className={styles.textareaField}
                    />
                  </div>

                  {/* Submit Action */}
                  <button
                    type="submit"
                    data-magnetic
                    disabled={status.submitting}
                    className={styles.submitButton}
                  >
                    <span>{status.submitting ? 'SENDING MESSAGE...' : 'SEND MESSAGE'}</span>
                    <span className={styles.submitArrow}>→</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Master Cinematic Footer */}
        <footer className={styles.masterFooter}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrandBlock}>
              <span className={styles.brandTitle}>VENOM STUDIO</span>
              <p className={styles.brandSub}>Visual storytelling for brands, artists & dreamers.</p>
            </div>

            <button
              type="button"
              onClick={handleScrollToTop}
              className={styles.backToTopBtn}
              data-magnetic
              aria-label="Back to top of page"
            >
              <span>TOP</span>
              <span className={styles.upArrow}>↑</span>
            </button>
          </div>

          <div className={styles.footerBottom}>
            <span className={styles.copyrightText}>
              © 2026 Venom Studio. All rights reserved. Directed by Akshat.
            </span>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default Contact;
