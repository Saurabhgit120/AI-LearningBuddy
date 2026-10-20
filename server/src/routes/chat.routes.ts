import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { aiGenerationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

// Get chat history for a lesson
router.get('/lesson/:lessonId', ChatController.getLessonChatHistory);

// Ask question to lesson AI tutor
router.post('/lesson/:lessonId', aiGenerationLimiter, ChatController.askQuestion);

// Clear chat history for a lesson
router.delete('/lesson/:lessonId', ChatController.clearChatHistory);

export default router;
