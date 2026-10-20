import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AiService } from '../services/ai.service.js';
import { QuizQuestion } from '../schemas/quiz.schema.js';

export class QuizController {
  /**
   * Get or generate a quiz for a specific lesson
   * Important Security Rule: Correct answers are stripped before sending to the client!
   */
  static async getOrCreateQuiz(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { lessonId } = req.params;

      // Verify lesson and user ownership
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: { include: { course: true } },
          quizzes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              attempts: {
                where: { userId },
                orderBy: { completedAt: 'desc' },
              },
            },
          },
        },
      });

      if (!lesson || lesson.module.course.userId !== userId) {
        return sendError(res, 'Lesson not found or access denied', 404);
      }

      let quiz = lesson.quizzes[0];

      // If quiz does not exist for this lesson, generate it from the saved lesson content
      if (!quiz) {
        // Ensure lesson content is available
        let lessonText = '';
        if (lesson.content) {
          try {
            const parsed = JSON.parse(lesson.content);
            lessonText = `${parsed.introduction || ''}\n` +
              (parsed.sections || []).map((s: any) => `${s.heading}\n${s.content}`).join('\n') +
              `\n${parsed.summary || ''}`;
          } catch {
            lessonText = lesson.content;
          }
        } else {
          lessonText = `Topic: ${lesson.module.course.topic}. Lesson: ${lesson.title}. Objectives: ${lesson.learningObjectives}`;
        }

        const generatedQuiz = await AiService.generateQuiz({
          lessonTitle: lesson.title,
          lessonContentText: lessonText,
          skillLevel: lesson.module.course.skillLevel,
        });

        quiz = await prisma.quiz.create({
          data: {
            lessonId: lesson.id,
            title: generatedQuiz.title,
            questions: JSON.stringify(generatedQuiz.questions),
          },
          include: {
            attempts: {
              where: { userId },
              orderBy: { completedAt: 'desc' },
            },
          },
        });
      }

      const allQuestions: QuizQuestion[] = JSON.parse(quiz.questions || '[]');

      // Security: Strip correctAnswerIndex and explanation for the unsubmitted view
      const safeQuestions = allQuestions.map((q, index) => ({
        index,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
      }));

      // Format previous attempts
      const previousAttempts = quiz.attempts.map((att) => ({
        id: att.id,
        score: att.score,
        totalQuestions: att.totalQuestions,
        percentage: Math.round((att.score / att.totalQuestions) * 100),
        passed: att.passed,
        completedAt: att.completedAt,
      }));

      return sendSuccess(res, {
        quiz: {
          id: quiz.id,
          lessonId: quiz.lessonId,
          lessonTitle: lesson.title,
          courseId: lesson.module.courseId,
          title: quiz.title,
          totalQuestions: allQuestions.length,
          questions: safeQuestions,
        },
        previousAttempts,
      });
    } catch (error) {
      console.error('[QuizController.getOrCreateQuiz] Error:', error);
      return sendError(res, 'Failed to prepare quiz', 500, error);
    }
  }

  /**
   * Submit and evaluate quiz answers strictly on the backend
   */
  static async submitQuiz(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { quizId } = req.params;
      const { answers } = req.body; // Array of { questionIndex: number, selectedOptionIndex: number }

      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              module: { include: { course: true } },
            },
          },
        },
      });

      if (!quiz || quiz.lesson.module.course.userId !== userId) {
        return sendError(res, 'Quiz not found or access denied', 404);
      }

      const questions: QuizQuestion[] = JSON.parse(quiz.questions || '[]');
      let correctCount = 0;

      // Map answers and evaluate
      const answerMap = new Map<number, number>();
      for (const a of answers) {
        answerMap.set(a.questionIndex, a.selectedOptionIndex);
      }

      const detailedResults = questions.map((q, idx) => {
        const userChoice = answerMap.get(idx);
        const isCorrect = userChoice !== undefined && userChoice === q.correctAnswerIndex;
        if (isCorrect) {
          correctCount++;
        }

        return {
          questionIndex: idx,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          selectedOptionIndex: userChoice !== undefined ? userChoice : null,
          correctAnswerIndex: q.correctAnswerIndex,
          isCorrect,
          explanation: q.explanation,
        };
      });

      const totalQuestions = questions.length;
      const percentage = Math.round((correctCount / totalQuestions) * 100);
      const passed = percentage >= 60; // 60% passing grade

      // Persist attempt in database
      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          userId,
          score: correctCount,
          totalQuestions,
          userAnswers: JSON.stringify(detailedResults),
          passed,
        },
      });

      // If passed, also ensure the lesson is marked as completed
      if (passed) {
        await prisma.lessonProgress.upsert({
          where: {
            userId_lessonId: { userId, lessonId: quiz.lessonId },
          },
          update: {
            isCompleted: true,
            completedAt: new Date(),
          },
          create: {
            userId,
            lessonId: quiz.lessonId,
            isCompleted: true,
            completedAt: new Date(),
          },
        });
      }

      return sendSuccess(res, {
        attemptId: attempt.id,
        score: correctCount,
        totalQuestions,
        percentage,
        passed,
        completedAt: attempt.completedAt,
        results: detailedResults,
      }, `Quiz submitted! Your score: ${correctCount}/${totalQuestions} (${percentage}%)`);
    } catch (error) {
      console.error('[QuizController.submitQuiz] Error:', error);
      return sendError(res, 'Failed to evaluate quiz submission', 500, error);
    }
  }

  /**
   * Get specific quiz attempt details
   */
  static async getAttemptDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { attemptId } = req.params;

      const attempt = await prisma.quizAttempt.findFirst({
        where: { id: attemptId, userId },
        include: {
          quiz: {
            include: {
              lesson: { select: { id: true, title: true, moduleId: true } },
            },
          },
        },
      });

      if (!attempt) {
        return sendError(res, 'Attempt not found or access denied', 404);
      }

      return sendSuccess(res, {
        id: attempt.id,
        quizId: attempt.quizId,
        lessonTitle: attempt.quiz.lesson.title,
        lessonId: attempt.quiz.lesson.id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
        passed: attempt.passed,
        completedAt: attempt.completedAt,
        results: JSON.parse(attempt.userAnswers || '[]'),
      });
    } catch (error) {
      return sendError(res, 'Failed to load attempt details', 500, error);
    }
  }
}
