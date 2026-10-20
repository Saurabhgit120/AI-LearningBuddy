import {
  User,
  CourseDetail,
  CourseCardItem,
  FullLessonResponse,
  QuizData,
  QuizSubmissionResponse,
  ChatMessageItem,
  DashboardMetrics,
  SkillLevel,
} from '../types/index.js';

const rawApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`)
  : '/api';

interface RequestOptions extends RequestInit {
  data?: any;
}

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function fetchJson<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Support HTTP-only cookies
  };

  if (options.data) {
    config.body = JSON.stringify(options.data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || 'An error occurred during request', response.status, data.error);
  }

  return data.data !== undefined ? data.data : data;
}

// Authentication API
export const authApi = {
  register: (payload: { name: string; email: string; password: string }) =>
    fetchJson<{ user: User; token: string }>('/auth/register', { method: 'POST', data: payload }),

  login: (payload: { email: string; password: string }) =>
    fetchJson<{ user: User; token: string }>('/auth/login', { method: 'POST', data: payload }),

  logout: () =>
    fetchJson<void>('/auth/logout', { method: 'POST' }),

  getMe: () =>
    fetchJson<User>('/auth/me'),
};

// Course API
export const courseApi = {
  generateCourse: (payload: {
    topic: string;
    skillLevel: SkillLevel;
    durationDays: number;
    dailyStudyMinutes: number;
    learningGoal?: string;
  }) => fetchJson<CourseDetail>('/courses/generate', { method: 'POST', data: payload }),

  getMyCourses: () =>
    fetchJson<CourseCardItem[]>('/courses'),

  getCourseById: (courseId: string) =>
    fetchJson<CourseDetail>(`/courses/${courseId}`),

  deleteCourse: (courseId: string) =>
    fetchJson<void>(`/courses/${courseId}`, { method: 'DELETE' }),
};

// Lesson API
export const lessonApi = {
  getLessonById: (lessonId: string) =>
    fetchJson<FullLessonResponse>(`/lessons/${lessonId}`),

  toggleComplete: (lessonId: string, isCompleted: boolean) =>
    fetchJson<{
      lessonId: string;
      isCompleted: boolean;
      completedAt: string | null;
      courseProgress: {
        totalLessons: number;
        completedLessons: number;
        percentage: number;
      };
    }>(`/lessons/${lessonId}/complete`, { method: 'POST', data: { isCompleted } }),
};

// Quiz API
export const quizApi = {
  getQuizForLesson: (lessonId: string) =>
    fetchJson<{
      quiz: QuizData;
      previousAttempts: Array<{
        id: string;
        score: number;
        totalQuestions: number;
        percentage: number;
        passed: boolean;
        completedAt: string;
      }>;
    }>(`/quizzes/lesson/${lessonId}`),

  submitQuiz: (
    quizId: string,
    answers: Array<{ questionIndex: number; selectedOptionIndex: number }>
  ) =>
    fetchJson<QuizSubmissionResponse>(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      data: { answers },
    }),

  getAttemptDetails: (attemptId: string) =>
    fetchJson<QuizSubmissionResponse>(`/quizzes/attempt/${attemptId}`),
};

// Chat API
export const chatApi = {
  getLessonChatHistory: (lessonId: string) =>
    fetchJson<ChatMessageItem[]>(`/chat/lesson/${lessonId}`),

  askQuestion: (lessonId: string, question: string) =>
    fetchJson<{
      userMessage: ChatMessageItem;
      assistantMessage: ChatMessageItem;
    }>(`/chat/lesson/${lessonId}`, { method: 'POST', data: { question } }),

  clearChatHistory: (lessonId: string) =>
    fetchJson<void>(`/chat/lesson/${lessonId}`, { method: 'DELETE' }),
};

// Progress API
export const progressApi = {
  getDashboardMetrics: () =>
    fetchJson<DashboardMetrics>('/progress/dashboard'),
};
