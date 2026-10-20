import { Router } from 'express';
import { CourseController } from '../controllers/course.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { aiGenerationLimiter } from '../middleware/rateLimiter.js';
import { GenerateCourseInputSchema } from '../schemas/course.schema.js';

const router = Router();

// All course endpoints require authentication
router.use(authenticate);

router.post('/generate', aiGenerationLimiter, validateBody(GenerateCourseInputSchema), CourseController.generateCourse);
router.get('/', CourseController.getMyCourses);
router.get('/:courseId', CourseController.getCourseById);
router.delete('/:courseId', CourseController.deleteCourse);

export default router;
