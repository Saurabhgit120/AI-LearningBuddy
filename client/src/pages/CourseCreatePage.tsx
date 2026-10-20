import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { SkillLevel } from '../types/index.js';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Target,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { Badge } from '../components/common/Badge.js';

const INSPIRATION_TOPICS = [
  'Modern Full-Stack React & Node.js',
  'Deep Learning & Neural Networks',
  'System Design & Microservices',
  'Data Structures & Algorithms',
  'Docker, Kubernetes & DevOps',
  'Cybersecurity & Ethical Hacking',
];

export const CourseCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [topic, setTopic] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Beginner');
  const [durationDays, setDurationDays] = useState<number>(14);
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState<number>(30);
  const [learningGoal, setLearningGoal] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      showToast('Please enter a topic to study.', 'error');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep(1);

    // Multi-phase progress ticker for smooth UX
    const timer1 = setTimeout(() => setGenerationStep(2), 1500);
    const timer2 = setTimeout(() => setGenerationStep(3), 3500);
    const timer3 = setTimeout(() => setGenerationStep(4), 5500);

    try {
      const course = await courseApi.generateCourse({
        topic: topic.trim(),
        skillLevel,
        durationDays: Number(durationDays),
        dailyStudyMinutes: Number(dailyStudyMinutes),
        learningGoal: learningGoal.trim() || undefined,
      });

      showToast(`🎉 "${course.title}" generated successfully!`, 'success');
      navigate(`/courses/${course.id}`);
    } catch (error: any) {
      console.error('Course generation error:', error);
      setErrorMessage(error.message || 'Failed to generate course. Please try again.');
      showToast(error.message || 'Generation failed', 'error');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-3">
          <Sparkles className="w-3.5 h-3.5" /> OpenAI Curriculum Architect
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Generate A Personalized Course
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Tell us what you want to master. We'll generate a modular roadmap with lessons, video references, and quizzes.
        </p>
      </div>

      {/* Main Generation Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
        {isGenerating ? (
          /* Animated Multi-Step Loading State */
          <div className="py-16 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-glow">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                Designing your curriculum for "{topic}"...
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Our AI curriculum architect is synthesizing optimal milestones and structuring lessons.
              </p>
            </div>

            {/* Step Checkmarks */}
            <div className="max-w-xs mx-auto space-y-2.5 text-xs text-left pt-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Analyzing target skill level: {skillLevel}</span>
              </div>
              <div className={`flex items-center gap-2 ${generationStep >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {generationStep >= 2 ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />}
                <span>Sequencing modules from foundational to advanced</span>
              </div>
              <div className={`flex items-center gap-2 ${generationStep >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {generationStep >= 3 ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />}
                <span>Defining actionable lesson objectives and times</span>
              </div>
              <div className={`flex items-center gap-2 ${generationStep >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {generationStep >= 4 ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />}
                <span>Validating with strict Zod schema & database persistence</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Notification */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Course Generation Notice</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Field 1: Topic */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                What topic do you want to learn? <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <BookOpen className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Distributed Systems Architecture, Deep Learning with PyTorch, Next.js 14"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Inspiration Pills */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Popular student topics:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {INSPIRATION_TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Field 2: Skill Level */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Current Skill Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['Beginner', 'Intermediate', 'Advanced'] as SkillLevel[]).map((level) => {
                  const isSelected = skillLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSkillLevel(level)}
                      className={`py-3 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-glow'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 3 & 4: Duration & Daily Study Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Duration in Days */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Target Course Duration (Days)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Typically 7–30 days depending on depth of topic
                </p>
              </div>

              {/* Daily Study Time (Mins) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Daily Study Time
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDailyStudyMinutes(mins)}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                        dailyStudyMinutes === mins
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Lesson durations will align with your daily bandwidth
                </p>
              </div>
            </div>

            {/* Field 5: Learning Goal */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Personal Learning Goal (Optional)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="e.g. Prepare for junior software engineer interviews, build an open-source project, pass exam"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base transition-all shadow-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              Generate Course Outline with AI
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
