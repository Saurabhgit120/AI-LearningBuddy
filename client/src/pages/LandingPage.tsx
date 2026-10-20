import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Cpu,
  Layers,
  GraduationCap,
  PlayCircle,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
  Database,
  Youtube,
  Zap,
} from 'lucide-react';
import { Badge } from '../components/common/Badge.js';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, loginAsDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleDemoSignIn = async () => {
    await loginAsDemoUser();
    navigate('/dashboard');
  };

  return (
    <div className="relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 mb-8 shadow-inner animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Final-Year CS Engineering Capstone</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">Modular Monolith Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Master Any Topic With Your Personalized{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            AI Learning Buddy
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Transform any subject into a structured, step-by-step curriculum. 
          Generate rich interactive lessons, curated video tutorials, verified comprehension quizzes, and study alongside an integrated AI tutor.
        </p>

        {/* CTA Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition-all shadow-glow hover:scale-[1.02]"
            >
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition-all shadow-glow hover:scale-[1.02]"
              >
                Start Learning Free <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base transition-all hover:border-slate-600"
              >
                <PlayCircle className="w-5 h-5 text-emerald-400" /> Explore Demo
              </button>
            </>
          )}
        </div>

        {/* Feature Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> OpenAI Structured Output (Zod Verified)
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> PostgreSQL & Prisma Persistence
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> YouTube Data API v3 Integration
          </div>
        </div>
      </section>

      {/* Interactive Core Flow Showcase */}
      <section id="how-it-works" className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="emerald" size="md">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              From Curiosity to Mastery in 3 Simple Steps
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Every course progresses logically from foundational concepts to capstone projects based on your exact pace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 relative hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-4 border border-emerald-500/20">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Define Your Learning Goals</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Enter any topic—from <span className="text-emerald-400">Quantum Computing</span> to <span className="text-emerald-400">System Design</span>. Customize your skill level, duration in days, and daily study commitment.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 relative hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold mb-4 border border-indigo-500/20">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Builds Your Curriculum</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The OpenAI engine generates an organized syllabus with sequential modules, actionable learning objectives, estimated times, and a capstone project.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 relative hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold mb-4 border border-teal-500/20">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Study, Quiz & Chat with AI</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Read on-demand lessons with code snippets, watch suggested YouTube masterclasses, verify your knowledge with 5-question quizzes, and chat with your AI tutor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="indigo" size="md">Core Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
            Engineered for Deep Learning and Retention
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Packed with robust software engineering patterns and educational science.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Reliable AI Generation</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Powered by strict Zod schema validation and automated server-side retries. Incomplete or invalid course outlines are never saved to the database.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">On-Demand Lesson Engine</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Lessons are dynamically generated upon first access with structured introductions, code examples, practical applications, and 3-5 key takeaways.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Server-Evaluated Quizzes</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Answer keys remain protected on the backend. Submissions are rigorously scored with detailed diagnostic explanations and attempt history.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
              <Youtube className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">YouTube API Integration</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Searches YouTube Data API v3 for high-yield video tutorials. Results are cached in the relational database to conserve quota and ensure low latency.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Contextual AI Tutor</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Ask questions right inside any lesson. The AI tutor explains complex topics using your exact lesson context, with conversation history and one-click reset.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Persistent Progress Tracking</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Tracks completed lessons, overall course percentage, recent activity feeds, and one-click "Resume Learning" from your last accessed position.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Portfolio Review Section */}
      <section id="architecture" className="py-20 bg-slate-900/30 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-4">
                <ShieldCheck className="w-4 h-4" /> Academic & Portfolio Standards
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Architected for Final-Year CS Evaluation
              </h2>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Unlike shallow prototypes, AI Learning Buddy follows software engineering best practices:
                a modular monolithic pattern, strict validation boundaries with Zod, encrypted authentication with bcrypt & JWT,
                normalized relational modeling with Prisma, API rate limiting, and defensive fallback handling.
              </p>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-lg font-bold text-emerald-400">TypeScript</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">End-to-End Safety</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-lg font-bold text-indigo-400">PostgreSQL</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Prisma Relational</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-lg font-bold text-teal-400">OpenAI API</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Structured Output</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-lg font-bold text-amber-400">YouTube v3</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Cached Endpoints</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
