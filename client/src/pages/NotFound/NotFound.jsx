import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

export const NotFound = () => {
  return (
    <section className={styles.container}>
      <div className={styles.content}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>FRAME NOT FOUND</h1>
        <p className={styles.desc}>
          The sequence or page you are attempting to view does not exist or has been relocated.
        </p>
        <Link to="/" className={styles.btn} data-magnetic>
          RETURN TO HOMEPAGE →
        </Link>
      </div>
    </section>
  );
};

export default NotFound;
