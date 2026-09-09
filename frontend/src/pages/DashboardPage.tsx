import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { EmailRecord, SlackStatus } from '../types';
import { StatCard, Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { EmailDetailDrawer } from '../components/ui/EmailDetailDrawer';
import { formatDate } from '../lib/utils';
import { Clock, Send, PlusCircle, Puzzle, Mail, RefreshCw, ChevronRight, AlertTriangle, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [recentScheduled, setRecentScheduled] = useState<EmailRecord[]>([]);
  const [recentSent, setRecentSent] = useState<EmailRecord[]>([]);
  const [slackStatus, setSlackStatus] = useState<SlackStatus | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : '';
  const greetingText = `${getGreeting()}${firstName ? `, ${firstName}` : ''} 👋`;

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [scheduledRes, sentRes, slackRes] = await Promise.all([
        api.emails.getScheduled(1, 5),
        api.emails.getSent(1, 5),
        api.slack.getStatus().catch(() => ({ success: false, data: { connected: false, teamName: null, channelName: null, connectedAt: null } })),
      ]);

      if (scheduledRes.success && scheduledRes.pagination) {
        setScheduledCount(scheduledRes.pagination.total);
        setRecentScheduled(scheduledRes.data || []);
      }

      if (sentRes.success && sentRes.pagination) {
        setSentCount(sentRes.pagination.total);
        setRecentSent(sentRes.data || []);
      }

      if (slackRes.success && slackRes.data) {
        setSlackStatus(slackRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load dashboard data.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const isNewUser = (scheduledCount ?? 0) === 0 && (sentCount ?? 0) === 0;
  const failedCount = recentSent.filter((e) => e.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/70 via-[#1a1f35] to-[#0d1117] text-white p-6 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-600/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 uppercase tracking-widest border border-indigo-400/20">
              Active Outreach
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">{greetingText}</h2>
          <p className="text-xs text-indigo-200 max-w-xl">
            Here's what's happening with your outreach today.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <NavLink to="/compose">
            <Button variant="primary" size="md" className="font-bold">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Compose Email
            </Button>
          </NavLink>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Scheduled"
          value={isLoading ? '...' : scheduledCount ?? 0}
          icon={<Clock className="w-5 h-5" />}
          description="Awaiting dispatch"
          isLoading={isLoading}
        />
        <StatCard
          title="Sent"
          value={isLoading ? '...' : sentCount ?? 0}
          icon={<Send className="w-5 h-5" />}
          trend="+18%"
          trendDirection="up"
          description="vs last week"
          isLoading={isLoading}
        />
        <StatCard
          title="Failed"
          value={isLoading ? '...' : failedCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={failedCount > 0 ? String(failedCount) : '0'}
          trendDirection={failedCount > 0 ? 'down' : 'neutral'}
          description="delivery failures"
          isLoading={isLoading}
        />
        <StatCard
          title="Sending Limit"
          value="2,410"
          icon={<ShieldCheck className="w-5 h-5" />}
          trend="24%"
          trendDirection="neutral"
          description="of daily quota used"
        />
      </div>

      {/* Getting Started Callout if Empty */}
      {!isLoading && isNewUser && (
        <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 via-slate-900/60 to-slate-900/60 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-bold text-white">Welcome to Mailora</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                Your email scheduling workspace is active. Create your first campaign, upload CSV lead lists, and schedule automated dispatches.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/compose')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Schedule Your First Email
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Error state if API call failed */}
      {error && (
        <ErrorState
          title="Dashboard loading error"
          message={error}
          onRetry={loadDashboardData}
        />
      )}

      {/* 2-Column Grid: Scheduled Emails & Sent History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scheduled Emails */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Scheduled Emails</CardTitle>
              <CardDescription>Upcoming dispatches scheduled for automated delivery</CardDescription>
            </div>
            <NavLink to="/scheduled">
              <Button variant="ghost" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                View All
              </Button>
            </NavLink>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton rows={4} />
            ) : recentScheduled.length === 0 ? (
              <EmptyState
                icon={<Mail className="w-6 h-6 text-slate-600" />}
                title="No pending emails"
                description="Schedule outbound emails or lead batches with custom delay intervals."
                actionLabel="Compose Email"
                onAction={() => navigate('/compose')}
                className="border-none rounded-none py-8"
              />
            ) : (
              <div className="divide-y divide-slate-800/60">
                {recentScheduled.map((email) => (
                  <div
                    key={email.id}
                    className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer flex items-center justify-between gap-4"
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-xs truncate">{email.recipient}</span>
                        <StatusBadge status={email.status} />
                      </div>
                      <p className="text-xs text-slate-500 truncate">{email.subject}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">
                      {formatDate(email.scheduledAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sent Activity */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Sending Activity</CardTitle>
              <CardDescription>Latest outbound delivery logs and stats</CardDescription>
            </div>
            <NavLink to="/sent">
              <Button variant="ghost" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                View All
              </Button>
            </NavLink>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton rows={4} />
            ) : recentSent.length === 0 ? (
              <EmptyState
                icon={<Send className="w-6 h-6 text-slate-600" />}
                title="No sent activity yet"
                description="Processed emails will appear here."
                className="border-none rounded-none py-8"
              />
            ) : (
              <div className="divide-y divide-slate-800/60">
                {recentSent.map((email) => (
                  <div
                    key={email.id}
                    className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer flex items-center justify-between gap-4"
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-xs truncate">{email.recipient}</span>
                        <StatusBadge status={email.status} />
                      </div>
                      <p className="text-xs text-slate-500 truncate">{email.subject}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">
                      {email.sentAt ? formatDate(email.sentAt) : email.failedAt ? formatDate(email.failedAt) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right-Side Email Detail Drawer */}
      <EmailDetailDrawer
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
        onUpdate={loadDashboardData}
      />
    </div>
  );
};
