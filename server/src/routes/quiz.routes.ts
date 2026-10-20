import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { aiGenerationLimiter } from '../middleware/rateLimiter.js';
import { SubmitQuizInputSchema } from '../schemas/quiz.schema.js';

const router = Router();

router.use(authenticate);

// Get or generate quiz for a lesson
router.get('/lesson/:lessonId', aiGenerationLimiter, QuizController.getOrCreateQuiz);

// Submit quiz answers for server-side evaluation
router.post('/:quizId/submit', validateBody(SubmitQuizInputSchema), QuizController.submitQuiz);

// Get attempt details
router.get('/attempt/:attemptId', QuizController.getAttemptDetails);

export default router;
