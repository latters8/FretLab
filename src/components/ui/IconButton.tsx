import type React from 'react';
import { forwardRef } from 'react';
import './IconButton.css';

export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonTone = 'ghost' | 'subtle';

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Required: short text describing what the button does, e.g. "Toggle metronome" */
  'aria-label': string;
  /** Optional tooltip text (defaults to aria-label) */
  title?: string;
  size?: IconButtonSize;
  tone?: IconButtonTone;
  active?: boolean;
  children: React.ReactNode;
}

/**
 * Square icon-only button. Enforces a minimum 32–44px touch target
 * and requires an aria-label so screen readers always have context.
 *
 * Use for: nav, transport controls (play/stop), close, menu toggles.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      'aria-label': ariaLabel,
      title,
      size = 'md',
      tone = 'ghost',
      active = false,
      disabled,
      className,
      style,
      type = 'button',
      children,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      'fl-icon-button',
      `fl-icon-button--${size}`,
      `fl-icon-button--${tone}`,
      active ? 'fl-icon-button--active' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled}
        aria-label={ariaLabel}
        title={title ?? ariaLabel}
        aria-pressed={active || undefined}
        style={style}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
