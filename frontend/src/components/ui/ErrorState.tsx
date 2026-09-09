import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center rounded-xl bg-rose-500/10 border border-rose-500/30 min-h-[180px]',
        className
      )}
    >
      <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-full mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-rose-300 mb-1">{title}</h4>
      <p className="text-xs text-rose-400/80 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
