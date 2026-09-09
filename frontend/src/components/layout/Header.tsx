import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Menu, Search, Bell, LogOut, CheckCheck, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Sending Quota Active',
    message: 'Hourly sending quota protection is active. Emails are automatically queued.',
    time: '10m ago',
    read: false,
    type: 'warning',
  },
  {
    id: '2',
    title: 'Workspace Ready',
    message: 'Mailora scheduling engine is active and ready to process outbound campaigns.',
    time: '1h ago',
    read: false,
    type: 'info',
  },
  {
    id: '3',
    title: 'Slack Webhook Connected',
    message: 'Notifications are connected to Slack channel for dispatch alerts.',
    time: '2h ago',
    read: true,
    type: 'success',
  },
];

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/scheduled?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0d1117]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left Title & Mobile Menu Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 p-0 text-slate-400 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-bold text-white tracking-tight hidden sm:block">
          {title || 'Dashboard'}
        </h1>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-auto">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search emails, campaigns, or contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition-all"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </form>
      </div>

      {/* Right Notifications & User Avatar */}
      <div className="flex items-center gap-3 shrink-0 relative" ref={dropdownRef}>
        {/* Notification Button */}
        <button
          type="button"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors focus:outline-none"
          title="Notifications"
          aria-expanded={showNotifications}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0d1117] animate-pulse" />
          )}
        </button>

        {/* Notifications Dropdown Panel */}
        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 sm:w-96 bg-[#111827] rounded-2xl shadow-2xl border border-slate-800/80 z-50 overflow-hidden text-xs text-slate-200">
            <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item.id)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      !item.read ? 'bg-indigo-600/5' : ''
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {item.type === 'warning' && (
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.type === 'info' && (
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                          <Info className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.type === 'success' && (
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`font-semibold ${!item.read ? 'text-white' : 'text-slate-400'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">{item.time}</span>
                      </div>
                      <p className="text-slate-500 leading-normal text-[11px]">{item.message}</p>
                    </div>

                    {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>

            <div className="p-2.5 border-t border-slate-800/80 text-center">
              <span className="text-[11px] font-medium text-slate-600">Mailora Notification Center</span>
            </div>
          </div>
        )}

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <Avatar src={user.avatar} name={user.name} email={user.email} size="sm" />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
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
              className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg"
              title="Sign out of Mailora"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
