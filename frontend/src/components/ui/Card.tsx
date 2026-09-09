import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-[#111827]/90 border border-slate-800/80 rounded-2xl p-5 text-slate-100 shadow-md backdrop-blur-xs transition-all duration-200',
        hoverable && 'hover:border-slate-700 hover:shadow-xl hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('flex flex-col space-y-1 mb-4', className)} {...props}>
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
    <h3
      className={cn('text-base font-bold text-white tracking-tight leading-snug', className)}
      {...props}
    >
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
    <p className={cn('text-xs text-slate-400 leading-normal', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return <div className={cn('', className)} {...props}>{children}</div>;
};

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  description?: string;
  className?: string;
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  badge,
  trend,
  trendDirection = 'up',
  description,
  className,
  isLoading = false,
}) => {
  return (
    <Card className={cn('flex flex-col justify-between p-5 relative overflow-hidden group', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:border-indigo-500/40 transition-colors">
            {icon}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-8 w-24 bg-slate-800 animate-pulse rounded-lg my-1" />
      ) : (
        <div className="flex items-baseline justify-between gap-2 my-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {value}
          </span>
          {badge}
        </div>
      )}

      {(trend || description) && (
        <div className="mt-2 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
          {trend && (
            <span
              className={cn(
                'font-medium text-[11px] px-1.5 py-0.5 rounded-md border',
                trendDirection === 'up' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                trendDirection === 'down' && 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                trendDirection === 'neutral' && 'bg-slate-800 text-slate-400 border-slate-700'
              )}
            >
              {trend}
            </span>
          )}
          {description && (
            <span className="text-slate-400 text-[11px] truncate">{description}</span>
          )}
        </div>
      )}
    </Card>
  );
};
