import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'cyan' | 'gold' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-[2px] transition-transform duration-100 select-none cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] min-h-[44px] disabled:bg-[var(--panel-2)] disabled:text-[var(--muted)] disabled:border-[var(--ink)] disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs px-3 py-2 gap-1.5 whitespace-nowrap shrink-0',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[var(--gold)] hover:bg-[#F3D392] text-[var(--ink)] border-[3px] border-[var(--ink)] shadow-[0_4px_0_0_var(--ink)] active:translate-y-[4px] active:shadow-none',
    cyan:
      'bg-[var(--sky)] hover:bg-[#82C7FA] text-[var(--ink)] border-[3px] border-[var(--ink)] shadow-[0_4px_0_0_var(--ink)] active:translate-y-[4px] active:shadow-none',
    gold:
      'bg-[var(--gold)] hover:bg-[#F3D392] text-[var(--ink)] border-[3px] border-[var(--ink)] shadow-[0_4px_0_0_var(--ink)] active:translate-y-[4px] active:shadow-none',
    secondary:
      'bg-transparent hover:bg-[var(--panel-2)] text-[var(--text)] border-2 border-[var(--muted)] hover:border-[var(--gold)] shadow-[0_3px_0_0_var(--ink)] active:translate-y-[3px] active:shadow-none',
    danger:
      'bg-[var(--danger)] hover:bg-[#FF8598] text-[var(--ink)] border-[3px] border-[var(--ink)] shadow-[0_4px_0_0_var(--ink)] active:translate-y-[4px] active:shadow-none',
    ghost:
      'bg-transparent hover:bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--text)] border-2 border-transparent',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
