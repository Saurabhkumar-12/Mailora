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
import { Send, Search, RefreshCw } from 'lucide-react';

export const SentEmailsPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmails = async (currentPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      if (searchQuery.trim()) {
        const searchRes = await api.emails.search(searchQuery.trim());
        if (searchRes.success && searchRes.data) {
          const sentOnly = searchRes.data.filter((e) => e.status === 'SENT' || e.status === 'FAILED');
          setEmails(sentOnly);
          setTotal(sentOnly.length);
          setTotalPages(1);
        }
      } else {
        const res = await api.emails.getSent(currentPage, 15);
        if (res.success && res.data) {
          setEmails(res.data);
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
          setPage(res.pagination.page);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch sent email history.';
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Delivered & Sent History ({total})</CardTitle>
            <CardDescription>Historical log of processed SMTP outbound email dispatches</CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                placeholder="Search subject or recipient..."
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
            <ErrorState title="Failed to load sent history" message={error} onRetry={() => loadEmails(1)} />
          ) : isLoading ? (
            <TableSkeleton rows={6} />
          ) : emails.length === 0 ? (
            <EmptyState
              icon={<Send className="w-6 h-6 text-slate-400" />}
              title="No delivered emails found"
              description={searchQuery ? 'No matching sent emails found.' : 'You have not sent any outbound emails yet.'}
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
                    <th className="px-6 py-3">Dispatched Time</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {emails.map((email) => (
                    <tr key={email.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{email.recipient}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{email.subject}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                        {email.sentAt ? formatDate(email.sentAt) : email.failedAt ? formatDate(email.failedAt) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={email.status} />
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
