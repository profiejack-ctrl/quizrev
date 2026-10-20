export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  studentId?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  password?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  icon?: string;
  quizCount?: number;
}

export interface QuestionChoice {
  id: string;
  label: string; // 'A', 'B', 'C', 'D'
  text: string;
  isCorrect: boolean;
  originalIndex?: number;
}

export interface Question {
  id: string;
  quizId?: string;
  orderIndex: number;
  questionText: string;
  choices: QuestionChoice[];
  points: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  description: string;
  durationMinutes: number;
  passingPercentage: number;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  questions: Question[];
  totalQuestions: number;
  sourceFilename?: string;
  sourceFormat?: 'docx' | 'pdf' | 'manual' | 'sample';
  createdBy?: string;
  createdByName?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedChoiceId: string | null;
  isCorrect: boolean;
  timeSpentSeconds?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  subjectId: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  startedAt: string;
  completedAt: string;
  timeSpentSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, string>; // questionId -> selectedChoiceId
  detailedAnswers?: StudentAnswer[];
}

export interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  status: 'Mastered' | 'Proficient' | 'Needs Review';
}

export interface StudentAnalyticsData {
  totalAttempts: number;
  averageScore: number;
  overallPassRate: number;
  totalTimeSpentMinutes: number;
  improvementRating: number; // e.g. +14.5% compared to baseline/prior average
  recentTrend: 'improving' | 'steady' | 'declining';
  subjectBreakdown: SubjectAnalytics[];
  scoreHistory: {
    attemptId: string;
    quizTitle: string;
    date: string;
    score: number;
    percentage: number;
    subjectName: string;
  }[];
}

export interface ParsedQuestionResult {
  questionText: string;
  choices: {
    label: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  detectedAnswer?: string;
}

export interface ParseExamResult {
  title: string;
  subjectHint?: string;
  questions: ParsedQuestionResult[];
  errors: string[];
  rawText: string;
}
