export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher'
}

export interface ClassResource {
  id: string;
  title: string;
  type: 'note' | 'homework' | 'pdf';
  content: string;
  date: string;
  fileUrl?: string;
  fileName?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  role: UserRole;
}

export interface TaskAttempt {
  id: string;
  taskId: string;
  taskTitle: string;
  difficulty: number; // The adaptive difficulty level this was generated at
  score: number;
  timestamp: number;
  questions: QuizQuestion[]; // Store the generated questions for teacher review
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  masteryScore: number;
  classCode?: string; // Currently active/selected class context
  enrolledClassCodes: string[]; // List of all classes the student is in
  softSkills: {
    collaboration: number;
    communication: number;
  };
  recentScores: number[]; // For ML input
  taskHistory: TaskAttempt[]; // Detailed history of attempted tasks
}

export interface Task {
  id: string;
  title: string;
  topic: string;
  type: 'quiz' | 'project';
  // Difficulty is no longer static, it is determined adaptively
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  active: boolean;
  responses: Record<string, number>; // optionIndex -> count
  hasVoted?: boolean; // Local state helper
}

export interface PollResponse {
  studentId: string;
  optionIndex: number;
}