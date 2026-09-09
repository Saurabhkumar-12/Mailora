import React from 'react';
import { cn } from '../../lib/utils';
import { EmailStatus } from '../../types';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'pending' | 'processing' | 'sent' | 'failed' | 'neutral' | 'success' | 'warning';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
  size = 'md',
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-lg border tracking-tight';

  const variants = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    pending: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    processing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    sent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    failed: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)}>
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          variant === 'sent' || variant === 'success' ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : '',
          variant === 'pending' || variant === 'warning' ? 'bg-indigo-400' : '',
          variant === 'processing' ? 'bg-blue-400 animate-pulse' : '',
          variant === 'failed' ? 'bg-rose-400' : '',
          variant === 'neutral' || variant === 'default' ? 'bg-slate-400' : ''
        )}
      />
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: EmailStatus; className?: string }> = ({
  status,
  className,
}) => {
  switch (status) {
    case EmailStatus.SENT:
      return <Badge variant="sent" className={className}>Sent</Badge>;
    case EmailStatus.PENDING:
      return <Badge variant="pending" className={className}>Scheduled</Badge>;
    case EmailStatus.PROCESSING:
      return <Badge variant="processing" className={className}>Processing</Badge>;
    case EmailStatus.FAILED:
      return <Badge variant="failed" className={className}>Failed</Badge>;
    default:
      return <Badge variant="neutral" className={className}>{status}</Badge>;
  }
};
