import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { parseLeadFile, type LeadParseResult } from '../lib/leadParser';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Send, Upload, FileText, CheckCircle2, AlertCircle, Trash2, Users, User } from 'lucide-react';

export const ComposePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [delayMs, setDelayMs] = useState('1000'); // Default 1 second delay between batch emails

  // Batch lead upload state
  const [leadResult, setLeadResult] = useState<LeadParseResult | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setFileError(null);

    try {
      const result = await parseLeadFile(file);
      setLeadResult(result);
      setMode('batch');
      showToast(
        `Parsed ${result.validEmails.length} valid lead addresses from ${result.fileName}`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file';
      setFileError(msg);
      showToast(msg, 'error');
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleClearFile = () => {
    setLeadResult(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject line is required';
    } else if (subject.length > 255) {
      newErrors.subject = 'Subject cannot exceed 255 characters';
    }

    if (!body.trim()) {
      newErrors.body = 'Email body content is required';
    }

    if (mode === 'single') {
      const normalizedRecipient = recipient.trim().toLowerCase();
      if (!normalizedRecipient) {
        newErrors.recipient = 'Recipient email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRecipient)) {
        newErrors.recipient = 'Please enter a valid email address';
      }
    } else {
      if (!leadResult || leadResult.validEmails.length === 0) {
        newErrors.leads = 'Please upload a valid CSV or TXT lead file with at least one recipient';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const isoScheduledAt = scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString();

      if (mode === 'single') {
        const res = await api.emails.schedule({
          recipient: recipient.trim().toLowerCase(),
          subject: subject.trim(),
          body: body.trim(),
          scheduledAt: isoScheduledAt,
        });

        if (res.success) {
          showToast('Email scheduled successfully into BullMQ queue!', 'success', 'Scheduled');
          navigate('/scheduled');
        }
      } else {
        if (!leadResult || leadResult.validEmails.length === 0) return;

        const res = await api.emails.scheduleBatch({
          recipients: leadResult.validEmails,
          subject: subject.trim(),
          body: body.trim(),
          startTime: isoScheduledAt,
          delayBetweenEmailsMs: parseInt(delayMs, 10) || 0,
        });

        if (res.success) {
          showToast(
            `Enqueued batch of ${res.data?.totalQueued || leadResult.validEmails.length} emails into BullMQ queue!`,
            'success',
            'Batch Scheduled'
          );
          navigate('/scheduled');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule email.';
      showToast(msg, 'error', 'Scheduling Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mode Switcher Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            variant={mode === 'single' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode('single')}
            leftIcon={<User className="w-4 h-4" />}
          >
            Single Recipient
          </Button>
          <Button
            variant={mode === 'batch' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode('batch')}
            leftIcon={<Users className="w-4 h-4" />}
          >
            Batch Lead Upload {leadResult && `(${leadResult.validEmails.length})`}
          </Button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline">
          {mode === 'single' ? 'Send one email at a specified time' : 'Queue multiple leads with staggered delays'}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{mode === 'single' ? 'Compose Single Email' : 'Compose Batch Email Campaign'}</CardTitle>
          <CardDescription>
            {mode === 'single'
              ? 'Schedule a single email for immediate or future BullMQ queue delivery'
              : 'Upload a CSV/TXT lead list and configure per-email delivery delays'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Recipient Input (Single Mode) */}
            {mode === 'single' ? (
              <Input
                label="Recipient Email Address *"
                type="email"
                placeholder="lead@company.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                error={errors.recipient}
              />
            ) : (
              /* Lead File Upload Zone (Batch Mode) */
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 select-none">
                  Upload Lead List (.csv or .txt) *
                </label>

                {!leadResult ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2"
                  >
                    <div className="p-3 bg-white text-slate-400 group-hover:text-indigo-600 rounded-full border border-slate-200 shadow-2xs group-hover:border-indigo-200 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-800 block">
                        Click to upload or drag lead file
                      </span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Supports CSV & TXT files up to 5MB (auto deduplicated & validated)
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Lead File Summary Card */
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-900 block">{leadResult.fileName}</span>
                          <span className="text-xs text-slate-500">{leadResult.fileSizeKb} KB &bull; {leadResult.totalParsed} total entries parsed</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={handleClearFile}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                      <Badge variant="success">{leadResult.validEmails.length} Valid Leads</Badge>
                      {leadResult.duplicateCount > 0 && (
                        <Badge variant="warning">{leadResult.duplicateCount} Duplicates Filtered</Badge>
                      )}
                      {leadResult.invalidCount > 0 && (
                        <Badge variant="failed">{leadResult.invalidCount} Invalid Emails Filtered</Badge>
                      )}
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {fileError && <p className="text-xs text-rose-600 font-medium">{fileError}</p>}
                {errors.leads && <p className="text-xs text-rose-600 font-medium">{errors.leads}</p>}
              </div>
            )}

            {/* Subject */}
            <Input
              label="Email Subject *"
              placeholder="e.g. Quick intro regarding outbound email workflow..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              error={errors.subject}
            />

            {/* Body */}
            <Textarea
              label="Email Body Content *"
              placeholder="Write your email body message..."
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              error={errors.body}
            />

            {/* Scheduling & Staggered Delay Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label={mode === 'single' ? 'Scheduled Date & Time' : 'Batch Campaign Start Time'}
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                helperText="Leave blank to dispatch immediately"
              />

              {mode === 'batch' && (
                <Select
                  label="Staggered Delay Between Emails"
                  value={delayMs}
                  onChange={(e) => setDelayMs(e.target.value)}
                  options={[
                    { value: '0', label: '0s (Send all at start time)' },
                    { value: '1000', label: '1 second between emails' },
                    { value: '5000', label: '5 seconds between emails' },
                    { value: '10000', label: '10 seconds between emails' },
                    { value: '30000', label: '30 seconds between emails' },
                    { value: '60000', label: '1 minute between emails' },
                  ]}
                  helperText="Prevents SMTP spam flag & enforces rate limits"
                />
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="md"
                type="button"
                onClick={() => navigate('/')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                {mode === 'single' ? 'Schedule Email' : `Schedule ${leadResult?.validEmails.length || 0} Lead Batch`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
