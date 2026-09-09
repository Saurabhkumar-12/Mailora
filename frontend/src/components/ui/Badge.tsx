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
  const baseStyles = 'inline-flex items-center font-medium rounded-md border tracking-tight';

  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200/80',
    processing: 'bg-blue-50 text-blue-800 border-blue-200/80',
    sent: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    failed: 'bg-rose-50 text-rose-800 border-rose-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
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
          variant === 'sent' || variant === 'success' ? 'bg-emerald-500' : '',
          variant === 'pending' || variant === 'warning' ? 'bg-amber-500' : '',
          variant === 'processing' ? 'bg-blue-500 animate-pulse' : '',
          variant === 'failed' ? 'bg-rose-500' : '',
          variant === 'neutral' || variant === 'default' ? 'bg-slate-400' : ''
        )}
      />
      {children}
    </span>
  );
};

/**
 * Helper component specifically for rendering EmailStatus
 */
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
