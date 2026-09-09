import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { parseLeadFile, type LeadParseResult } from '../lib/leadParser';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Send, Upload, FileText, CheckCircle2, AlertCircle, Trash2, Users, User, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export const ComposePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [delayMs, setDelayMs] = useState('1000');

  // Batch lead upload state
  const [leadResult, setLeadResult] = useState<LeadParseResult | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Form submission & summary state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledSuccessCount, setScheduledSuccessCount] = useState<number | null>(null);
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
          setScheduledSuccessCount(1);
          showToast('Email scheduled successfully!', 'success', 'Scheduled');
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
          const count = res.data?.totalQueued || leadResult.validEmails.length;
          setScheduledSuccessCount(count);
          showToast(
            `Successfully scheduled campaign of ${count} emails!`,
            'success',
            'Campaign Scheduled'
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule email.';
      showToast(msg, 'error', 'Scheduling Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const recipientCount = mode === 'single' ? (recipient ? 1 : 0) : (leadResult?.validEmails.length || 0);
  const formattedStartTime = scheduledAt ? new Date(scheduledAt).toLocaleString() : 'Immediate (Now)';
  const formattedDelay = mode === 'batch' ? `${parseInt(delayMs, 10) / 1000}s per email` : 'Immediate';

  // Success Screen
  if (scheduledSuccessCount !== null) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="text-center p-8 border-indigo-500/20 shadow-md">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">
            {scheduledSuccessCount} {scheduledSuccessCount === 1 ? 'Email' : 'Emails'} Scheduled Successfully
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Your campaign has been scheduled. Mailora will deliver your messages automatically according to your specified timing and quota settings.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setScheduledSuccessCount(null);
                setRecipient('');
                setSubject('');
                setBody('');
                setScheduledAt('');
                setLeadResult(null);
              }}
              className="bg-slate-900/90 border-slate-700/80"
            >
              Compose Another
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/scheduled')}
              leftIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Scheduled Emails
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create a campaign</h1>
          <p className="text-sm text-slate-500">Send the right message to the right people at the right time.</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl text-xs font-semibold text-slate-400">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              mode === 'single' ? 'bg-slate-700/80 text-indigo-400 shadow-2xs font-bold' : 'hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Single Recipient
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              mode === 'batch' ? 'bg-slate-700/80 text-indigo-400 shadow-2xs font-bold' : 'hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Batch Upload {leadResult && `(${leadResult.validEmails.length})`}
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* STEP 1: Recipients */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-indigo-600/15 text-indigo-400 font-extrabold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recipients</h3>
              </div>

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
                <div className="space-y-3">
                  {!leadResult ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500/80 rounded-2xl p-8 text-center bg-slate-900/60 hover:bg-indigo-600/10 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2"
                    >
                      <div className="p-3.5 bg-slate-900/90 text-slate-400 group-hover:text-indigo-400 rounded-full border border-slate-700/80 shadow-2xs group-hover:border-indigo-500/30 transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">
                          Drag and drop a CSV or TXT file
                        </span>
                        <span className="text-xs text-slate-500 block mt-1">
                          or click to browse &bull; Supports CSV, TXT (max 5MB)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-slate-900/60 border border-slate-700/80 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 rounded-xl">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white block">{leadResult.fileName}</span>
                            <span className="text-xs text-slate-500">{leadResult.fileSizeKb} KB &bull; {leadResult.totalParsed} addresses found</span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={handleClearFile}
                          className="text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove File
                        </Button>
                      </div>

                      {/* Breakdown Pills */}
                      <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800/80">
                        <Badge variant="success" className="px-3 py-1">Valid: {leadResult.validEmails.length}</Badge>
                        {leadResult.duplicateCount > 0 && (
                          <Badge variant="warning" className="px-3 py-1">Duplicates: {leadResult.duplicateCount}</Badge>
                        )}
                        {leadResult.invalidCount > 0 && (
                          <Badge variant="failed" className="px-3 py-1">Invalid: {leadResult.invalidCount}</Badge>
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

                  {fileError && <p className="text-xs text-rose-400 font-medium">{fileError}</p>}
                  {errors.leads && <p className="text-xs text-rose-400 font-medium">{errors.leads}</p>}
                </div>
              )}
            </div>

            {/* STEP 2: Email Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-indigo-600/15 text-indigo-400 font-extrabold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Email Content</h3>
              </div>

              <Input
                label="Subject *"
                placeholder="Enter email subject line..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                error={errors.subject}
              />

              <Textarea
                label="Message *"
                placeholder="Write your email body content here..."
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                error={errors.body}
              />
            </div>

            {/* STEP 3: Schedule & Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-indigo-600/15 text-indigo-400 font-extrabold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Schedule & Settings</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date & Time"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  helperText="Leave empty to send immediately"
                />

                {mode === 'batch' ? (
                  <Select
                    label="Delay between emails"
                    value={delayMs}
                    onChange={(e) => setDelayMs(e.target.value)}
                    options={[
                      { value: '0', label: '0s (Send all at once)' },
                      { value: '1000', label: '1 second delay' },
                      { value: '5000', label: '5 seconds delay' },
                      { value: '10000', label: '10 seconds delay' },
                      { value: '30000', label: '30 seconds delay' },
                      { value: '60000', label: '1 minute delay' },
                    ]}
                    helperText="Controls dispatch rate between recipients"
                  />
                ) : (
                  <Input
                    label="Sending Quota Protection"
                    value="Hourly limit: 100 emails/hr"
                    disabled
                    helperText="Protects domain sending reputation"
                  />
                )}
              </div>
            </div>

            {/* Campaign Summary Box */}
            {recipientCount > 0 && subject.trim() && (
              <div className="p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Campaign Summary</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-slate-500 block">Total Recipients:</span>
                    <span className="font-bold text-white">{recipientCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Start Time:</span>
                    <span className="font-bold text-white">{formattedStartTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Send Delay:</span>
                    <span className="font-bold text-white">{formattedDelay}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Quota Limit:</span>
                    <span className="font-bold text-white">Protected</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="md"
                type="button"
                onClick={() => navigate('/')}
                disabled={isSubmitting}
                className="bg-slate-900/90 border-slate-700/80"
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-700 font-bold px-6 shadow-xs"
              >
                {mode === 'single' ? 'Schedule Email' : `Schedule ${leadResult?.validEmails.length || 0} Emails`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
