import { ReactNode } from 'react';
import { cn } from '@/util/cn';
import { useAuth } from '@/hooks/useAuth';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({
  children,
  onClick,
  ariaLabel,
  ariaPressed,
  disabled,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  type = 'button',
}: ButtonProps) => {
  const { theme } = useAuth();

  const baseClasses =
    'font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

  const variantClasses = {
    // 🔵 PRIMARY - Always visible
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 focus:ring-indigo-500',

    // 🟢 SECONDARY - HIGH CONTRAST in dark mode
    secondary: cn(
      theme === 'dark'
        ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
        : 'bg-slate-200 text-slate-900 hover:bg-slate-300 active:scale-95',
      'focus:ring-indigo-500'
    ),

    // 🔴 DANGER
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-95 focus:ring-red-500',

    // ⚪ GHOST - With strong border in dark
    ghost: cn(
      theme === 'dark'
        ? 'bg-slate-700/50 text-slate-100 border border-slate-600 hover:bg-slate-700 hover:border-slate-500 active:scale-95'
        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 active:scale-95',
      'focus:ring-slate-400'
    ),

    // 📌 OUTLINE
    outline: cn(
      theme === 'dark'
        ? 'bg-transparent text-indigo-300 border-2 border-indigo-500 hover:bg-indigo-600/20 active:scale-95'
        : 'bg-transparent text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 active:scale-95',
      'focus:ring-indigo-500'
    ),
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      role="button"
      tabIndex={disabled || loading ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        loading && 'opacity-70 cursor-wait pointer-events-none',
        className
      )}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
