import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FullLessonResponse, CourseDetail } from '../types/index.js';
import { lessonApi, courseApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Award,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  Check,
  Menu,
  X,
  Loader2,
  BookMarked,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../components/common/Badge.js';
import { ProgressBar } from '../components/common/ProgressBar.js';
import { YouTubeSection } from '../components/lesson/YouTubeSection.js';
import { LessonChatbot } from '../components/lesson/LessonChatbot.js';
import { QuizModal } from '../components/quiz/QuizModal.js';

export const LessonPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [lessonData, setLessonData] = useState<FullLessonResponse | null>(null);
  const [courseOutline, setCourseOutline] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingComplete, setIsTogglingComplete] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState<number | null>(null);

  useEffect(() => {
    if (lessonId) {
      loadLessonContent(lessonId);
    }
  }, [lessonId]);

  useEffect(() => {
    if (courseId) {
      loadCourseOutline(courseId);
    }
  }, [courseId]);

  const loadLessonContent = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await lessonApi.getLessonById(id);
      setLessonData(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load lesson content', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourseOutline = async (cId: string) => {
    try {
      const data = await courseApi.getCourseById(cId);
      setCourseOutline(data);
    } catch (e) {
      console.warn('Could not load course outline for sidebar:', e);
    }
  };

  const handleToggleComplete = async () => {
    if (!lessonData || isTogglingComplete) return;

    const newStatus = !lessonData.lesson.isCompleted;
    setIsTogglingComplete(true);

    try {
      const res = await lessonApi.toggleComplete(lessonData.lesson.id, newStatus);
      setLessonData((prev) =>
        prev
          ? {
              ...prev,
              lesson: {
                ...prev.lesson,
                isCompleted: res.isCompleted,
                completedAt: res.completedAt,
              },
            }
          : null
      );

      // Refresh sidebar outline progress
      if (courseId) {
        loadCourseOutline(courseId);
      }

      showToast(
        newStatus ? 'Lesson marked as completed!' : 'Lesson marked as incomplete',
        'success'
      );
    } catch (error: any) {
      showToast(error.message || 'Failed to update lesson status', 'error');
    } finally {
      setIsTogglingComplete(false);
    }
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetIdx(idx);
    setTimeout(() => setCopiedSnippetIdx(null), 2000);
    showToast('Code copied to clipboard!', 'info');
  };

  if (isLoading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-base text-slate-200 font-semibold">Generating & preparing lesson content...</p>
        <p className="text-xs text-slate-400 max-w-sm text-center">
          First-time access generates detailed explanations and exercises via AI. Content is automatically cached for instant future reading.
        </p>
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Lesson not found</h2>
        <Link
          to={courseId ? `/courses/${courseId}` : '/dashboard'}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
        >
          Back to Course Outline
        </Link>
      </div>
    );
  }

  const { lesson, module, course, navigation, youtubeSuggestions } = lessonData;
  const content = lesson.content;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Lesson Sub-Nav Header */}
      <div className="sticky top-16 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Toggle Course Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>

          <Link
            to={`/courses/${course.id}`}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Outline
          </Link>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block truncate">
              {course.title} • Module {module.order}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {lesson.title}
            </h2>
          </div>
        </div>

        {/* Actions: Mark Complete & Take Quiz */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsQuizModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Comprehension</span> Quiz
          </button>

          <button
            type="button"
            onClick={handleToggleComplete}
            disabled={isTogglingComplete}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              lesson.isCompleted
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-500/50'
            }`}
          >
            {lesson.isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5 text-slate-400" />
                <span>Mark Complete</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Layout Container (Sidebar + Reader) */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 relative">
        {/* Course Navigation Sidebar (Collapsible on mobile, sticky on desktop) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 p-5 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-80 lg:shrink-0 lg:bg-transparent lg:border-r-0 lg:p-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="sticky top-32 space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Course Curriculum
              </h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Modules Tree */}
            {courseOutline && (
              <div className="space-y-4">
                {courseOutline.modules.map((m) => (
                  <div key={m.id} className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Module {m.order}: {m.title}
                    </span>
                    <div className="space-y-1 border-l-2 border-slate-800 ml-1 pl-2.5">
                      {m.lessons.map((l) => {
                        const isCurrent = l.id === lesson.id;
                        return (
                          <Link
                            key={l.id}
                            to={`/courses/${course.id}/lessons/${l.id}`}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs transition-colors ${
                              isCurrent
                                ? 'bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            {l.isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className="truncate">{l.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-30 lg:hidden"
          />
        )}

        {/* Lesson Reading Content Canvas */}
        <main className="flex-1 min-w-0 max-w-4xl space-y-10">
          {/* Title Header */}
          <div className="space-y-3 pb-6 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo" size="sm">
                Module {module.order}
              </Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> ~{lesson.estimatedMinutes} Mins Read
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Lesson {navigation.currentPosition} of {navigation.totalLessons}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
              {lesson.title}
            </h1>

            {/* Learning Objectives Pills */}
            <div className="pt-2 flex flex-wrap gap-2">
              {lesson.learningObjectives.map((obj, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300"
                >
                  <Check className="w-3 h-3 text-emerald-400" /> {obj}
                </span>
              ))}
            </div>
          </div>

          {/* Lesson Introduction */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-sm sm:text-base text-slate-300 leading-relaxed space-y-2">
            <strong className="block text-emerald-400 font-bold uppercase text-xs tracking-wider">
              Introduction & Context
            </strong>
            <p>{content.introduction}</p>
          </div>

          {/* Structured Sections */}
          <div className="space-y-8">
            {content.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-extrabold flex items-center justify-center border border-emerald-500/20">
                    {sIdx + 1}
                  </span>
                  {section.heading}
                </h3>

                <div className="text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-line pl-2">
                  {section.content}
                </div>

                {/* Optional Code Snippet with Copy Button */}
                {section.codeSnippet && (
                  <div className="my-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
                    <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-emerald-400 uppercase">
                        {section.codeSnippet.language}
                      </span>
                      <button
                        onClick={() => handleCopyCode(section.codeSnippet!.code, sIdx)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                      >
                        {copiedSnippetIdx === sIdx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy Code
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-200 bg-slate-950/90 leading-relaxed">
                      <code>{section.codeSnippet.code}</code>
                    </pre>

                    {section.codeSnippet.explanation && (
                      <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-800/80 text-xs text-slate-400">
                        <strong className="text-slate-300">Code Breakdown: </strong>
                        {section.codeSnippet.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Practical Applications */}
          {content.practicalApplications && content.practicalApplications.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" /> Real-World Industry Applications
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {content.practicalApplications.map((app, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                    <span>{app}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary and Key Takeaways Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-900 to-emerald-950/20 border border-emerald-500/30 space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Lesson Summary & Key Takeaways
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {content.summary}
            </p>

            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Key Takeaways:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {content.keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* YouTube Video Suggestions Section */}
          <YouTubeSection
            videos={youtubeSuggestions.videos}
            source={youtubeSuggestions.source}
            topic={course.topic}
          />

          {/* Quiz Call to Action Banner */}
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Test Your Knowledge
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Take a 5-question AI-generated quiz to verify your understanding of this lesson.
              </p>
            </div>
            <button
              onClick={() => setIsQuizModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all shadow-glow shrink-0"
            >
              Start Comprehension Quiz
            </button>
          </div>

          {/* Navigation Controls: Prev & Next Lesson */}
          <div className="pt-8 border-t border-slate-800 flex items-center justify-between gap-4">
            {navigation.prevLesson ? (
              <Link
                to={`/courses/${course.id}/lessons/${navigation.prevLesson.id}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous:</span> {navigation.prevLesson.title}
              </Link>
            ) : (
              <div />
            )}

            {navigation.nextLesson ? (
              <Link
                to={`/courses/${course.id}/lessons/${navigation.nextLesson.id}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-glow"
              >
                <span>Next: {navigation.nextLesson.title}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to={`/courses/${course.id}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-glow"
              >
                <span>Course Completed! View Outline</span>
                <CheckCircle2 className="w-4 h-4" />
              </Link>
            )}
          </div>
        </main>
      </div>

      {/* Floating Lesson AI Chatbot Panel */}
      <LessonChatbot lessonId={lesson.id} lessonTitle={lesson.title} />

      {/* Interactive Quiz Modal */}
      <QuizModal
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        onCompletedSuccess={() => {
          setLessonData((prev) =>
            prev ? { ...prev, lesson: { ...prev.lesson, isCompleted: true } } : null
          );
          if (courseId) loadCourseOutline(courseId);
        }}
      />
    </div>
  );
};
