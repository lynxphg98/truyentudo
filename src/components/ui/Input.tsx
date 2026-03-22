import React, { InputHTMLAttributes } from '_react';
import { cn } from '@/util/cn';
import { useAuth } from '@/hooks/useAuth';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, disabled, ...props }, ref) => {
    const { theme } = useAuth();

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-[10px] font-black uppercase opacity-60 tracking-widest">
            {label}
          </label>
        )}

        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 font-bold transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
            'rounded-xl',
            
            // ✅ DARK MODE - HIGH CONTRAST
            theme === 'dark'
              ? cn(
                  'bg-slate-800 text-white border border-slate-700',
                  'placeholder:text-slate-500',
                  'hover:border-slate-600',
                  'focus:bg-slate-800/50 focus:border-indigo-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )
              : cn(
                  'bg-white text-slate-900 border border-slate-200',
                  'placeholder:text-slate-400',
                  'hover:border-slate-300',
                  'focus:bg-slate-50 focus:border-indigo-500',
                  'disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed'
                ),

            className
          )}
          {...props}
        />

        {error && (
          <p className="text-xs text-red-500 font-bold">{error}</p>
        )}

        {helperText && !error && (
          <p className={cn(
            'text-[10px] font-bold',
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          )}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
