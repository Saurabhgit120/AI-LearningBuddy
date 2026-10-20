import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { User, Mail, Calendar, Shield, Bot, Youtube, Database, LogOut } from 'lucide-react';
import { Badge } from '../components/common/Badge.js';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          User Account Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your credentials, learning statistics, and integration configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 text-2xl font-bold flex items-center justify-center mx-auto border-2 border-emerald-500/40">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user.name}</h2>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <Badge variant="emerald" size="sm">
              Active Student
            </Badge>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Enrolled Since
              </span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Role
              </span>
              <span className="uppercase font-mono text-[11px] font-bold text-emerald-400">
                {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* System & Architecture Info */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white">System Architecture & Integrations</h3>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <Bot className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-semibold mb-0.5">OpenAI API Structured Generator</strong>
                <p className="text-xs text-slate-400">
                  Using GPT-4o-mini with structured JSON outputs validated against strict Zod schemas with automated retries.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <Youtube className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-semibold mb-0.5">YouTube Data API v3</strong>
                <p className="text-xs text-slate-400">
                  Fetches verified video tutorials and caches video queries in PostgreSQL to prevent hitting rate limits.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <Database className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-semibold mb-0.5">Relational Database & Prisma ORM</strong>
                <p className="text-xs text-slate-400">
                  Course outlines, on-demand lesson contents, quiz attempts, and user progress are fully persisted in the relational database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
