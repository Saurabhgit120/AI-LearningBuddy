import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CourseCardItem, DashboardMetrics } from '../types/index.js';
import { courseApi, progressApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import {
  BookOpen,
  PlusCircle,
  Play,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Loader2,
  BookMarked,
  Activity,
} from 'lucide-react';
import { Badge } from '../components/common/Badge.js';
import { ProgressBar } from '../components/common/ProgressBar.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<CourseCardItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [coursesData, metricsData] = await Promise.all([
        courseApi.getMyCourses(),
        progressApi.getDashboardMetrics(),
      ]);
      setCourses(coursesData);
      setMetrics(metricsData);
    } catch (error: any) {
      showToast(error.message || 'Failed to load dashboard metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? All progress will be removed.`)) {
      return;
    }

    setDeletingCourseId(courseId);
    try {
      await courseApi.deleteCourse(courseId);
      showToast('Course removed successfully', 'success');
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      // Refresh metrics
      const freshMetrics = await progressApi.getDashboardMetrics();
      setMetrics(freshMetrics);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete course', 'error');
    } finally {
      setDeletingCourseId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading your personalized learning dashboard...</p>
      </div>
    );
  }

  const stats = metrics?.stats;
  const resumeLesson = metrics?.resumeLastLesson;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Welcome back, {user?.name || 'Learner'} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your ongoing courses, quiz milestones, and daily study momentum.
          </p>
        </div>

        <Link
          to="/courses/new"
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-glow hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          Generate New Course
        </Link>
      </div>

      {/* Resume Learning Callout Banner */}
      {resumeLesson && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/30 border border-emerald-500/30 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <Play className="w-3 h-3 fill-emerald-400" /> Resume Where You Left Off
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {resumeLesson.lessonTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Course: <span className="text-slate-300 font-medium">{resumeLesson.courseTitle}</span>
            </p>
          </div>

          <Link
            to={`/courses/${resumeLesson.courseId}/lessons/${resumeLesson.lessonId}`}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-glow shrink-0"
          >
            Continue Lesson <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{stats?.totalCourses || 0}</div>
            <div className="text-xs text-slate-400 font-medium">Total Courses</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{stats?.inProgressCoursesCount || 0}</div>
            <div className="text-xs text-slate-400 font-medium">In Progress</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{stats?.completedLessons || 0} / {stats?.totalLessons || 0}</div>
            <div className="text-xs text-slate-400 font-medium">Lessons Completed ({stats?.overallCompletionPercentage || 0}%)</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{stats?.quizzesTaken || 0}</div>
            <div className="text-xs text-slate-400 font-medium">Quizzes Completed</div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Courses Grid & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Courses List (2 Columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-emerald-400" />
              My Enrolled Courses ({courses.length})
            </h2>
          </div>

          {courses.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No courses generated yet</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Enter any skill or subject you'd like to learn, and our AI will build a complete structured roadmap for you.
              </p>
              <Link
                to="/courses/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-glow"
              >
                <PlusCircle className="w-4 h-4" /> Create Your First Course
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="emerald" size="sm">
                          {course.skillLevel}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> {course.durationDays} days
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {course.dailyStudyMinutes} mins/day
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Layers className="w-3.5 h-3.5 text-slate-500" /> {course.modulesCount} modules
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        <Link to={`/courses/${course.id}`}>{course.title}</Link>
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      disabled={deletingCourseId === course.id}
                      title="Delete course"
                      className="self-end sm:self-start p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                      <span>Progress ({course.completedLessons} of {course.totalLessons} lessons)</span>
                      <span className="text-emerald-400 font-bold">{course.progressPercentage}%</span>
                    </div>
                    <ProgressBar progress={course.progressPercentage} size="md" color="emerald" />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-500">
                      Topic: <strong className="text-slate-400">{course.topic}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/courses/${course.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        View Outline
                      </Link>
                      <Link
                        to={course.nextLessonId ? `/courses/${course.id}/lessons/${course.nextLessonId}` : `/courses/${course.id}`}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-glow"
                      >
                        {course.isCompleted ? 'Review' : 'Continue'} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Learning Activity Feed */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Recent Activity
          </h2>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 divide-y divide-slate-800/80">
            {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              metrics.recentActivity.map((act, i) => (
                <div key={i} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      act.type === 'lesson_completed'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : act.type === 'quiz_taken'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    {act.type === 'lesson_completed' && <CheckCircle2 className="w-4 h-4" />}
                    {act.type === 'quiz_taken' && <Award className="w-4 h-4" />}
                    {act.type === 'course_created' && <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{act.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{act.subtitle}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(act.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                No recent activity recorded yet. Start studying a lesson!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
