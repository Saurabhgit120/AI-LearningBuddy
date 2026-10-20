import { z } from 'zod';

export const CodeSnippetSchema = z.object({
  language: z.string(),
  code: z.string(),
  explanation: z.string(),
});

export const LessonSectionSchema = z.object({
  heading: z.string().min(2),
  content: z.string().min(20),
  codeSnippet: CodeSnippetSchema.optional(),
});

// Strict Zod schema for AI Lesson Content response
export const LessonContentAiResponseSchema = z.object({
  introduction: z.string().min(30, 'Introduction must be substantive'),
  sections: z.array(LessonSectionSchema).min(2, 'Must have at least 2 structured content sections'),
  practicalApplications: z.array(z.string().min(10)).min(1, 'Must have at least one practical application'),
  summary: z.string().min(30, 'Summary must be substantive'),
  keyTakeaways: z.array(z.string().min(5)).min(3).max(6, 'Must provide 3 to 5 key takeaways'),
});

export type LessonContentAiResponse = z.infer<typeof LessonContentAiResponseSchema>;
