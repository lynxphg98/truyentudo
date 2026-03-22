import { ReactNode } from '_react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/util/cn';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const alertStyles = {
  success: {
    container: 'bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-900/20',
    icon: 'text-emerald-600',
    title: 'text-emerald-900 font-bold',
  },
  error: {
    container: 'bg-red-50 border border-red-200 text-red-900 dark:bg-red-900/20',
    icon: 'text-red-600',
    title: 'text-red-900 font-bold',
  },
  warning: {
    container: 'bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-900/20',
    icon: 'text-amber-600',
    title: 'text-amber-900 font-bold',
  },
  info: {
    container: 'bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-900/20',
    icon: 'text-blue-600',
    title: 'text-blue-900 font-bold',
  },
};

const iconMap = {
  success: CheckCircle,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

export const Alert = ({
  type,
  title,
  message,
  onClose,
  action,
  className,
}: AlertProps) => {
  const style = alertStyles[type];
  const IconComponent = iconMap[type];

  return (
    <div
      className={cn(
        'p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top duration-300',
        style.container,
        className
      )}
      role="alert"
    >
      <IconComponent className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.icon)} />

      <div className="flex-1 min-w-0">
        {title && <h3 className={style.title}>{title}</h3>}
        <p className="text-sm mt-1">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-bold mt-2 underline hover:opacity-75 transition-opacity"
          >
            {action.label}
          </button>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
