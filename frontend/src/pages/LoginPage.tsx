import React, { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Mail, Shield, Zap, Clock, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading, loginWithGoogle, error: authError } = useAuth();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');

  const displayError = oauthError || authError;

  if (isAuthenticated && !isLoading) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Tagline */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md mb-3">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mailora</h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
            Schedule. Queue. Send.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs border border-slate-200 sm:rounded-2xl sm:px-10">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enterprise outbound email scheduling & queue automation
            </p>
          </div>

          {/* OAuth Error Alert */}
          {displayError && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800">
                <span className="font-semibold block">Authentication Error</span>
                <span>{displayError}</span>
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <Button
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center gap-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs font-semibold text-sm"
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

          {/* Feature Pillars */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mb-1.5">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">Deterministic Delays</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mb-1.5">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">BullMQ Queue</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mb-1.5">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">Rate Limited</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Mailora Outbound Scheduling &bull; Signed HttpOnly Sessions &bull; Phase 12
        </p>
      </div>
    </div>
  );
};
