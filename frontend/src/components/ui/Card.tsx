import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-100', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3 className={cn('text-base font-semibold text-slate-900 tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p className={cn('text-xs text-slate-500 mt-0.5', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
}> = ({ title, value, icon, subtitle, change, changeType = 'neutral', className }) => {
  return (
    <Card className={cn('p-5 flex flex-col justify-between hover:border-slate-300 transition-colors', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">{icon}</div>}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {(subtitle || change) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            {change && (
              <span
                className={cn(
                  'font-medium px-1.5 py-0.5 rounded-xs',
                  changeType === 'positive' && 'bg-emerald-50 text-emerald-700',
                  changeType === 'negative' && 'bg-rose-50 text-rose-700',
                  changeType === 'neutral' && 'bg-slate-100 text-slate-600'
                )}
              >
                {change}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};
