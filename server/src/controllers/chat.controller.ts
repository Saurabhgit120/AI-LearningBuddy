import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AiService } from '../services/ai.service.js';

export class ChatController {
  /**
   * Get chat history for a lesson
   */
  static async getLessonChatHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { lessonId } = req.params;

      const messages = await prisma.chatMessage.findMany({
        where: { userId, lessonId },
        orderBy: { createdAt: 'asc' },
        take: 50,
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      });

      return sendSuccess(res, messages);
    } catch (error) {
      return sendError(res, 'Failed to fetch chat history', 500, error);
    }
  }

  /**
   * Ask question to AI tutor about the current lesson
   */
  static async askQuestion(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { lessonId } = req.params;
      const { question } = req.body;

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return sendError(res, 'Question text is required', 400);
      }

      // Fetch lesson context
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: { include: { course: true } },
        },
      });

      if (!lesson || lesson.module.course.userId !== userId) {
        return sendError(res, 'Lesson not found or access denied', 404);
      }

      // 1. Save user question message
      const userMessage = await prisma.chatMessage.create({
        data: {
          userId,
          lessonId,
          role: 'user',
          content: question.trim(),
        },
      });

      // 2. Fetch recent conversation history
      const history = await prisma.chatMessage.findMany({
        where: { userId, lessonId },
        orderBy: { createdAt: 'desc' },
        take: 8,
      });

      const formattedHistory = history.reverse().map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // 3. Generate AI Tutor response with lesson context
      const answer = await AiService.askLessonChatbot({
        question: question.trim(),
        courseTopic: lesson.module.course.topic,
        lessonTitle: lesson.title,
        lessonContent: lesson.content || '',
        skillLevel: lesson.module.course.skillLevel,
        conversationHistory: formattedHistory,
      });

      // 4. Save assistant answer
      const assistantMessage = await prisma.chatMessage.create({
        data: {
          userId,
          lessonId,
          role: 'assistant',
          content: answer,
        },
      });

      return sendSuccess(res, {
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error('[ChatController.askQuestion] Error:', error);
      return sendError(res, 'Failed to generate answer from AI Tutor', 500, error);
    }
  }

  /**
   * Clear chat history for a lesson
   */
  static async clearChatHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { lessonId } = req.params;

      await prisma.chatMessage.deleteMany({
        where: { userId, lessonId },
      });

      return sendSuccess(res, null, 'Chat history reset successfully');
    } catch (error) {
      return sendError(res, 'Failed to clear chat history', 500, error);
    }
  }
}
