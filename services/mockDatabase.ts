import { Task, User, UserRole, ClassResource, ChatMessage, TaskAttempt, QuizQuestion } from '../types';

// Mock Data
// Tasks are now just topics/templates. Difficulty is handled by the AI/Student mastery.
const TASKS: Task[] = [
  { id: '1', title: 'Algebra Foundations', topic: 'Math', type: 'quiz' },
  { id: '2', title: 'React Components', topic: 'Coding', type: 'project' },
  { id: '3', title: 'Calculus Derivatives', topic: 'Math', type: 'quiz' },
  { id: '4', title: 'Shakespearean Analysis', topic: 'Literature', type: 'project' },
  { id: '5', title: 'Newtonian Physics', topic: 'Science', type: 'quiz' },
  { id: '6', title: 'Neural Networks', topic: 'Coding', type: 'project' },
];

let MOCK_RESOURCES: ClassResource[] = [
  { id: '101', title: 'Week 1: Algebra Notes', type: 'note', content: 'Review linear equations...', date: '2023-10-01' },
];

let MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', senderId: 'teacher1', senderName: 'Prof. Dumbledore', role: UserRole.TEACHER, text: 'Welcome to the class everyone!', timestamp: Date.now() - 100000 }
];

// Helper to generate some fake history for demo purposes
const generateFakeHistory = (): TaskAttempt[] => {
    return [
        {
            id: 'h1',
            taskId: '1',
            taskTitle: 'Algebra Foundations',
            difficulty: 45,
            score: 80,
            timestamp: Date.now() - 86400000 * 2,
            questions: [
                { question: "Solve for x: 2x = 4", options: ["1", "2", "3", "4"], correctAnswerIndex: 1 },
                { question: "What is 5 + 5?", options: ["8", "9", "10", "11"], correctAnswerIndex: 2 }
            ]
        },
        {
            id: 'h2',
            taskId: '5',
            taskTitle: 'Newtonian Physics',
            difficulty: 50,
            score: 60,
            timestamp: Date.now() - 86400000,
            questions: [
                { question: "F = ma stands for?", options: ["Force", "Mass", "Acceleration", "Newton's 2nd Law"], correctAnswerIndex: 3 }
            ]
        }
    ];
};

const MOCK_USERS: User[] = [
  {
    id: 'student1',
    name: 'Alex Johnson',
    email: 'student@amep.edu',
    role: UserRole.STUDENT,
    masteryScore: 65,
    classCode: 'MATH101',
    enrolledClassCodes: ['MATH101', 'SCI202'],
    softSkills: { collaboration: 75, communication: 80 },
    recentScores: [60, 65, 70, 60, 70],
    taskHistory: generateFakeHistory()
  },
  {
    id: 'student2',
    name: 'Sarah Connor',
    email: 'sarah@amep.edu',
    role: UserRole.STUDENT,
    masteryScore: 45,
    classCode: 'MATH101',
    enrolledClassCodes: ['MATH101'],
    softSkills: { collaboration: 40, communication: 90 },
    recentScores: [40, 45, 50, 40, 45],
    taskHistory: []
  },
  {
    id: 'teacher1',
    name: 'Prof. Dumbledore',
    email: 'teacher@amep.edu',
    role: UserRole.TEACHER,
    masteryScore: 0,
    classCode: 'MATH101', // Teacher owns this code
    enrolledClassCodes: ['MATH101'],
    softSkills: { collaboration: 100, communication: 100 },
    recentScores: [],
    taskHistory: []
  }
];

// --- AUTH ---

export const loginWithCredentials = async (email: string, password: string): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simple mock auth
      if (password !== 'password') {
        resolve(null);
        return;
      }
      const user = MOCK_USERS.find(u => u.email === email);
      resolve(user || null);
    }, 800);
  });
};

export const joinClass = async (userId: string, code: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simple validation: Any code starting with valid prefix works for demo
      if (code.length > 3) {
        const u = MOCK_USERS.find(u => u.id === userId);
        if (u) {
            if (!u.enrolledClassCodes.includes(code)) {
                u.enrolledClassCodes.push(code);
            }
            u.classCode = code; // Auto-switch to newly joined class
        }
        resolve(true);
      } else {
        resolve(false);
      }
    }, 500);
  });
};

// --- DATA FETCHING ---

export const fetchRecommendedTasks = async (studentDifficulty: number): Promise<Task[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real adaptive system, we might filter tasks that *match* the student's current topic mastery.
      // Since difficulty is now generated dynamically, we just return a subset of available topics
      // that haven't been completed recently, or just random ones for the demo.
      
      const shuffled = [...TASKS].sort(() => 0.5 - Math.random());
      resolve(shuffled.slice(0, 4));
    }, 600);
  });
};

export const getAllTasks = async (): Promise<Task[]> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve([...TASKS]), 300);
    });
};

export const addTask = async (task: Task): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            TASKS.push(task);
            resolve();
        }, 300);
    });
};

export const submitTaskScore = async (
    userId: string,
    taskId: string,
    taskTitle: string,
    score: number, 
    difficulty: number,
    questions: QuizQuestion[]
): Promise<User | null> => {
   return new Promise((resolve) => {
      setTimeout(() => {
         const user = MOCK_USERS.find(u => u.id === userId);
         if (!user) {
             resolve(null);
             return;
         }

         // Update scores
         user.recentScores = [...user.recentScores, score].slice(-5);
         const avg = user.recentScores.reduce((a, b) => a + b, 0) / user.recentScores.length;
         user.masteryScore = Math.round(avg);

         // Add to History
         const attempt: TaskAttempt = {
             id: Date.now().toString(),
             taskId,
             taskTitle,
             difficulty,
             score,
             timestamp: Date.now(),
             questions
         };
         user.taskHistory = [attempt, ...user.taskHistory];

         resolve({ ...user });
      }, 400);
   });
};

export const getClassStudents = async (classCode: string): Promise<User[]> => {
  // Return fresh copy of users to ensure history is up to date
  // Checks if the student is enrolled in this specific class code
  return MOCK_USERS.filter(u => u.role === UserRole.STUDENT && u.enrolledClassCodes.includes(classCode));
};

// --- RESOURCES ---

export const getResources = async (): Promise<ClassResource[]> => {
  return [...MOCK_RESOURCES];
};

export const addResource = async (resource: ClassResource) => {
  MOCK_RESOURCES.unshift(resource);
  // Trigger storage event for realtime feel
  window.dispatchEvent(new Event('resource_update')); 
};

// --- CHAT ---

export const getMessages = async (): Promise<ChatMessage[]> => {
  // Check local storage for persistent chat simulation across tabs
  const stored = localStorage.getItem('amep_chat');
  if (stored) {
    return JSON.parse(stored);
  }
  return MOCK_MESSAGES;
};

export const sendMessage = async (msg: ChatMessage) => {
  const current = await getMessages();
  const updated = [...current, msg];
  MOCK_MESSAGES = updated;
  localStorage.setItem('amep_chat', JSON.stringify(updated));
  window.dispatchEvent(new Event('chat_update'));
};