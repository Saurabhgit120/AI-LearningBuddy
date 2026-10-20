import { Router } from 'express';
import { ProgressController } from '../controllers/progress.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Get user learning dashboard stats and activity feed
router.get('/dashboard', ProgressController.getDashboardMetrics);

export default router;
