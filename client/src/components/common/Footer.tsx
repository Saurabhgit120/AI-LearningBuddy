import React from 'react';
import { Sparkles, Code2, Database, Bot, Youtube, Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">AI Learning Buddy</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              An intelligent, responsive educational platform demonstrating production-grade full-stack architecture, 
              AI structured generation with OpenAI, Prisma relational ORM, YouTube Data API integration, and verifiable comprehension assessments.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                <Code2 className="w-3 h-3 text-emerald-400" /> React + TypeScript + Vite
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                <Database className="w-3 h-3 text-emerald-400" /> PostgreSQL + Prisma
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                <Bot className="w-3 h-3 text-emerald-400" /> OpenAI Structured Output
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                <Youtube className="w-3 h-3 text-emerald-400" /> YouTube Data API v3
              </span>
            </div>
          </div>

          {/* Core Capabilities */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Core Engine</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-slate-400 hover:text-slate-300">Curriculum Generator</span></li>
              <li><span className="text-slate-400 hover:text-slate-300">On-Demand Lesson Engine</span></li>
              <li><span className="text-slate-400 hover:text-slate-300">Smart Quiz Evaluator</span></li>
              <li><span className="text-slate-400 hover:text-slate-300">Lesson Contextual AI Tutor</span></li>
              <li><span className="text-slate-400 hover:text-slate-300">Progress Tracker</span></li>
            </ul>
          </div>

          {/* Academic Portfolio */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Portfolio Project</h4>
            <p className="text-sm text-slate-400 mb-3">
              Built as a flagship Full-Stack Software Engineering capstone demonstrating:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">✓ Modular Monolithic Architecture</li>
              <li className="flex items-center gap-1.5">✓ Strict Zod Validation & Schema Safety</li>
              <li className="flex items-center gap-1.5">✓ JWT Auth & Password Hashing</li>
              <li className="flex items-center gap-1.5">✓ Rate Limiting & Graceful API Fallbacks</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AI Learning Buddy. Developed for Final-Year CS Portfolio.</p>
          <p className="flex items-center gap-2">
            <span>Clean Architecture</span> • <span>Zero Unnecessary Bloat</span> • <span>Production Ready</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
