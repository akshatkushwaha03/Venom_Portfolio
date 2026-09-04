import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import MobileMenu from '../MobileMenu';
import styles from './Header.module.css';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reveal animation
    const timer = setTimeout(() => setIsLoaded(true), 80);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { label: 'ABOUT', to: '/about' },
    { label: 'WORK', to: '/work' },
    { label: 'SERVICES', to: '/services' },
    { label: 'CONTACT', to: '/contact' },
  ];

  return (
    <>
      <header
        className={`
          ${styles.header}
          ${isScrolled ? styles.headerScrolled : ''}
          ${mobileMenuOpen ? styles.headerMenuOpen : ''}
        `}
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(-16px)',
          transition: 'opacity 0.6s var(--ease-smooth), transform 0.6s var(--ease-smooth)',
        }}
      >
        <div className={styles.container}>
          {/* Brand Logo */}
          <Link to="/" className={styles.brand} aria-label="VENOM. Home">
            <span>VENOM</span>
            <span className={styles.brandDot}>.</span>
          </Link>

          {/* Center Navigation (Desktop) */}
          <nav className={styles.nav} aria-label="Main Navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Status Indicator */}
          <Link to="/contact" className={styles.statusAction}>
            <span className={styles.dot} />
            <span>AVAILABLE FOR WORK</span>
          </Link>

          {/* Hamburger Menu Toggle (Mobile) */}
          <button
            type="button"
            className={`${styles.hamburger} ${mobileMenuOpen ? styles.hamburgerOpen : ''}`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
};

export default Header;

