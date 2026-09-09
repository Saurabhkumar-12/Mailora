import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { User as UserIcon } from 'lucide-react';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  email,
  size = 'md',
  className,
}) => {
  const [hasError, setHasError] = useState(false);

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  const getInitials = (): string => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'M';
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 shrink-0 overflow-hidden select-none',
        sizes[size],
        className
      )}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={name || email || 'User Avatar'}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : name || email ? (
        <span>{getInitials()}</span>
      ) : (
        <UserIcon className="w-1/2 h-1/2 text-indigo-500" />
      )}
    </div>
  );
};
