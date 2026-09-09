import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { ShieldCheck, Mail, User as UserIcon, Lock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings & Security</CardTitle>
          <CardDescription>
            Authenticated user profile and session security controls
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Profile Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <Avatar src={user?.avatar} name={user?.name} email={user?.email} size="lg" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900">{user?.name || 'Mailora User'}</h4>
                <Badge variant="success">Google Verified</Badge>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          {/* Session Security Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Session Transport & Security</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-700 block">Session Cookie</span>
                <span className="text-slate-500">HttpOnly, Signed (`mailora_sid`), SameSite=Lax, Max-Age 7 Days</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-700 block">PostgreSQL Persistence</span>
                <span className="text-slate-500">Server-side session table with automatic expiration cleanup</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
