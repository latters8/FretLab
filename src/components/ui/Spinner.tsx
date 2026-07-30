import type React from 'react';
import './Spinner.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Accessible label; defaults to "Loading" */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Pure-CSS animated spinner. Inherits --accent for color, so it
 * respects the active theme. Stops pulsing for users who request
 * reduced motion.
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  label = 'Loading',
  className,
  style,
}) => {
  const classes = ['fl-spinner', `fl-spinner--${size}`, className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={style}
      role="status"
      aria-live="polite"
      aria-label={label}
    />
  );
};
