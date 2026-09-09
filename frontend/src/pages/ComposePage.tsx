import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Send, Upload, Clock, AlertCircle, Info } from 'lucide-react';

export const ComposePage: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compose Outbound Email</CardTitle>
          <CardDescription>
            Schedule a single email or prepare lead batches with BullMQ queue management
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-3 text-xs text-indigo-900">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Phase 12A UI Preview</span>
              <span>Full CSV lead parsing, staggered delays, and schedule dispatch API integration will be activated in Phase 12C.</span>
            </div>
          </div>

          <Input
            label="Recipient Email"
            type="email"
            placeholder="lead@company.com"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />

          <Input
            label="Email Subject"
            placeholder="Quick intro regarding automated queue management..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Textarea
            label="Email Body"
            placeholder="Write your outbound outreach body or template..."
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Scheduled Date & Time"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              helperText="Leave empty to send immediately or specify future timestamp"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 select-none">
                Batch CSV Lead Upload
              </label>
              <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">
                  Upload CSV (Phase 12C)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="outline" size="md" onClick={() => (window.location.href = '/')}>
              Cancel
            </Button>
            <Button variant="primary" size="md" leftIcon={<Send className="w-4 h-4" />}>
              Schedule Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
