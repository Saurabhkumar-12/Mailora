import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { EmailRecord } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { EmailDetailDrawer } from '../components/ui/EmailDetailDrawer';
import { formatDate } from '../lib/utils';
import { Send, Search, RefreshCw, Eye, ExternalLink } from 'lucide-react';

export const SentEmailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmails = async (currentPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      if (searchQuery.trim()) {
        const searchRes = await api.emails.search(searchQuery.trim());
        if (searchRes.success && searchRes.data) {
          let sentOnly = searchRes.data.filter((e) => e.status === 'SENT' || e.status === 'FAILED');
          if (statusFilter !== 'ALL') {
            sentOnly = sentOnly.filter((e) => e.status === statusFilter);
          }
          setEmails(sentOnly);
          setTotal(sentOnly.length);
          setTotalPages(1);
        }
      } else {
        const res = await api.emails.getSent(currentPage, 15);
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
      const msg = err instanceof Error ? err.message : 'Failed to fetch sent email history.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmails(1);
    const interval = setInterval(() => {
      loadEmails(page);
    }, 10000);
    return () => clearInterval(interval);
  }, [searchQuery, statusFilter, page]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Sent Emails</h1>
        <p className="text-sm text-slate-500">View emails that have been processed and delivered by Mailora.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80">
          <div>
            <CardTitle>Delivered & Processed Log ({total})</CardTitle>
            <CardDescription>Outbound email delivery log and dispatch history</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl text-xs font-semibold text-slate-400 border border-slate-800/80">
              {['ALL', 'SENT', 'FAILED'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === f ? 'bg-indigo-600 text-white shadow-2xs font-bold' : 'hover:text-white'
                  }`}
                >
                  {f === 'ALL' ? 'All History' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="relative">
              <Input
                placeholder="Search recipient or subject..."
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
            <ErrorState title="Failed to load sent history" message={error} onRetry={() => loadEmails(1)} />
          ) : isLoading ? (
            <TableSkeleton rows={6} />
          ) : emails.length === 0 ? (
            <EmptyState
              icon={<Send className="w-6 h-6 text-slate-600" />}
              title="No sent emails yet"
              description={searchQuery ? 'No matching sent emails found.' : 'Emails you successfully send will appear here.'}
              actionLabel={searchQuery ? 'Clear Search' : 'Compose Email'}
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
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Recipient</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Dispatched Time</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {emails.map((email) => (
                    <tr
                      key={email.id}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedEmail(email)}
                    >
                      <td className="px-6 py-4 font-bold text-white">{email.recipient}</td>
                      <td className="px-6 py-4 text-slate-400 max-w-xs truncate font-medium">{email.subject}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                        {email.sentAt ? formatDate(email.sentAt) : email.failedAt ? formatDate(email.failedAt) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={email.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {email.previewUrl && (
                            <a
                              href={email.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-800/80 text-xs font-semibold transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEmail(email)}
                            className="text-slate-500 hover:text-white hover:bg-slate-800/40"
                          >
                            <Eye className="w-4 h-4 mr-1 text-slate-400" />
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadEmails(page - 1)} className="border-slate-800/80">
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadEmails(page + 1)} className="border-slate-800/80">
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Detail Panel Drawer */}
      <EmailDetailDrawer
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
        onUpdate={() => loadEmails(page)}
      />
    </div>
  );
};
