import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { EmailRecord } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate } from '../lib/utils';
import { Clock, Search, RefreshCw, XCircle } from 'lucide-react';

export const ScheduledEmailsPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmails = async (currentPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      if (searchQuery.trim()) {
        const searchRes = await api.emails.search(searchQuery.trim());
        if (searchRes.success && searchRes.data) {
          const pendingOnly = searchRes.data.filter((e) => e.status === 'PENDING' || e.status === 'PROCESSING');
          setEmails(pendingOnly);
          setTotal(pendingOnly.length);
          setTotalPages(1);
        }
      } else {
        const res = await api.emails.getScheduled(currentPage, 15);
        if (res.success && res.data) {
          setEmails(res.data);
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
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEmails(1);
  };

  const handleCancelEmail = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) return;
    setCancellingId(id);
    try {
      await api.emails.cancel(id);
      await loadEmails(page);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not cancel email.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Scheduled Queue ({total})</CardTitle>
            <CardDescription>Emails queued in BullMQ waiting for delivery schedule</CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                placeholder="Search recipient or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="w-64"
              />
            </form>

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
              icon={<Clock className="w-6 h-6 text-slate-400" />}
              title="No scheduled emails found"
              description={searchQuery ? 'No matching emails found for your search query.' : 'You have no pending scheduled emails right now.'}
              actionLabel={searchQuery ? 'Clear Search' : 'Compose Email'}
              onAction={() => {
                if (searchQuery) {
                  setSearchQuery('');
                  loadEmails(1);
                } else {
                  window.location.href = '/compose';
                }
              }}
              className="border-none rounded-none py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Recipient</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Scheduled Delivery</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {emails.map((email) => (
                    <tr key={email.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{email.recipient}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{email.subject}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">{formatDate(email.scheduledAt)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={email.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelEmail(email.id)}
                          isLoading={cancellingId === email.id}
                          className="text-rose-600 hover:bg-rose-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
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
    </div>
  );
};
