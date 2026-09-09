import React, { useState } from 'react';
import type { EmailRecord } from '../../types';
import { EmailStatus } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from './Badge';
import { Button } from './Button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
import { X, Mail, Calendar, Send, AlertCircle, StopCircle, User, CheckCircle2, ExternalLink } from 'lucide-react';
import { formatDate } from '../../lib/utils';

interface EmailDetailDrawerProps {
  email: EmailRecord | null;
  onClose: () => void;
  onUpdate?: () => void;
}

export const EmailDetailDrawer: React.FC<EmailDetailDrawerProps> = ({ email, onClose, onUpdate }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'recipients' | 'content' | 'activity'>('overview');
  const [isPaused, setIsPaused] = useState(false);

  if (!email) return null;

  const isPending = email.status === EmailStatus.PENDING || email.status === EmailStatus.PROCESSING;
  const isSending = email.status === EmailStatus.PROCESSING;

  const handleCancelConfirm = async () => {
    setIsCancelling(true);
    try {
      const res = await api.emails.cancel(email.id);
      if (res.success) {
        setToastMessage('Campaign stopped successfully.');
        setShowCancelModal(false);
        if (onUpdate) onUpdate();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to stop email campaign.';
      setToastMessage(`Error: ${msg}`);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Right Drawer Panel */}
      <div className="fixed top-0 bottom-0 right-0 z-50 w-full sm:w-[500px] bg-slate-950 shadow-2xl border-l border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out text-slate-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white leading-tight truncate">
                {email.subject || 'Campaign Details'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">ID: {email.id}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0 text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 px-6 gap-6 text-xs font-semibold bg-slate-950">
          {(['overview', 'recipients', 'content', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 capitalize border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Drawer Body Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {toastMessage && (
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Active Campaign Control Box */}
          {isPending && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={email.status} />
                  {isPaused && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-500 text-[10px] font-bold border border-amber-900">
                      Paused
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPaused(!isPaused)}
                    className="text-xs h-8 bg-slate-950 border-slate-700 text-slate-300"
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowCancelModal(true)}
                    leftIcon={<StopCircle className="w-3.5 h-3.5" />}
                    className="text-xs h-8 font-semibold"
                  >
                    Stop Sending
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">
                    {email.status === EmailStatus.SENT ? '1 / 1 emails sent' : 'Sending Progress'}
                  </span>
                  <span className="text-slate-600">
                    {email.status === EmailStatus.SENT ? '100%' : isSending ? '45%' : '0%'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: email.status === EmailStatus.SENT ? '100%' : isSending ? '45%' : '5%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Overview</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Recipient</span>
                  <span className="text-xs font-bold text-slate-200 truncate block mt-0.5">{email.recipient}</span>
                </div>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Status</span>
                  <div className="mt-1"><StatusBadge status={email.status} /></div>
                </div>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Scheduled At</span>
                  <span className="text-xs font-medium font-mono text-slate-300 block mt-0.5">
                    {email.scheduledAt ? formatDate(email.scheduledAt) : 'Immediate'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Dispatched At</span>
                  <span className="text-xs font-medium font-mono text-slate-300 block mt-0.5">
                    {email.sentAt ? formatDate(email.sentAt) : email.failedAt ? formatDate(email.failedAt) : 'Pending Delivery'}
                  </span>
                </div>
              </div>

              {/* Ethereal Sandbox Transport Details */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">Email Transport</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 text-[10px] font-bold border border-indigo-800/80">
                    Ethereal Fake SMTP
                  </span>
                </div>
                {email.messageId && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Message ID</span>
                    <span className="text-xs font-mono text-slate-300 truncate block mt-0.5">{email.messageId}</span>
                  </div>
                )}
                {email.previewUrl && (
                  <div className="pt-1 border-t border-slate-800/80">
                    <a
                      href={email.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Ethereal Preview</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Error Alert if Failed */}
              {email.status === EmailStatus.FAILED && (
                <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-300">
                    <span className="font-bold block">Delivery Issue</span>
                    <span>
                      {email.errorMessage && email.errorMessage.toLowerCase().includes('cancelled')
                        ? 'Campaign stopped by user before delivery.'
                        : (email.errorMessage || 'Delivery failed. Outbound queue could not process dispatch.')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recipients' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Recipient</h4>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold text-slate-200">{email.recipient}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-semibold border border-emerald-900 text-[10px]">
                  Valid Target
                </span>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject & Message Content</h4>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white">
                {email.subject}
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 whitespace-pre-wrap leading-relaxed min-h-[160px] max-h-64 overflow-y-auto">
                {email.body}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Activity History</h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Campaign Created</span>
                  <span className="text-slate-600 font-mono text-[11px]">{formatDate(email.createdAt)}</span>
                </div>
                {email.sentAt && (
                  <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-900/40 flex items-center justify-between">
                    <span className="text-emerald-500 font-semibold">Outbound Delivery Succeeded</span>
                    <span className="text-emerald-700 font-mono text-[11px]">{formatDate(email.sentAt)}</span>
                  </div>
                )}
                {email.failedAt && (
                  <div className="p-3 bg-rose-950/20 rounded-xl border border-rose-900/40 flex items-center justify-between">
                    <span className="text-rose-500 font-semibold">Delivery Stopped / Failed</span>
                    <span className="text-rose-700 font-mono text-[11px]">{formatDate(email.failedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800">
            Close Drawer
          </Button>
        </div>
      </div>

      {/* Stop Sending / Cancel Campaign Confirmation Dialog */}
      <Dialog open={showCancelModal} onClose={() => setShowCancelModal(false)}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <StopCircle className="w-5 h-5 text-rose-500" />
            <DialogTitle className="text-white">Stop this campaign?</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400">
            Emails that have already been sent cannot be recalled. Remaining emails will not be sent.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)} disabled={isCancelling} className="border-slate-700 bg-slate-900 text-slate-300">
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
    </>
  );
};
