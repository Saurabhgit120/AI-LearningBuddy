import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { RegisterInputSchema, LoginInputSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/register', authLimiter, validateBody(RegisterInputSchema), AuthController.register);
router.post('/login', authLimiter, validateBody(LoginInputSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
