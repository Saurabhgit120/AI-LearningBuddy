import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { config } from '../config/index.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return sendError(res, 'An account with this email address already exists.', 409);
      }

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.cookie('token', token, COOKIE_OPTIONS);

      return sendSuccess(res, { user, token }, 'Registration successful', 201);
    } catch (error) {
      console.error('[AuthController.register] Error:', error);
      return sendError(res, 'Failed to create user account.', 500, error);
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return sendError(res, 'Invalid email or password.', 401);
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return sendError(res, 'Invalid email or password.', 401);
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.cookie('token', token, COOKIE_OPTIONS);

      return sendSuccess(
        res,
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
          },
          token,
        },
        'Login successful'
      );
    } catch (error) {
      console.error('[AuthController.login] Error:', error);
      return sendError(res, 'Failed to sign in.', 500, error);
    }
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie('token', COOKIE_OPTIONS);
    return sendSuccess(res, null, 'Logged out successfully');
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              courses: true,
              quizAttempts: true,
            },
          },
        },
      });

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, user);
    } catch (error) {
      return sendError(res, 'Failed to fetch user profile', 500, error);
    }
  }
}
