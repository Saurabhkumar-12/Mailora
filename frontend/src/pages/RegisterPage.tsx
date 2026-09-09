import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Clock, Send, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { isAuthenticated, isLoading, loginWithGoogle, register, error: authError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const displayError = formError || authError;

  if (isAuthenticated && !isLoading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setFormError('Please fill out all required fields.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split Container */}
      <div className="w-full max-w-5xl bg-[#0b0f19] rounded-3xl shadow-2xl border border-slate-800/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] relative z-10">
        
        {/* Left Side (~55%) — Dark Mailora Visual Experience */}
        <div className="lg:col-span-6 bg-gradient-to-b from-[#0e1424] via-[#0b0f19] to-[#080b12] p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Logo Header */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-10 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">Mailora</span>
            </Link>

            {/* Editorial Headline */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-3">
              Start sending<br />
              <span className="text-indigo-400">smarter.</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-8 max-w-md">
              Create your account in seconds and unlock automated campaign scheduling, CSV list parsing, and delivery tracking.
            </p>

            {/* Value Props with Icons */}
            <div className="space-y-4 mb-8 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Schedule campaigns</span>
                  <span className="text-slate-400 text-xs font-normal">Staggered delivery with sending quota safeguards</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Smart lead parsing</span>
                  <span className="text-slate-400 text-xs font-normal">Auto deduplication & format validation</span>
                </div>
              </div>
            </div>

            {/* Floating Visual Card */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2 shadow-xl animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-white">Lead batch ready</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">100 Leads Parsed</span>
              </div>
            </div>
          </div>

          {/* Testimonial Quote Footer */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80">
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "Setting up outreach took less than 2 minutes. The batch scheduler is incredible."
            </p>
            <span className="text-[11px] font-bold text-indigo-300 block mt-1.5">— Growth Lead</span>
          </div>
        </div>

        {/* Right Side (~45%) — Dark Authentication Card */}
        <div className="lg:col-span-6 p-8 lg:p-12 bg-[#0d1117] flex flex-col justify-center text-white">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Create an account</h2>
              <p className="text-xs text-slate-500 mt-1">Get started with Mailora today</p>
            </div>

            {displayError && (
              <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-300">
                  <span className="font-bold block">Registration Error</span>
                  <span>{displayError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input
                label="Full Name"
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting || isLoading}
              />

              <Input
                label="Work Email"
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || isLoading}
              />

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 pr-10"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting || isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting || isLoading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl"
                isLoading={submitting}
              >
                Create Account
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">OR</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full flex items-center justify-center gap-3 font-semibold text-sm rounded-xl"
              onClick={loginWithGoogle}
              isLoading={isLoading}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <p className="mt-6 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
