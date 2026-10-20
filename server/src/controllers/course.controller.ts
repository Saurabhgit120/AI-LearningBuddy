import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AiService } from '../services/ai.service.js';
import { GenerateCourseInput } from '../schemas/course.schema.js';

export class CourseController {
  /**
   * Generate a new course outline with AI and persist upon validation
   */
  static async generateCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const input: GenerateCourseInput = req.body;

      // Duplicate prevention: check if a course with exact same topic was created in the last 15 seconds
      const recentCourse = await prisma.course.findFirst({
        where: {
          userId,
          topic: { equals: input.topic },
          createdAt: {
            gte: new Date(Date.now() - 15000),
          },
        },
      });

      if (recentCourse) {
        return sendError(
          res,
          'A course with this topic is currently being generated or was just created. Please check your dashboard.',
          429
        );
      }

      // Create initial course record with "generating" status
      const initialCourse = await prisma.course.create({
        data: {
          userId,
          title: `Course on ${input.topic}`,
          description: 'Generating comprehensive course outline with AI...',
          topic: input.topic,
          skillLevel: input.skillLevel,
          durationDays: input.durationDays,
          dailyStudyMinutes: input.dailyStudyMinutes,
          learningGoal: input.learningGoal || null,
          learningObjectives: JSON.stringify([]),
          status: 'generating',
        },
      });

      try {
        // Generate AI outline (Strictly validated by Zod inside AiService)
        const outline = await AiService.generateCourseOutline(input);

        // Transaction to update course and insert modules + lessons
        const updatedCourse = await prisma.$transaction(async (tx) => {
          // 1. Update course details
          const course = await tx.course.update({
            where: { id: initialCourse.id },
            data: {
              title: outline.title,
              description: outline.description,
              learningObjectives: JSON.stringify(outline.learningObjectives),
              prerequisites: JSON.stringify(outline.prerequisites || []),
              finalProject: outline.finalProject ? JSON.stringify(outline.finalProject) : null,
              status: 'completed',
            },
          });

          // 2. Create modules and lessons
          for (let mIdx = 0; mIdx < outline.modules.length; mIdx++) {
            const m = outline.modules[mIdx];
            const createdModule = await tx.module.create({
              data: {
                courseId: course.id,
                order: mIdx + 1,
                title: m.title,
                description: m.description,
              },
            });

            for (let lIdx = 0; lIdx < m.lessons.length; lIdx++) {
              const l = m.lessons[lIdx];
              await tx.lesson.create({
                data: {
                  moduleId: createdModule.id,
                  order: lIdx + 1,
                  title: l.title,
                  learningObjectives: JSON.stringify(l.learningObjectives),
                  estimatedMinutes: l.estimatedMinutes,
                  isGenerated: false,
                },
              });
            }
          }

          return course;
        });

        // Retrieve complete newly created course with modules and lessons
        const completeCourse = await prisma.course.findUnique({
          where: { id: updatedCourse.id },
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        });

        return sendSuccess(res, completeCourse, 'Course generated successfully', 201);
      } catch (genError: any) {
        console.error('[CourseController.generateCourse] Generation error:', genError);

        // Mark course as failed
        await prisma.course.update({
          where: { id: initialCourse.id },
          data: {
            status: 'failed',
            generationError: genError?.message || 'Failed to generate course outline',
          },
        });

        return sendError(
          res,
          'Failed to generate course outline. Please try again or refine your topic.',
          500,
          genError?.message
        );
      }
    } catch (error: any) {
      console.error('[CourseController.generateCourse] Fatal error:', error);
      return sendError(res, 'Internal server error while creating course.', 500, error);
    }
  }

  /**
   * Get all courses for the authenticated user with progress metrics
   */
  static async getMyCourses(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

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
                  estimatedMinutes: true,
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

      // Calculate progress stats for each course
      const coursesWithProgress = courses.map((course) => {
        let totalLessons = 0;
        let completedLessons = 0;
        let lastAccessedDate: Date | null = null;
        let nextLessonId: string | null = null;

        for (const mod of course.modules) {
          for (const les of mod.lessons) {
            totalLessons++;
            const userProg = les.progress[0];
            if (userProg?.isCompleted) {
              completedLessons++;
            } else if (!nextLessonId) {
              nextLessonId = les.id;
            }

            if (userProg?.lastAccessedAt) {
              if (!lastAccessedDate || userProg.lastAccessedAt > lastAccessedDate) {
                lastAccessedDate = userProg.lastAccessedAt;
              }
            }
          }
        }

        const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        const isCompleted = totalLessons > 0 && completedLessons === totalLessons;

        // If no uncompleted lesson found, nextLesson is first lesson
        if (!nextLessonId && course.modules[0]?.lessons[0]) {
          nextLessonId = course.modules[0].lessons[0].id;
        }

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          topic: course.topic,
          skillLevel: course.skillLevel,
          durationDays: course.durationDays,
          dailyStudyMinutes: course.dailyStudyMinutes,
          status: course.status,
          totalLessons,
          completedLessons,
          progressPercentage: percentage,
          isCompleted,
          nextLessonId,
          lastAccessedAt: lastAccessedDate || course.updatedAt,
          createdAt: course.createdAt,
          modulesCount: course.modules.length,
        };
      });

      return sendSuccess(res, coursesWithProgress);
    } catch (error) {
      console.error('[CourseController.getMyCourses] Error:', error);
      return sendError(res, 'Failed to fetch courses', 500, error);
    }
  }

  /**
   * Get single course details with outline hierarchy and progress
   */
  static async getCourseById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { courseId } = req.params;

      const course = await prisma.course.findFirst({
        where: { id: courseId, userId },
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                include: {
                  progress: {
                    where: { userId },
                    select: { isCompleted: true, completedAt: true, lastAccessedAt: true },
                  },
                  quizzes: {
                    select: {
                      id: true,
                      title: true,
                      attempts: {
                        where: { userId },
                        orderBy: { completedAt: 'desc' },
                        take: 1,
                        select: { score: true, totalQuestions: true, passed: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!course) {
        return sendError(res, 'Course not found or access denied.', 404);
      }

      // Format course data
      let totalLessons = 0;
      let completedLessons = 0;
      let nextLesson: { id: string; title: string; moduleTitle: string } | null = null;

      const formattedModules = course.modules.map((m) => {
        const formattedLessons = m.lessons.map((l) => {
          totalLessons++;
          const isCompleted = l.progress[0]?.isCompleted || false;
          if (isCompleted) {
            completedLessons++;
          } else if (!nextLesson) {
            nextLesson = { id: l.id, title: l.title, moduleTitle: m.title };
          }

          const latestQuiz = l.quizzes[0];
          const quizAttempt = latestQuiz?.attempts[0] || null;

          return {
            id: l.id,
            moduleId: l.moduleId,
            order: l.order,
            title: l.title,
            learningObjectives: JSON.parse(l.learningObjectives || '[]'),
            estimatedMinutes: l.estimatedMinutes,
            isCompleted,
            isGenerated: l.isGenerated,
            completedAt: l.progress[0]?.completedAt || null,
            quizId: latestQuiz?.id || null,
            quizScore: quizAttempt ? { score: quizAttempt.score, total: quizAttempt.totalQuestions, passed: quizAttempt.passed } : null,
          };
        });

        return {
          id: m.id,
          order: m.order,
          title: m.title,
          description: m.description,
          lessons: formattedLessons,
        };
      });

      const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const responsePayload = {
        id: course.id,
        title: course.title,
        description: course.description,
        topic: course.topic,
        skillLevel: course.skillLevel,
        durationDays: course.durationDays,
        dailyStudyMinutes: course.dailyStudyMinutes,
        learningGoal: course.learningGoal,
        learningObjectives: JSON.parse(course.learningObjectives || '[]'),
        prerequisites: JSON.parse(course.prerequisites || '[]'),
        finalProject: course.finalProject ? JSON.parse(course.finalProject) : null,
        status: course.status,
        generationError: course.generationError,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        totalLessons,
        completedLessons,
        progressPercentage: percentage,
        nextLesson: nextLesson || (formattedModules[0]?.lessons[0] ? { id: formattedModules[0].lessons[0].id, title: formattedModules[0].lessons[0].title, moduleTitle: formattedModules[0].title } : null),
        modules: formattedModules,
      };

      return sendSuccess(res, responsePayload);
    } catch (error) {
      console.error('[CourseController.getCourseById] Error:', error);
      return sendError(res, 'Failed to fetch course outline', 500, error);
    }
  }

  /**
   * Delete course
   */
  static async deleteCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { courseId } = req.params;

      const course = await prisma.course.findFirst({
        where: { id: courseId, userId },
      });

      if (!course) {
        return sendError(res, 'Course not found or access denied', 404);
      }

      await prisma.course.delete({
        where: { id: courseId },
      });

      return sendSuccess(res, null, 'Course deleted successfully');
    } catch (error) {
      return sendError(res, 'Failed to delete course', 500, error);
    }
  }
}
