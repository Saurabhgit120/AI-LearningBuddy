export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  _count?: {
    courses: number;
    quizAttempts: number;
  };
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface FinalProject {
  title: string;
  description: string;
  requirements: string[];
}

export interface LessonSummary {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  learningObjectives: string[];
  estimatedMinutes: number;
  isCompleted: boolean;
  isGenerated?: boolean;
  completedAt?: string | null;
  quizId?: string | null;
  quizScore?: {
    score: number;
    total: number;
    passed: boolean;
  } | null;
}

export interface ModuleSummary {
  id: string;
  order: number;
  title: string;
  description: string;
  lessons: LessonSummary[];
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  topic: string;
  skillLevel: SkillLevel;
  durationDays: number;
  dailyStudyMinutes: number;
  learningGoal?: string | null;
  learningObjectives: string[];
  prerequisites: string[];
  finalProject?: FinalProject | null;
  status: 'generating' | 'completed' | 'failed';
  generationError?: string | null;
  createdAt: string;
  updatedAt: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  nextLesson?: {
    id: string;
    title: string;
    moduleTitle: string;
  } | null;
  modules: ModuleSummary[];
}

export interface CourseCardItem {
  id: string;
  title: string;
  description: string;
  topic: string;
  skillLevel: SkillLevel;
  durationDays: number;
  dailyStudyMinutes: number;
  status: 'generating' | 'completed' | 'failed';
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  isCompleted: boolean;
  nextLessonId?: string | null;
  lastAccessedAt: string;
  createdAt: string;
  modulesCount: number;
}

export interface CodeSnippet {
  language: string;
  code: string;
  explanation: string;
}

export interface LessonSection {
  heading: string;
  content: string;
  codeSnippet?: CodeSnippet;
}

export interface LessonContent {
  introduction: string;
  sections: LessonSection[];
  practicalApplications: string[];
  summary: string;
  keyTakeaways: string[];
}

export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  url: string;
}

export interface FullLessonResponse {
  lesson: {
    id: string;
    title: string;
    order: number;
    estimatedMinutes: number;
    learningObjectives: string[];
    content: LessonContent;
    isCompleted: boolean;
    completedAt?: string | null;
    quizId?: string | null;
  };
  module: {
    id: string;
    title: string;
    description: string;
    order: number;
  };
  course: {
    id: string;
    title: string;
    topic: string;
    skillLevel: SkillLevel;
  };
  navigation: {
    prevLesson: { id: string; title: string; moduleId: string } | null;
    nextLesson: { id: string; title: string; moduleId: string } | null;
    currentPosition: number;
    totalLessons: number;
  };
  youtubeSuggestions: {
    videos: YouTubeVideoItem[];
    source: 'api' | 'cache' | 'curated';
  };
}

export interface SafeQuizQuestion {
  index: number;
  questionText: string;
  questionType: string;
  options: string[];
}

export interface QuizData {
  id: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  title: string;
  totalQuestions: number;
  questions: SafeQuizQuestion[];
}

export interface QuizQuestionResult {
  questionIndex: number;
  questionText: string;
  questionType: string;
  options: string[];
  selectedOptionIndex: number | null;
  correctAnswerIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizSubmissionResponse {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  results: QuizQuestionResult[];
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface DashboardMetrics {
  stats: {
    totalCourses: number;
    inProgressCoursesCount: number;
    completedCoursesCount: number;
    totalLessons: number;
    completedLessons: number;
    overallCompletionPercentage: number;
    quizzesTaken: number;
  };
  resumeLastLesson: {
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    lastAccessedAt: string;
  } | null;
  recentActivity: Array<{
    type: 'course_created' | 'lesson_completed' | 'quiz_taken';
    title: string;
    subtitle: string;
    timestamp: string;
    targetId: string;
  }>;
}
