import { Router } from 'express';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import lessonRoutes from './lesson.routes.js';
import quizRoutes from './quiz.routes.js';
import chatRoutes from './chat.routes.js';
import progressRoutes from './progress.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/lessons', lessonRoutes);
router.use('/quizzes', quizRoutes);
router.use('/chat', chatRoutes);
router.use('/progress', progressRoutes);

export default router;
