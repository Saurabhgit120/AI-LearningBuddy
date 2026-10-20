import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse.js';

export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return sendError(res, 'Validation failed: ' + issues.map(i => i.message).join(', '), 422, issues);
      }
      return sendError(res, 'Invalid request data.', 400);
    }
  };
};

export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Query parameter error: ' + error.errors[0]?.message, 422);
      }
      return sendError(res, 'Invalid query parameters.', 400);
    }
  };
};
