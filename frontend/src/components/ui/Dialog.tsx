import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface DialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("px-6 py-4 border-b border-slate-800/80 shrink-0 bg-slate-950/60", className)}>{children}</div>
);

export const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h3 className={cn("text-base font-bold text-white", className)}>{children}</h3>
);

export const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={cn("text-xs text-slate-400 mt-0.5", className)}>{children}</p>
);

export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("px-6 py-3.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-end gap-2 shrink-0", className)}>{children}</div>
);

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}) => {
  const showModal = open ?? isOpen ?? false;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (showModal) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal, onClose]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in">
      <div
        className={cn(
          'relative w-full max-w-lg bg-[#111827] text-slate-100 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header if title provided */}
        {(title || description) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 shrink-0 bg-slate-950/60">
            <div>
              {title && <h3 className="text-base font-bold text-white">{title}</h3>}
              {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close dialog"
              className="w-8 h-8 p-0 rounded-full text-slate-500 hover:text-white hover:bg-slate-800/60"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Dialog Content */}
        <div className="p-6 overflow-y-auto grow text-sm text-slate-300">{children}</div>

        {/* Dialog Footer if footer prop provided */}
        {footer && (
          <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
