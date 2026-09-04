import React, { useEffect } from 'react';
import styles from './MobileMenu.module.css';

export const MobileMenu = ({ isOpen, onClose }) => {
  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems = [
    { label: 'ABOUT', href: '#about', index: '01' },
    { label: 'WORK', href: '#work', index: '02' },
    { label: 'SERVICES', href: '#services', index: '03' },
    { label: 'CONTACT', href: '#contact', index: '04' },
  ];

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      <nav className={styles.menuList}>
        {navItems.map((item) => (
          <div key={item.label} className={styles.menuItem}>
            <a
              href={item.href}
              className={styles.link}
              onClick={onClose}
            >
              <span className={styles.linkIndex}>/{item.index}</span>
              {item.label}
            </a>
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.statusContainer}>
          <span className={styles.dot} />
          <span>AVAILABLE FOR WORK</span>
        </div>
        <p className={styles.metaText}>
          VENOM. — CINEMATOGRAPHER & VISUAL STORYTELLER
        </p>
      </div>
    </div>
  );
};

export default MobileMenu;
