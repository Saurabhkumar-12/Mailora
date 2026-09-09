import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Mail, User as UserIcon, Lock, Sliders, LogOut, KeyRound } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500">Manage your workspace profile, account security, and email sending preferences.</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader className="border-b border-slate-800/80">
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Workspace account details and identity</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/60 border border-slate-700/80">
            <div className="flex items-center gap-4">
              <Avatar src={user?.avatar} name={user?.name} email={user?.email} size="lg" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">{user?.name || 'Mailora User'}</h4>
                  <Badge variant="success">Active Session</Badge>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{user?.email}</span>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              isLoading={isLoading}
              className="text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 shrink-0 font-semibold"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security & Password Section */}
      <Card>
        <CardHeader className="border-b border-slate-800/80">
          <CardTitle>Account &amp; Session Security</CardTitle>
          <CardDescription>Authentication security settings and session management</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/80 space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white">Session Protection</span>
              </div>
              <p className="text-slate-500">Secure encrypted cookie session (7-day duration)</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/80 space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white">Password Hashing</span>
              </div>
              <p className="text-slate-500">Industry-standard scrypt cryptographic protection</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sending Preferences & Email Limits */}
      <Card>
        <CardHeader className="border-b border-slate-800/80">
          <CardTitle>Sending Preferences &amp; Email Limits</CardTitle>
          <CardDescription>Configured outbound sending thresholds and dispatches rate limits</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/80 space-y-1">
              <span className="font-bold text-slate-500 block">Per-User Hourly Limit</span>
              <span className="text-white font-extrabold text-lg">100 emails/hr</span>
              <span className="text-slate-500 block text-[11px]">Automated user hourly sending limit</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/80 space-y-1">
              <span className="font-bold text-slate-500 block">Per-Sender Hourly Limit</span>
              <span className="text-white font-extrabold text-lg">50 emails/hr</span>
              <span className="text-slate-500 block text-[11px]">Enforced per sender identity</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/80 space-y-1">
              <span className="font-bold text-slate-500 block">Global Minimum Delay</span>
              <span className="text-white font-extrabold text-lg">1,000 ms</span>
              <span className="text-slate-500 block text-[11px]">Minimum interval between dispatches</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
