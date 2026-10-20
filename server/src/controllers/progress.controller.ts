import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class ProgressController {
  /**
   * Get comprehensive dashboard metrics and recent activity for the user
   */
  static async getDashboardMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      // 1. Fetch user's courses with module and lesson counts
      const courses = await prisma.course.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          modules: {
            include: {
              lessons: {
                select: {
                  id: true,
                  title: true,
                  order: true,
                  progress: {
                    where: { userId },
                    select: { isCompleted: true, completedAt: true, lastAccessedAt: true },
                  },
                },
              },
            },
          },
        },
      });

      let totalCourses = courses.length;
      let completedCoursesCount = 0;
      let inProgressCoursesCount = 0;
      let totalLessonsAcrossAll = 0;
      let totalCompletedLessonsAcrossAll = 0;

      let lastActiveLessonInfo: {
        courseId: string;
        courseTitle: string;
        lessonId: string;
        lessonTitle: string;
        lastAccessedAt: Date;
      } | null = null;

      for (const course of courses) {
        let courseLessons = 0;
        let courseCompletedLessons = 0;

        for (const mod of course.modules) {
          for (const les of mod.lessons) {
            courseLessons++;
            totalLessonsAcrossAll++;

            const prog = les.progress[0];
            if (prog?.isCompleted) {
              courseCompletedLessons++;
              totalCompletedLessonsAcrossAll++;
            }

            if (prog?.lastAccessedAt) {
              if (!lastActiveLessonInfo || prog.lastAccessedAt > lastActiveLessonInfo.lastAccessedAt) {
                lastActiveLessonInfo = {
                  courseId: course.id,
                  courseTitle: course.title,
                  lessonId: les.id,
                  lessonTitle: les.title,
                  lastAccessedAt: prog.lastAccessedAt,
                };
              }
            }
          }
        }

        if (courseLessons > 0 && courseCompletedLessons === courseLessons) {
          completedCoursesCount++;
        } else if (courseCompletedLessons > 0) {
          inProgressCoursesCount++;
        }
      }

      // If no lesson was explicitly accessed yet, select the first lesson of the most recently created course
      if (!lastActiveLessonInfo && courses.length > 0 && courses[0].modules[0]?.lessons[0]) {
        lastActiveLessonInfo = {
          courseId: courses[0].id,
          courseTitle: courses[0].title,
          lessonId: courses[0].modules[0].lessons[0].id,
          lessonTitle: courses[0].modules[0].lessons[0].title,
          lastAccessedAt: courses[0].createdAt,
        };
      }

      const overallCompletionPercentage = totalLessonsAcrossAll > 0 
        ? Math.round((totalCompletedLessonsAcrossAll / totalLessonsAcrossAll) * 100) 
        : 0;

      // 2. Fetch recent quiz attempts
      const recentQuizAttempts = await prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 5,
        include: {
          quiz: {
            include: {
              lesson: {
                select: { id: true, title: true, module: { select: { course: { select: { id: true, title: true } } } } },
              },
            },
          },
        },
      });

      // 3. Fetch recently completed lessons
      const recentCompletedLessons = await prisma.lessonProgress.findMany({
        where: { userId, isCompleted: true },
        orderBy: { completedAt: 'desc' },
        take: 5,
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              module: { select: { course: { select: { id: true, title: true } } } },
            },
          },
        },
      });

      // Format unified activity feed
      const activityFeed: Array<{
        type: 'course_created' | 'lesson_completed' | 'quiz_taken';
        title: string;
        subtitle: string;
        timestamp: Date;
        targetId: string;
      }> = [];

      courses.slice(0, 3).forEach((c) => {
        activityFeed.push({
          type: 'course_created',
          title: `Created course: ${c.title}`,
          subtitle: `Target: ${c.skillLevel} • ${c.durationDays} days`,
          timestamp: c.createdAt,
          targetId: c.id,
        });
      });

      recentCompletedLessons.forEach((p) => {
        if (p.completedAt) {
          activityFeed.push({
            type: 'lesson_completed',
            title: `Completed lesson: ${p.lesson.title}`,
            subtitle: p.lesson.module.course.title,
            timestamp: p.completedAt,
            targetId: p.lesson.id,
          });
        }
      });

      recentQuizAttempts.forEach((q) => {
        activityFeed.push({
          type: 'quiz_taken',
          title: `Scored ${q.score}/${q.totalQuestions} on Quiz`,
          subtitle: `${q.quiz.lesson.title} (${q.passed ? 'Passed' : 'Needs Practice'})`,
          timestamp: q.completedAt,
          targetId: q.quiz.lesson.id,
        });
      });

      // Sort activity feed by timestamp descending
      activityFeed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return sendSuccess(res, {
        stats: {
          totalCourses,
          inProgressCoursesCount,
          completedCoursesCount,
          totalLessons: totalLessonsAcrossAll,
          completedLessons: totalCompletedLessonsAcrossAll,
          overallCompletionPercentage,
          quizzesTaken: recentQuizAttempts.length,
        },
        resumeLastLesson: lastActiveLessonInfo,
        recentActivity: activityFeed.slice(0, 10),
      });
    } catch (error) {
      console.error('[ProgressController.getDashboardMetrics] Error:', error);
      return sendError(res, 'Failed to fetch dashboard metrics', 500, error);
    }
  }
}
