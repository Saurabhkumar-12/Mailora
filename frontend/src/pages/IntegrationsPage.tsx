import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { SlackStatus } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Puzzle, ExternalLink, Unlink, Globe, CheckCircle2 } from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const [status, setStatus] = useState<SlackStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlackStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.slack.getStatus();
      if (res.success && res.data) {
        setStatus(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load integration status.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSlackStatus();
  }, []);

  const handleConnectSlack = () => {
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    window.location.href = `${backendUrl}/api/slack/oauth/start`;
  };

  const handleDisconnectSlack = async () => {
    if (!confirm('Are you sure you want to disconnect Slack integration?')) return;
    setIsDisconnecting(true);
    try {
      await api.slack.disconnect();
      await loadSlackStatus();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to disconnect Slack.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Integrations</h1>
        <p className="text-sm text-slate-500">Connect third-party productivity tools to automate notifications and authentication.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Slack Card */}
        <Card>
          <CardHeader className="border-b border-slate-800/80">
            <CardTitle>Slack Notifications</CardTitle>
            <CardDescription>
              Connect your Slack workspace to receive automated dispatches and sending limit alerts.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error ? (
              <ErrorState title="Failed to load status" message={error} onRetry={loadSlackStatus} />
            ) : isLoading ? (
              <TableSkeleton rows={2} />
            ) : (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30 shadow-2xs">
                    <Puzzle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-base font-bold text-white">Slack Workspace</h4>
                      {status?.connected ? (
                        <Badge variant="success">Connected</Badge>
                      ) : (
                        <Badge variant="neutral">Disconnected</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 max-w-md">
                      {status?.connected
                        ? `Receiving automated notifications in #${status.channelName || 'general'} (${status.teamName || 'Slack Workspace'}).`
                        : 'Connect your workspace to receive real-time notification alerts when sending limits are reached.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {status?.connected ? (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={handleDisconnectSlack}
                      isLoading={isDisconnecting}
                      leftIcon={<Unlink className="w-4 h-4" />}
                      className="text-rose-400 border-rose-500/30 bg-[#0d1117] hover:bg-rose-500/10"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleConnectSlack}
                      leftIcon={<ExternalLink className="w-4 h-4" />}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                    >
                      Connect Slack
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Authentication Card */}
        <Card>
          <CardHeader className="border-b border-slate-800/80">
            <CardTitle>Google Workspace</CardTitle>
            <CardDescription>
              Single sign-on authentication and Google account identity provider integration.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30 shadow-2xs">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-base font-bold text-white">Google Single Sign-On</h4>
                    <Badge variant="success">Available</Badge>
                  </div>
                  <p className="text-xs text-slate-500 max-w-md">
                    Secure 1-click sign in with your verified Google email account.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Enabled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
