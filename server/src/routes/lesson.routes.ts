import { Router } from 'express';
import { LessonController } from '../controllers/lesson.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { aiGenerationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

// Get lesson content (with on-demand AI generation and YouTube suggestions)
router.get('/:lessonId', aiGenerationLimiter, LessonController.getLessonById);

// Mark lesson as completed / toggle status
router.post('/:lessonId/complete', LessonController.toggleComplete);

export default router;
