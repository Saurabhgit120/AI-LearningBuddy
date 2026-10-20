import { z } from 'zod';

export const SkillLevelEnum = z.enum(['Beginner', 'Intermediate', 'Advanced']);

// Input from user form
export const GenerateCourseInputSchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters').max(100, 'Topic must be under 100 characters').trim(),
  skillLevel: SkillLevelEnum,
  durationDays: z.coerce.number().int().min(1, 'Duration must be at least 1 day').max(90, 'Duration cannot exceed 90 days'),
  dailyStudyMinutes: z.coerce.number().int().min(10, 'Daily study time must be at least 10 minutes').max(360, 'Daily study time cannot exceed 6 hours'),
  learningGoal: z.string().max(300, 'Learning goal must be under 300 characters').trim().optional().or(z.literal('')),
});

export type GenerateCourseInput = z.infer<typeof GenerateCourseInputSchema>;

// Lesson schema inside course outline
export const LessonOutlineSchema = z.object({
  title: z.string().min(3, 'Lesson title is required'),
  learningObjectives: z.array(z.string().min(3)).min(1, 'At least one learning objective required'),
  estimatedMinutes: z.number().int().min(5).max(120),
});

// Module schema inside course outline
export const ModuleOutlineSchema = z.object({
  title: z.string().min(3, 'Module title is required'),
  description: z.string().min(10, 'Module description is required'),
  lessons: z.array(LessonOutlineSchema).min(1, 'Each module must have at least one lesson'),
});

// Final Project Schema
export const FinalProjectSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  requirements: z.array(z.string()).min(1),
}).optional();

// Strict Zod schema for AI course outline generation output
export const CourseOutlineAiResponseSchema = z.object({
  title: z.string().min(5, 'Course title is required'),
  description: z.string().min(20, 'Detailed course description is required'),
  targetSkillLevel: SkillLevelEnum,
  learningObjectives: z.array(z.string().min(5)).min(2, 'At least 2 learning objectives required'),
  estimatedDurationDays: z.number().int().min(1),
  prerequisites: z.array(z.string()).optional().default([]),
  modules: z.array(ModuleOutlineSchema).min(2, 'Course must have at least 2 modules'),
  finalProject: FinalProjectSchema,
});

export type CourseOutlineAiResponse = z.infer<typeof CourseOutlineAiResponseSchema>;
