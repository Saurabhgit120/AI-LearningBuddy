import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AiService } from '../services/ai.service.js';
import { YouTubeService } from '../services/youtube.service.js';

export class LessonController {
  /**
   * Get lesson details, generate educational content on demand if not cached,
   * track last accessed timestamp, and fetch YouTube video suggestions
   */
  static async getLessonById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { lessonId } = req.params;

      // Find lesson and verify course ownership
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              course: true,
              lessons: {
                orderBy: { order: 'asc' },
                select: { id: true, title: true, order: true },
              },
            },
          },
          quizzes: {
            select: { id: true, title: true },
          },
        },
      });

      if (!lesson || lesson.module.course.userId !== userId) {
        return sendError(res, 'Lesson not found or access denied', 404);
      }

      const course = lesson.module.course;
      const learningObjectives = JSON.parse(lesson.learningObjectives || '[]');

      // 1. Generate content on-demand if not already generated
      let contentData: any = null;
      if (lesson.content && lesson.isGenerated) {
        try {
          contentData = JSON.parse(lesson.content);
        } catch {
          contentData = { raw: lesson.content };
        }
      } else {
        // Generate via AI Service
        const generatedLesson = await AiService.generateLessonContent({
          courseTopic: course.topic,
          courseDescription: course.description,
          moduleTitle: lesson.module.title,
          lessonTitle: lesson.title,
          learningObjectives,
          skillLevel: course.skillLevel,
        });

        // Store generated lesson in database so it never needs to be regenerated
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: {
            content: JSON.stringify(generatedLesson),
            isGenerated: true,
          },
        });

        contentData = generatedLesson;
      }

      // 2. Update user progress record: record last accessed
      const progress = await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        update: {
          lastAccessedAt: new Date(),
        },
        create: {
          userId,
          lessonId,
          isCompleted: false,
          lastAccessedAt: new Date(),
        },
      });

      // 3. Find previous and next lessons across all modules in the course
      const allCourseLessons = await prisma.lesson.findMany({
        where: {
          module: { courseId: course.id },
        },
        orderBy: [
          { module: { order: 'asc' } },
          { order: 'asc' },
        ],
        select: { id: true, title: true, moduleId: true },
      });

      const currentIndex = allCourseLessons.findIndex((l) => l.id === lesson.id);
      const prevLesson = currentIndex > 0 ? allCourseLessons[currentIndex - 1] : null;
      const nextLesson = currentIndex < allCourseLessons.length - 1 ? allCourseLessons[currentIndex + 1] : null;

      // 4. Fetch YouTube suggestions (with database cache and graceful fallback)
      const { videos, source } = await YouTubeService.searchVideos({
        topic: course.topic,
        lessonTitle: lesson.title,
        maxResults: 3,
      });

      return sendSuccess(res, {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          estimatedMinutes: lesson.estimatedMinutes,
          learningObjectives,
          content: contentData,
          isCompleted: progress.isCompleted,
          completedAt: progress.completedAt,
          quizId: lesson.quizzes[0]?.id || null,
        },
        module: {
          id: lesson.module.id,
          title: lesson.module.title,
          description: lesson.module.description,
          order: lesson.module.order,
        },
        course: {
          id: course.id,
          title: course.title,
          topic: course.topic,
          skillLevel: course.skillLevel,
        },
        navigation: {
          prevLesson,
          nextLesson,
          currentPosition: currentIndex + 1,
          totalLessons: allCourseLessons.length,
        },
        youtubeSuggestions: {
          videos,
          source,
        },
      });
    } catch (error) {
      console.error('[LessonController.getLessonById] Error:', error);
      return sendError(res, 'Failed to load lesson content', 500, error);
    }
  }

  /**
   * Toggle lesson completed status
   */
  static async toggleComplete(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { lessonId } = req.params;
      const { isCompleted } = req.body;

      // Verify lesson and user
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: { include: { course: true } },
        },
      });

      if (!lesson || lesson.module.course.userId !== userId) {
        return sendError(res, 'Lesson not found or access denied', 404);
      }

      const updated = await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        update: {
          isCompleted: !!isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastAccessedAt: new Date(),
        },
        create: {
          userId,
          lessonId,
          isCompleted: !!isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastAccessedAt: new Date(),
        },
      });

      // Calculate new course progress
      const totalLessonsCount = await prisma.lesson.count({
        where: { module: { courseId: lesson.module.courseId } },
      });

      const completedCount = await prisma.lessonProgress.count({
        where: {
          userId,
          isCompleted: true,
          lesson: { module: { courseId: lesson.module.courseId } },
        },
      });

      const percentage = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

      return sendSuccess(res, {
        lessonId: lesson.id,
        isCompleted: updated.isCompleted,
        completedAt: updated.completedAt,
        courseProgress: {
          totalLessons: totalLessonsCount,
          completedLessons: completedCount,
          percentage,
        },
      }, isCompleted ? 'Lesson marked as completed!' : 'Lesson marked as incomplete');
    } catch (error) {
      console.error('[LessonController.toggleComplete] Error:', error);
      return sendError(res, 'Failed to update lesson status', 500, error);
    }
  }
}
