import React, { useState } from 'react';
import styles from './KineticMarquee.module.css';

export const KineticMarquee = () => {
  const [isHovered, setIsHovered] = useState(false);

  const marqueeItems = [
    'CINEMATOGRAPHY',
    'VIDEOGRAPHY',
    'FILM EDITING',
    'PHOTOGRAPHY',
    '35MM STORIES',
    'VISUAL DIRECTION',
    'EVERY FRAME WITH PURPOSE',
    'VENOM STUDIO',
  ];

  return (
    <div
      className={styles.marqueeSection}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-hidden="true"
    >
      <div className={`${styles.marqueeTrack} ${isHovered ? styles.trackSlow : ''}`}>
        {/* Render 3 sets for seamless infinite loop */}
        {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, index) => (
          <div key={index} className={styles.marqueeItem}>
            <span className={styles.itemText}>{item}</span>
            <span className={styles.starSymbol}>✦</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KineticMarquee;
