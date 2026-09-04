import React from 'react';
import styles from './Button.module.css';

/**
 * Reusable Button Component
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'glow'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {string} [props.href] - If provided, renders as an anchor tag
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  href,
  leftIcon,
  rightIcon,
  className = '',
  children,
  ...restProps
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant] || styles.primary,
    styles[size] || styles.md,
    className,
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
      <span className={styles.label}>{children}</span>
      {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
    </>
  );

  if (href) {
    return (
      <a href={href} className={buttonClasses} {...restProps}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={buttonClasses} {...restProps}>
      {content}
    </button>
  );
};

export default Button;
