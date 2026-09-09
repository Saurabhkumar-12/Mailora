import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './layouts/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScheduledEmailsPage } from './pages/ScheduledEmailsPage';
import { SentEmailsPage } from './pages/SentEmailsPage';
import { ComposePage } from './pages/ComposePage';
import { ContactsPage } from './pages/ContactsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Mail, Loader2 } from 'lucide-react';

const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg animate-bounce">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Loading Mailora...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <AppLayout />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Landing & Public Auth Routes */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Root Route: Landing if unauthenticated, AppLayout if authenticated */}
            <Route path="/" element={<RootRoute />}>
              <Route index element={<DashboardPage />} />
              <Route path="scheduled" element={<ScheduledEmailsPage />} />
              <Route path="sent" element={<SentEmailsPage />} />
              <Route path="compose" element={<ComposePage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Protected routes when directly accessed by path */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
