import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.forgotPassword({ email: email.trim() });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process request. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#0d1117] rounded-3xl shadow-2xl border border-slate-800/80 p-8 sm:p-10 text-white relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">Mailora</h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              Schedule. Queue. Send.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Forgot your password?</h2>
        <p className="text-xs text-slate-500 mb-6">
          Enter your account email and we'll help you reset your password.
        </p>

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-400">
                <span className="font-bold block mb-1">Reset Instructions Dispatched</span>
                <span>
                  If an account exists with that email address, password reset instructions have been sent.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-xs text-rose-400 font-medium">{error}</span>
              </div>
            )}

            <Input
              label="Account Email"
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white mt-2 rounded-xl"
              isLoading={submitting}
            >
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
