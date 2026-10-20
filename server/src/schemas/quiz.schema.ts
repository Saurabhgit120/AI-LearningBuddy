import { z } from 'zod';

export const QuizQuestionTypeEnum = z.enum([
  'multiple_choice',
  'conceptual_understanding',
  'practical_application',
]);

export const QuizQuestionSchema = z.object({
  id: z.string().optional(),
  questionText: z.string().min(10, 'Question text must be substantive'),
  questionType: QuizQuestionTypeEnum.default('multiple_choice'),
  options: z.array(z.string().min(1)).length(4, 'Must have exactly 4 answer options'),
  correctAnswerIndex: z.number().int().min(0).max(3, 'Correct answer index must be between 0 and 3'),
  explanation: z.string().min(10, 'Explanation is required to explain why the answer is correct'),
});

export const QuizAiResponseSchema = z.object({
  title: z.string().min(5),
  questions: z.array(QuizQuestionSchema).length(5, 'Quiz must have exactly 5 questions'),
});

export type QuizAiResponse = z.infer<typeof QuizAiResponseSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// User submission schema
export const SubmitQuizInputSchema = z.object({
  answers: z.array(
    z.object({
      questionIndex: z.number().int().min(0).max(4),
      selectedOptionIndex: z.number().int().min(0).max(3),
    })
  ).min(1, 'At least one answer must be provided'),
});

export type SubmitQuizInput = z.infer<typeof SubmitQuizInputSchema>;
