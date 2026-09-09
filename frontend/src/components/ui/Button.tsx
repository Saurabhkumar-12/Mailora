import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none rounded-xl select-none';

  const selectedVariant = variant === 'danger' ? 'destructive' : variant;

  const variants = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 focus:ring-indigo-500 shadow-md shadow-indigo-600/20 border border-indigo-500/30',
    secondary:
      'bg-slate-800/90 text-slate-200 hover:bg-slate-700 active:bg-slate-800 focus:ring-slate-500 border border-slate-700/80',
    outline:
      'bg-slate-900/60 text-slate-300 border border-slate-700/80 hover:bg-slate-800/80 hover:border-slate-600 hover:text-white focus:ring-indigo-500 shadow-xs',
    ghost:
      'bg-transparent text-slate-400 hover:bg-slate-800/60 hover:text-white focus:ring-slate-500',
    destructive:
      'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 focus:ring-rose-500 shadow-md shadow-rose-600/20 border border-rose-500/30',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-3.5 py-2 gap-2 h-9',
    lg: 'text-base px-4.5 py-2.5 gap-2.5 h-11',
  };

  return (
    <button
      className={cn(baseStyles, variants[selectedVariant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
