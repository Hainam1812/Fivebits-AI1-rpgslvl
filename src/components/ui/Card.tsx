import React from 'react';
import { getCategoryKey } from '../../config/categoryTheme.js';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'elevated' | 'glow' | 'gold' | 'interactive';
  category?: string;
  locked?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'surface',
  category,
  locked = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'relative overflow-hidden';

  const variantStyles = {
    surface: 'pixel-frame pixel-frame-muted',
    elevated: 'pixel-frame-elevated pixel-frame-muted',
    glow: 'pixel-frame pixel-frame-violet',
    gold: 'pixel-frame pixel-frame-gold',
    interactive: 'pixel-frame pixel-frame-muted pixel-frame-interactive cursor-pointer',
  };

  const categoryAttr = category ? getCategoryKey(category) : undefined;
  const frameOverride = category ? '' : variantStyles[variant];
  const baseFrame = category
    ? variant === 'elevated'
      ? 'pixel-frame-elevated'
      : variant === 'interactive'
      ? 'pixel-frame pixel-frame-interactive cursor-pointer'
      : 'pixel-frame'
    : frameOverride;

  return (
    <div
      data-category={categoryAttr}
      className={`${baseStyles} ${baseFrame} ${locked ? 'pixel-locked' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
