import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Clock,
  Send,
  PlusCircle,
  Puzzle,
  Settings,
  Mail,
  X,
  LogOut,
  Users,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, isLoading } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Compose', path: '/compose', icon: PlusCircle },
    { label: 'Scheduled', path: '/scheduled', icon: Clock },
    { label: 'Sent', path: '/sent', icon: Send },
    { label: 'Contacts', path: '/contacts', icon: Users },
    { label: 'Integrations', path: '/integrations', icon: Puzzle },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0d1117] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-white tracking-tight leading-none">
                  Mailora
                </span>
                <span className="text-[10px] font-semibold text-indigo-400 tracking-widest uppercase mt-0.5">
                  Schedule. Send.
                </span>
              </div>
            </NavLink>

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="lg:hidden w-8 h-8 p-0 text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Quick Action Button */}
          <div className="p-4">
            <NavLink to="/compose" onClick={onClose}>
              <Button
                variant="primary"
                size="md"
                className="w-full font-semibold"
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Compose Email
              </Button>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-1 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all select-none group',
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/20'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                        )}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#0a0e18]">
          {user ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar src={user.avatar} name={user.name} email={user.email} size="sm" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white block truncate leading-tight">
                    {user.name || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate leading-tight">
                    {user.email}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                isLoading={isLoading}
                className="w-7 h-7 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Engine Active</span>
              </div>
              <span className="text-[10px] text-slate-600 font-mono">v1.0</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
