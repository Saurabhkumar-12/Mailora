import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { EmailStatus, type EmailRecord } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { EmailDetailDrawer } from '../components/ui/EmailDetailDrawer';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { formatDate } from '../lib/utils';
import { Clock, Search, RefreshCw, Eye, StopCircle, Plus, Filter } from 'lucide-react';

export const ScheduledEmailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [urlSearchParams] = useSearchParams();
  const queryParam = urlSearchParams.get('q') || '';

  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [cancelTargetEmail, setCancelTargetEmail] = useState<EmailRecord | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmails = async (currentPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      if (searchQuery.trim()) {
        const searchRes = await api.emails.search(searchQuery.trim());
        if (searchRes.success && searchRes.data) {
          let filtered = searchRes.data;
          if (statusFilter !== 'ALL') {
            filtered = filtered.filter((e) => e.status === statusFilter);
          }
          setEmails(filtered);
          setTotal(filtered.length);
          setTotalPages(1);
        }
      } else {
        const res = await api.emails.getScheduled(currentPage, 15);
        if (res.success && res.data) {
          let filtered = res.data;
          if (statusFilter !== 'ALL') {
            filtered = filtered.filter((e) => e.status === statusFilter);
          }
          setEmails(filtered);
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
          setPage(res.pagination.page);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch scheduled emails.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmails(1);
  }, [searchQuery, statusFilter]);

  const handleCancelConfirm = async () => {
    if (!cancelTargetEmail) return;
    setIsCancelling(true);
    try {
      const res = await api.emails.cancel(cancelTargetEmail.id);
      if (res.success) {
        setCancelTargetEmail(null);
        await loadEmails(page);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to stop email campaign.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Scheduled Emails</h1>
          <p className="text-sm text-slate-500">Manage your upcoming email campaigns and automated schedules.</p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/compose')}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
        >
          Compose Email
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80">
          <div>
            <CardTitle>Scheduled Campaigns ({total})</CardTitle>
            <CardDescription>Upcoming emails scheduled for automated delivery</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl text-xs font-semibold text-slate-400 border border-slate-800/80">
              {['ALL', 'PENDING', 'PROCESSING'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === f ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'hover:text-white'
                  }`}
                >
                  {f === 'ALL' ? 'All Pending' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="relative">
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="w-56 text-xs"
              />
            </div>

            <Button variant="outline" size="sm" onClick={() => loadEmails(page)} isLoading={isLoading}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <ErrorState title="Failed to load scheduled emails" message={error} onRetry={() => loadEmails(1)} />
          ) : isLoading ? (
            <TableSkeleton rows={6} />
          ) : emails.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-6 h-6 text-slate-600" />}
              title="No scheduled emails"
              description={searchQuery ? 'No matching emails found for your search query.' : 'Create your first campaign and schedule your first message.'}
              actionLabel={searchQuery ? 'Clear Search' : 'Create Campaign'}
              onAction={() => {
                if (searchQuery) {
                  setSearchQuery('');
                } else {
                  navigate('/compose');
                }
              }}
              className="border-none rounded-none py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-900/80 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Recipient</th>
                    <th className="px-6 py-3">Subject / Campaign</th>
                    <th className="px-6 py-3">Scheduled At</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {emails.map((email) => {
                    const isPending = email.status === EmailStatus.PENDING || email.status === EmailStatus.PROCESSING;
                    return (
                      <tr
                        key={email.id}
                        className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedEmail(email)}
                      >
                        <td className="px-6 py-4 font-bold text-white">{email.recipient}</td>
                        <td className="px-6 py-4 text-slate-400 max-w-xs truncate font-medium">{email.subject}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                          {formatDate(email.scheduledAt)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={email.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEmail(email)}
                              className="text-slate-500 hover:text-white hover:bg-slate-800/60"
                            >
                              <Eye className="w-4 h-4 mr-1 text-slate-500" />
                              View
                            </Button>

                            {isPending && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setCancelTargetEmail(email)}
                                className="text-xs font-semibold h-8"
                              >
                                <StopCircle className="w-3.5 h-3.5 mr-1" />
                                Stop Sending
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-3.5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadEmails(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadEmails(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right-Side Email Detail Drawer */}
      <EmailDetailDrawer
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
        onUpdate={() => loadEmails(page)}
      />

      {/* Stop Sending Confirmation Dialog */}
      <Dialog open={!!cancelTargetEmail} onClose={() => setCancelTargetEmail(null)}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <StopCircle className="w-5 h-5 text-rose-600" />
            <DialogTitle>Stop this campaign?</DialogTitle>
          </div>
          <DialogDescription>
            Emails that have already been sent cannot be recalled. Remaining emails will not be sent.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setCancelTargetEmail(null)} disabled={isCancelling}>
            Keep Sending
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleCancelConfirm}
            isLoading={isCancelling}
            leftIcon={<StopCircle className="w-4 h-4" />}
          >
            Stop Sending
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
