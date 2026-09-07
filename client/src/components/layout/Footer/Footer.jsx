import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import styles from './Footer.module.css';

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          {/* Brand Info */}
          <div className={styles.brandCol}>
            <Link to="/" className={styles.brandLogo}>
              VENOM<span className={styles.dot}>.</span>
            </Link>
            <p className={styles.tagline}>
              Cinematographer & Visual Storyteller crafting high-impact cinematic experiences worldwide.
            </p>
            <div className={styles.statusPill}>
              <span className={styles.statusDot} />
              <span>AVAILABLE FOR GLOBAL COMMISSIONS</span>
            </div>
          </div>

          {/* Nav Links */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>NAVIGATION</h4>
            <nav className={styles.navLinks}>
              <NavLink to="/" className={styles.link}>HOME</NavLink>
              <NavLink to="/about" className={styles.link}>ABOUT</NavLink>
              <NavLink to="/work" className={styles.link}>WORK</NavLink>
              <NavLink to="/services" className={styles.link}>SERVICES</NavLink>
              <NavLink to="/contact" className={styles.link}>CONTACT</NavLink>
            </nav>
          </div>

          {/* Social Links */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>CONNECT</h4>
            <div className={styles.socialLinks}>
              <a href="https://www.instagram.com/iam__v3nom/" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                INSTAGRAM ↗
              </a>
              <a href="https://www.youtube.com/@Venom-The-Jod-" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                YOUTUBE ↗
              </a>
              <a href="https://www.linkedin.com/in/akshat-kushwaha-08a448274/" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                LINKEDIN ↗
              </a>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=venom.creative.stu@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                MAIL ↗
              </a>
            </div>
          </div>

          {/* Back to top button */}
          <div className={styles.actionCol}>
            <button type="button" onClick={scrollToTop} className={styles.scrollTopBtn} aria-label="Scroll back to top">
              <span className={styles.arrowUp}>↑</span>
              <span>TOP</span>
            </button>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} VENOM STUDIOS. ALL RIGHTS RESERVED.
          </p>
          <div className={styles.metaBadge}>
            <span>CINEMATOGRAPHY & VISUAL DIRECTION</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
