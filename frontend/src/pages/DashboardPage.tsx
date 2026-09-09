import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../services/api';
import type { EmailRecord, SlackStatus } from '../types';
import { StatCard, Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate } from '../lib/utils';
import { Clock, Send, PlusCircle, Puzzle, Mail, RefreshCw, ChevronRight } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [recentScheduled, setRecentScheduled] = useState<EmailRecord[]>([]);
  const [slackStatus, setSlackStatus] = useState<SlackStatus | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Outbound Email Engine Active</h2>
          <p className="text-xs text-indigo-200 max-w-xl">
            Schedule lead batches with deterministic per-email delays, hourly BullMQ rate limiting, and automated Slack notifications.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <NavLink to="/compose">
            <Button variant="primary" size="md" className="bg-white text-indigo-950 hover:bg-indigo-50 font-semibold border-transparent shadow-xs">
              <PlusCircle className="w-4 h-4 mr-1.5 text-indigo-600" />
              Compose Email
            </Button>
          </NavLink>
        </div>
      </div>

      {/* Metrics Row - Backed by Real Backend Pagination Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Scheduled Queue"
          value={isLoading ? '...' : scheduledCount ?? 0}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          subtitle="Total Pending Jobs in DB"
        />
        <StatCard
          title="Delivered Emails"
          value={isLoading ? '...' : sentCount ?? 0}
          icon={<Send className="w-5 h-5 text-emerald-600" />}
          subtitle="Total Delivered History"
        />
        <StatCard
          title="Slack Alerts"
          value={isLoading ? '...' : slackStatus?.connected ? 'Connected' : 'Disconnected'}
          icon={<Puzzle className="w-5 h-5 text-indigo-600" />}
          subtitle={slackStatus?.connected && slackStatus.teamName ? `#${slackStatus.channelName || 'alerts'} in ${slackStatus.teamName}` : 'Rate limit notifications'}
        />
      </div>

      {/* Error state if API call failed */}
      {error && (
        <ErrorState
          title="Dashboard loading error"
          message={error}
          onRetry={loadDashboardData}
        />
      )}

      {/* Main Content Area: Recent Scheduled Queue */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming Scheduled Queue</CardTitle>
            <CardDescription>Next emails queued for automated delivery</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadDashboardData} isLoading={isLoading}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <NavLink to="/scheduled">
              <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                View All Scheduled
              </Button>
            </NavLink>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : recentScheduled.length === 0 ? (
            <EmptyState
              icon={<Mail className="w-6 h-6 text-slate-400" />}
              title="No pending emails queued"
              description="Schedule outbound emails or lead batches with custom delay intervals."
              actionLabel="Compose Email"
              onAction={() => (window.location.href = '/compose')}
              className="border-none rounded-none py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Recipient</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Scheduled Time</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentScheduled.map((email) => (
                    <tr key={email.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{email.recipient}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{email.subject}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">{formatDate(email.scheduledAt)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={email.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
