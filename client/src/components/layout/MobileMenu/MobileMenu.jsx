import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
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
    { label: 'HOME', to: '/', index: '01' },
    { label: 'ABOUT', to: '/about', index: '02' },
    { label: 'WORK', to: '/work', index: '03' },
    { label: 'SERVICES', to: '/services', index: '04' },
    { label: 'CONTACT', to: '/contact', index: '05' },
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
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.activeLink : ''}`
              }
              onClick={onClose}
            >
              <span className={styles.linkIndex}>/{item.index}</span>
              {item.label}
            </NavLink>
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

