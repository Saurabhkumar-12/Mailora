import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Loader2, Mail } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case '/':
        return 'Overview';
      case '/scheduled':
        return 'Scheduled Emails';
      case '/sent':
        return 'Sent Emails';
      case '/compose':
        return 'Compose Email';
      case '/contacts':
        return 'Contacts';
      case '/integrations':
        return 'Integrations';
      case '/settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 animate-bounce">
            <Mail className="w-6 h-6" />
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
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex font-sans antialiased relative">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 relative z-10">
        <Header onMenuToggle={() => setSidebarOpen(true)} title={getPageTitle(location.pathname)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
