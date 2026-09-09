import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Menu, LogOut, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left Title & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 p-0 text-slate-600"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          {title || 'Dashboard'}
        </h1>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Production Ready</span>
        </div>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <Avatar src={user.avatar} name={user.name} email={user.email} size="sm" />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {user.name || 'Mailora User'}
              </span>
              <span className="text-[11px] text-slate-500 leading-tight">
                {user.email}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              title="Sign out of Mailora"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
