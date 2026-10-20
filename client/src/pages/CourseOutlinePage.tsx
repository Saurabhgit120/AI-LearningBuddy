import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CourseDetail, ModuleSummary } from '../types/index.js';
import { courseApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import {
  BookOpen,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  Circle,
  Award,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Loader2,
  FileText,
  Target,
  ListChecks,
  Briefcase,
} from 'lucide-react';
import { Badge } from '../components/common/Badge.js';
import { ProgressBar } from '../components/common/ProgressBar.js';

export const CourseOutlinePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (courseId) {
      loadCourse(courseId);
    }
  }, [courseId]);

  const loadCourse = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await courseApi.getCourseById(id);
      setCourse(data);

      // Open first 2 modules by default
      const initialOpen: Record<string, boolean> = {};
      data.modules.forEach((m, idx) => {
        initialOpen[m.id] = idx < 2;
      });
      setOpenModules(initialOpen);
    } catch (err: any) {
      showToast(err.message || 'Failed to load course details', 'error');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading course syllabus and modules...</p>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Course Hero Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="emerald" size="sm">
            {course.skillLevel} Level
          </Badge>
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> {course.durationDays} Days Duration
          </span>
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> {course.dailyStudyMinutes} Mins / Day
          </span>
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-500" /> {course.modules.length} Modules ({course.totalLessons} Lessons)
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {course.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-4xl leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Progress Bar & Continue Action */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="w-full sm:max-w-md space-y-1.5">
            <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
              <span>Overall Course Completion</span>
              <span className="text-emerald-400 font-bold">{course.progressPercentage}% ({course.completedLessons}/{course.totalLessons})</span>
            </div>
            <ProgressBar progress={course.progressPercentage} size="md" color="emerald" />
          </div>

          {course.nextLesson && (
            <Link
              to={`/courses/${course.id}/lessons/${course.nextLesson.id}`}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-glow shrink-0 hover:scale-[1.02]"
            >
              <span>{course.completedLessons === 0 ? 'Start Learning' : 'Continue Course'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Grid: Objectives & Prerequisites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Learning Objectives */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            Key Learning Objectives
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            {course.learningObjectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prerequisites & Capstone Project */}
        <div className="space-y-6">
          {/* Prerequisites */}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-indigo-400" />
                Course Prerequisites
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {course.prerequisites.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Final Project */}
          {course.finalProject && (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="amber" size="sm">Capstone Assessment</Badge>
              </div>
              <h4 className="text-sm font-bold text-white">
                {course.finalProject.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {course.finalProject.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modules and Lessons Hierarchy */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Curriculum Structure & Modules
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {course.modules.length} Modules • {course.totalLessons} Lessons
          </span>
        </div>

        <div className="space-y-4">
          {course.modules.map((module) => {
            const isOpen = openModules[module.id] ?? false;
            const completedInModule = module.lessons.filter((l) => l.isCompleted).length;
            const isModuleComplete = completedInModule === module.lessons.length && module.lessons.length > 0;

            return (
              <div
                key={module.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200"
              >
                {/* Module Header Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Module {module.order}
                      </span>
                      {isModuleComplete && (
                        <Badge variant="emerald" size="sm">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {module.title}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-3xl">
                      {module.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-medium text-slate-400 hidden sm:inline">
                      {completedInModule}/{module.lessons.length} done
                    </span>
                    <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </button>

                {/* Lessons in Module */}
                {isOpen && (
                  <div className="border-t border-slate-800/80 divide-y divide-slate-800/60 bg-slate-950/40">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-4 sm:px-6 sm:py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors group"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="mt-0.5">
                            {lesson.isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-600 shrink-0 group-hover:text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                              <Link to={`/courses/${course.id}/lessons/${lesson.id}`}>
                                Lesson {module.order}.{lesson.order}: {lesson.title}
                              </Link>
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" /> ~{lesson.estimatedMinutes} mins
                              </span>
                              {lesson.quizScore && (
                                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                  <Award className="w-3 h-3" /> Quiz: {lesson.quizScore.score}/{lesson.quizScore.total}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <Link
                            to={`/courses/${course.id}/lessons/${lesson.id}`}
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-colors"
                          >
                            <span>{lesson.isCompleted ? 'Review Lesson' : 'Open Lesson'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
