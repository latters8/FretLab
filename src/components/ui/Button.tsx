import type React from 'react';
import { forwardRef } from 'react';
import { Spinner } from './Spinner';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  active?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

/**
 * Shared button. Use this instead of bare <button style={…}> everywhere.
 *
 * - `loading` shows a spinner and disables the button automatically.
 * - `active` applies a "selected" appearance (for toggle/segmented controls).
 * - Always respects :focus-visible for keyboard users.
 * - Respects prefers-reduced-motion.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      active = false,
      disabled,
      iconLeft,
      iconRight,
      fullWidth = false,
      children,
      className,
      style,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    const classes = [
      'fl-button',
      `fl-button--${variant}`,
      `fl-button--${size}`,
      fullWidth ? 'fl-button--full' : '',
      loading ? 'fl-button--loading' : '',
      active ? 'fl-button--active' : '',
      !children && (iconLeft || iconRight) ? 'fl-button--icon-only' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-pressed={active || undefined}
        style={style}
        {...rest}
      >
        {loading && (
          <span className="fl-button__spinner" aria-hidden="true">
            <Spinner size={size === 'lg' ? 'md' : 'sm'} />
          </span>
        )}
        {iconLeft && !loading && (
          <span className="fl-button__icon" aria-hidden="true">
            {iconLeft}
          </span>
        )}
        {children !== undefined && children !== null && children !== false && (
          <span className="fl-button__label">{children}</span>
        )}
        {iconRight && !loading && (
          <span className="fl-button__icon" aria-hidden="true">
            {iconRight}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
