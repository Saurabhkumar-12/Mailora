import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Clock,
  Send,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Puzzle,
  Globe,
  Sliders,
  Users,
  Play,
  TrendingUp,
  BarChart3,
  Calendar,
  Check,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'scheduled' | 'sent'>('overview');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 selection:bg-blue-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Radial Dotted Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none" />

      {/* Sticky Header Navbar */}
      <header className="sticky top-0 z-50 bg-[#0b0f19]/85 backdrop-blur-md border-b border-slate-800/80 px-6 lg:px-12 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Mail className="w-5.5 h-5.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-white leading-none">Mailora</span>
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mt-1">
              Outreach Engine
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">
            Features
          </button>
          <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">
            How it works
          </button>
          <button onClick={() => scrollToSection('integrations')} className="hover:text-white transition-colors">
            Integrations
          </button>
          <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">
            Pricing
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 border-0"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8 backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Trusted by modern teams for email outreach &rarr;</span>
        </div>

        {/* Large Editorial Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Email outreach, <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            scheduled to perfection.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed mb-10">
          Plan, schedule, and manage your email campaigns from one simple workspace. Reach the right people at the right time with automated delivery controls.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/register')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold px-8 py-3.5 shadow-xl shadow-blue-600/30 text-base rounded-xl border-0"
          >
            Start Sending
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => scrollToSection('how-it-works')}
            leftIcon={<Play className="w-4 h-4 text-blue-400 fill-blue-400" />}
            className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold px-7 py-3.5 text-base rounded-xl"
          >
            See How It Works
          </Button>
        </div>

        {/* Quick Value Feature Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full mb-16">
          <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 font-semibold">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Schedule with precision</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Better deliverability</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 font-semibold">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>Grow your business</span>
          </div>
        </div>

        {/* Hero Product Preview Showcase Mockup */}
        <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md relative p-4 sm:p-6 text-left group">
          {/* Header Bar Mockup */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-400 font-mono ml-2">mailora.app/workspace</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Automated Engine Running
            </div>
          </div>

          {/* Stat Cards Row Mockup */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-xs text-slate-400 block font-semibold">Scheduled</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">128</span>
                <span className="text-[10px] text-emerald-400 font-bold">+12%</span>
              </div>
              <span className="text-[11px] text-amber-400 block">Next send in 10 mins</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-xs text-slate-400 block font-semibold">Sent</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">842</span>
                <span className="text-[10px] text-emerald-400 font-bold">+8%</span>
              </div>
              <span className="text-[11px] text-emerald-400 block">100% delivered</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-xs text-slate-400 block font-semibold">Failed</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">14</span>
                <span className="text-[10px] text-rose-400 font-bold">-4%</span>
              </div>
              <span className="text-[11px] text-slate-400 block">Delivery alerts</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-xs text-slate-400 block font-semibold">Sending Limit</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">2,410</span>
                <span className="text-[10px] text-blue-400 font-bold">24%</span>
              </div>
              <span className="text-[11px] text-blue-400 block">Hourly quota limit</span>
            </div>
          </div>

          {/* Sample Campaigns Table Mockup */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden text-xs">
            <div className="px-5 py-3.5 bg-slate-800/50 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Recent Campaigns</span>
              <span className="text-blue-400 font-semibold cursor-pointer">View All</span>
            </div>
            <div className="divide-y divide-slate-800/70">
              <div className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  <span className="font-bold text-white truncate">Product Launch Outreach</span>
                  <span className="text-slate-400 truncate hidden sm:inline">&bull; 256 recipients</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400 font-mono text-[11px]">Today, 10:30 AM</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Sending 45/200 sent
                  </span>
                </div>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  <span className="font-bold text-white truncate">Weekly Newsletter</span>
                  <span className="text-slate-400 truncate hidden sm:inline">&bull; 1,042 recipients</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400 font-mono text-[11px]">Tomorrow, 9:00 AM</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Scheduled
                  </span>
                </div>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  <span className="font-bold text-white truncate">Partnership Outreach</span>
                  <span className="text-slate-400 truncate hidden sm:inline">&bull; 120 recipients</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400 font-mono text-[11px]">Sep 12, 2:00 PM</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Core Features */}
      <section id="features" className="py-24 px-6 lg:px-12 border-t border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-400">Features</h2>
            <p className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Everything you need to stay ahead of your outreach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Schedule with precision</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Set exact future dispatch dates and times for individual emails or bulk campaign lists.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Manage campaigns</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organize campaigns with CSV/TXT lead uploads, deduplication, and staggered dispatches.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Track delivery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect real-time dispatches log, delivered message body previews, and status history.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Control sending limits</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated hourly sending quotas protect domain sender reputation and prevent dispatches overload.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How It Works 5-Step Process */}
      <section id="how-it-works" className="py-24 px-6 lg:px-12 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-400">Workflow</h2>
            <p className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              From idea to inbox in 5 steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
              <span className="text-3xl font-mono font-extrabold text-blue-400 block">01</span>
              <h3 className="text-base font-bold text-white">Create Campaign</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compose your message content and subject line in our simple editor.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
              <span className="text-3xl font-mono font-extrabold text-blue-400 block">02</span>
              <h3 className="text-base font-bold text-white">Add Recipients</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload CSV or TXT lead files with automatic validation & deduplication.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
              <span className="text-3xl font-mono font-extrabold text-blue-400 block">03</span>
              <h3 className="text-base font-bold text-white">Choose Timing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select your future dispatch date, time, and staggered send delays.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
              <span className="text-3xl font-mono font-extrabold text-blue-400 block">04</span>
              <h3 className="text-base font-bold text-white">Track Delivery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monitor real-time progress logs and delivered email previews.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
              <span className="text-3xl font-mono font-extrabold text-blue-400 block">05</span>
              <h3 className="text-base font-bold text-white">Stop or Adjust</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                1-click Stop Sending feature to cancel pending dispatches instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Integrations */}
      <section id="integrations" className="py-24 px-6 lg:px-12 border-t border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-400">Integrations</h2>
            <p className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Built to connect with your tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-start gap-5">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                <Puzzle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">Slack Notifications</h3>
                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    Connected
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Receive instant automated notification alerts in your Slack channels whenever sending limits are hit or campaigns complete.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-start gap-5">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <Globe className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">Google Workspace</h3>
                  <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                    Available
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Secure 1-click single sign-on authentication with your verified Google email workspace account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Final CTA Banner */}
      <section id="pricing" className="py-24 px-6 lg:px-12 border-t border-slate-800/80 bg-gradient-to-b from-slate-950 via-[#0b0f19] to-[#070a12] text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to take control of your inbox?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Join Mailora today to start scheduling, queuing, and sending emails with full delivery controls.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold px-8 py-3.5 shadow-xl text-base rounded-xl border-0"
            >
              Start Sending
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/login')}
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold px-8 py-3.5 text-base rounded-xl"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="border-t border-slate-800/80 py-16 px-6 lg:px-12 text-xs text-slate-400 bg-[#060911]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Mail className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-lg">Mailora</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Plan, schedule, and manage outbound email campaigns from one simple workspace.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Features</button></li>
              <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white">Scheduling</button></li>
              <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white">Campaigns</button></li>
              <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Analytics</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#about" className="hover:text-white">About</a></li>
              <li><a href="#contact" className="hover:text-white">Contact</a></li>
              <li><a href="#careers" className="hover:text-white">Careers</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Legal</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#privacy" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>&copy; {new Date().getFullYear()} Mailora. All rights reserved.</p>
          <p className="font-mono text-[11px]">Schedule. Queue. Send.</p>
        </div>
      </footer>
    </div>
  );
};
