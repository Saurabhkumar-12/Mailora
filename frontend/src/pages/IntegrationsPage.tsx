import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { SlackStatus } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Puzzle, CheckCircle2, AlertCircle, ExternalLink, Unlink } from 'lucide-react';

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
      const msg = err instanceof Error ? err.message : 'Unable to load Slack integration status.';
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
      <Card>
        <CardHeader>
          <CardTitle>Slack Rate Limit Notifications</CardTitle>
          <CardDescription>
            Connect your Slack workspace to receive real-time notifications when BullMQ email rate limits are triggered
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error ? (
            <ErrorState title="Failed to load Slack status" message={error} onRetry={loadSlackStatus} />
          ) : isLoading ? (
            <TableSkeleton rows={2} />
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                  <Puzzle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-base font-bold text-slate-900">Slack Integration</h4>
                    {status?.connected ? (
                      <Badge variant="success">Connected</Badge>
                    ) : (
                      <Badge variant="neutral">Disconnected</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 max-w-md">
                    {status?.connected
                      ? `Receiving automated rate-limit delay notifications in #${status.channelName || 'general'} (${status.teamName || 'Slack Workspace'}).`
                      : 'Connect your workspace using OAuth 2.0 to enable deduplicated hourly rate-limit alert channels.'}
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
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Disconnect Slack
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleConnectSlack}
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                    className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                  >
                    Connect Slack
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
