import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  Subject,
  Quiz,
  QuizAttempt,
  Question,
  UserRole,
} from '../types/quiz';
import {
  INITIAL_PROFILES,
  INITIAL_SUBJECTS,
  INITIAL_QUIZZES,
  INITIAL_ATTEMPTS,
} from '../lib/mockData';
import { prepareExamSession } from '../lib/shuffle';
import { getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';
import {
  fetchAllFromSupabase,
  saveQuizToSupabase,
  deleteQuizFromSupabase,
  updateQuizKeysInSupabase,
  saveSubjectToSupabase,
  saveProfileToSupabase,
  saveAttemptToSupabase,
  pushAllLocalDataToSupabase,
} from '../lib/supabaseSync';
import { generateUuid, ensureUuid } from '../lib/uuid';

const CLEAN_FLAG = 'quizrev_clean_v2_nodemo';

interface AppContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  login: (emailOrId: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  createStudentAccount: (data: { fullName: string; email: string; studentId: string; password?: string }) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  registerStudent: (data: { fullName: string; email: string; studentId?: string; password?: string }) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  
  subjects: Subject[];
  addSubject: (name: string, code: string, description: string, color?: string) => Subject;
  
  quizzes: Quiz[];
  addQuiz: (quiz: Omit<Quiz, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string; quiz: Quiz }>;
  deleteQuiz: (quizId: string) => void;
  updateQuizAnswerKeys: (quizId: string, keyMap: Map<number, { answer: string; explanation?: string }>) => { success: boolean; updatedCount: number };
  
  attempts: QuizAttempt[];
  recordAttempt: (attempt: Omit<QuizAttempt, 'id'>) => QuizAttempt;
  
  // Navigation & View
  currentView: string;
  setCurrentView: (view: string) => void;
  selectedSubjectId: string | null;
  setSelectedSubjectId: (id: string | null) => void;
  
  // Active Exam Session
  activeQuiz: Quiz | null;
  sessionQuestions: Question[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (idx: number) => void;
  selectedAnswers: Record<string, string>; // questionId -> selectedChoiceId
  flaggedQuestionIds: string[];
  remainingSeconds: number;
  isExamInProgress: boolean;
  startExam: (quiz: Quiz) => void;
  selectAnswer: (questionId: string, choiceId: string) => void;
  toggleFlag: (questionId: string) => void;
  submitExam: () => QuizAttempt | null;
  cancelExam: () => void;
  
  // Last Result
  latestAttempt: QuizAttempt | null;
  viewAttemptDetails: (attempt: QuizAttempt) => void;
  
  // Supabase Settings & Live Sync
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;
  supabaseConfig: { url: string; anonKey: string; isConfigured: boolean };
  updateSupabaseCredentials: (url: string, anonKey: string) => Promise<void>;
  isSyncingWithSupabase: boolean;
  pushLocalToSupabase: () => Promise<{ success: boolean; message: string }>;
  refreshFromSupabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure demo data is removed if starting fresh
  useEffect(() => {
    if (localStorage.getItem(CLEAN_FLAG) !== 'true') {
      localStorage.removeItem('quizrev_quizzes');
      localStorage.removeItem('quizrev_attempts');
      localStorage.removeItem('quizrev_users');
      localStorage.setItem('quizrev_users', JSON.stringify(INITIAL_PROFILES));
      localStorage.setItem('quizrev_quizzes', JSON.stringify([]));
      localStorage.setItem('quizrev_attempts', JSON.stringify([]));
      localStorage.setItem(CLEAN_FLAG, 'true');
    }
  }, []);

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    if (localStorage.getItem(CLEAN_FLAG) !== 'true') {
      return INITIAL_PROFILES;
    }
    const saved = localStorage.getItem('quizrev_users');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedId = localStorage.getItem('quizrev_current_user_id');
    if (!savedId) return null;
    const user = allUsers.find(u => u.id === savedId);
    return user || null;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('quizrev_subjects');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    if (localStorage.getItem(CLEAN_FLAG) !== 'true') {
      return [];
    }
    const saved = localStorage.getItem('quizrev_quizzes');
    return saved ? JSON.parse(saved) : INITIAL_QUIZZES;
  });

  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => {
    if (localStorage.getItem(CLEAN_FLAG) !== 'true') {
      return [];
    }
    const saved = localStorage.getItem('quizrev_attempts');
    return saved ? JSON.parse(saved) : INITIAL_ATTEMPTS;
  });

  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Active Exam state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isExamInProgress, setIsExamInProgress] = useState<boolean>(false);
  const [examStartTime, setExamStartTime] = useState<string>('');
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);

  // Supabase connection state
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig);
  const [isSyncingWithSupabase, setIsSyncingWithSupabase] = useState<boolean>(false);

  // Function to pull all live data from Supabase
  const refreshFromSupabase = async () => {
    const config = getSupabaseConfig();
    if (!config.isConfigured) return;

    setIsSyncingWithSupabase(true);
    try {
      const data = await fetchAllFromSupabase();
      if (data) {
        if (data.subjects && data.subjects.length > 0) {
          setSubjects(data.subjects);
          localStorage.setItem('quizrev_subjects', JSON.stringify(data.subjects));
        }
        if (data.quizzes && data.quizzes.length >= 0) {
          setQuizzes(data.quizzes);
          localStorage.setItem('quizrev_quizzes', JSON.stringify(data.quizzes));
        }
        if (data.attempts && data.attempts.length >= 0) {
          // Merge local and remote attempts by ID so recently submitted attempts aren't lost
          setAttempts(prev => {
            const attemptMap = new Map<string, QuizAttempt>();
            prev.forEach(a => attemptMap.set(a.id, a));
            data.attempts.forEach(a => attemptMap.set(a.id, a));
            const merged = Array.from(attemptMap.values())
              .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
            localStorage.setItem('quizrev_attempts', JSON.stringify(merged));
            return merged;
          });
        }
        if (data.profiles && data.profiles.length > 0) {
          // Merge profiles by ID
          setAllUsers(prev => {
            const userMap = new Map<string, UserProfile>();
            prev.forEach(u => userMap.set(u.id, u));
            data.profiles.forEach(p => userMap.set(p.id, p));
            // Keep default teacher available if not in database
            const teacher = INITIAL_PROFILES[0];
            const hasTeacher = Array.from(userMap.values()).some(p => p.role === 'teacher');
            if (!hasTeacher) {
              userMap.set(teacher.id, teacher);
            }
            const merged = Array.from(userMap.values());
            localStorage.setItem('quizrev_users', JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('[QuizRev] Failed to refresh data from Supabase:', err);
    } finally {
      setIsSyncingWithSupabase(false);
    }
  };

  // Pull initial Supabase data when configured
  useEffect(() => {
    if (supabaseConfig.isConfigured) {
      refreshFromSupabase();
    }
  }, [supabaseConfig.isConfigured]);

  // Listen to window focus & tab visibility to ensure cross-device updates sync automatically
  useEffect(() => {
    const handleSyncOnActive = () => {
      if (document.visibilityState === 'visible' && !isExamInProgress) {
        refreshFromSupabase();
      }
    };

    window.addEventListener('focus', handleSyncOnActive);
    document.addEventListener('visibilitychange', handleSyncOnActive);

    // Periodic sync every 25 seconds when student is viewing exams
    const interval = setInterval(() => {
      if (!isExamInProgress && document.visibilityState === 'visible') {
        refreshFromSupabase();
      }
    }, 25000);

    return () => {
      window.removeEventListener('focus', handleSyncOnActive);
      document.removeEventListener('visibilitychange', handleSyncOnActive);
      clearInterval(interval);
    };
  }, [isExamInProgress]);

  const pushLocalToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncingWithSupabase(true);
    try {
      const res = await pushAllLocalDataToSupabase({
        subjects,
        profiles: allUsers,
        quizzes,
        attempts,
      });
      return res;
    } finally {
      setIsSyncingWithSupabase(false);
    }
  };

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('quizrev_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('quizrev_current_user_id', currentUser.id);
    } else {
      localStorage.removeItem('quizrev_current_user_id');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('quizrev_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('quizrev_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('quizrev_attempts', JSON.stringify(attempts));
  }, [attempts]);

  // Exam Countdown Timer
  useEffect(() => {
    if (!isExamInProgress || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            submitExam();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamInProgress, remainingSeconds]);

  const login = (emailOrId: string, password = ''): { success: boolean; message?: string } => {
    const cleanInput = emailOrId.trim().toLowerCase();
    
    // Check both in-memory state and localStorage to avoid stale state issues
    let usersList = allUsers;
    const stored = localStorage.getItem('quizrev_users');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= usersList.length) {
          usersList = parsed;
        }
      } catch {}
    }

    const user = usersList.find(
      u =>
        u.email.toLowerCase() === cleanInput ||
        (u.studentId && u.studentId.toLowerCase() === cleanInput)
    );

    if (!user) {
      return { success: false, message: 'Account not found. Check your email or Student ID.' };
    }

    // Check password if set
    if (user.password && password && user.password !== password) {
      return { success: false, message: 'Invalid password. Please check your credentials.' };
    }

    setCurrentUser(user);
    setCurrentView('home');
    return { success: true };
  };

  const logout = () => {
    if (isExamInProgress) {
      cancelExam();
    }
    setCurrentUser(null);
    localStorage.removeItem('quizrev_current_user_id');
    setCurrentView('home');
  };

  const switchUser = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'teacher' && currentView === 'taking-quiz') {
        cancelExam();
      }
      setCurrentView('home');
    }
  };

  const createStudentAccount = async (data: { fullName: string; email: string; studentId: string; password?: string }): Promise<{ success: boolean; error?: string; user: UserProfile }> => {
    const cleanEmail = data.email.trim().toLowerCase();

    // Check if account with this email already exists in local list
    const existing = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email is already registered.', user: existing };
    }

    const newStudent: UserProfile = {
      id: generateUuid(),
      email: cleanEmail,
      fullName: data.fullName.trim(),
      studentId: data.studentId.trim() || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      role: 'student',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.fullName.trim())}`,
      createdAt: new Date().toISOString(),
      password: data.password || 'student123',
    };

    const updatedUsers = [...allUsers, newStudent];
    setAllUsers(updatedUsers);
    localStorage.setItem('quizrev_users', JSON.stringify(updatedUsers));

    // Save to Supabase
    try {
      const res = await saveProfileToSupabase(newStudent);
      if (!res.success) {
        console.warn('[QuizRev] Supabase profile save notice:', res.error);
        return { success: false, error: res.error, user: newStudent };
      }
      return { success: true, user: newStudent };
    } catch (err: any) {
      console.warn('[QuizRev] Exception saving profile to Supabase:', err);
      return { success: false, error: err.message || 'Failed to save profile', user: newStudent };
    }
  };

  const registerStudent = async (data: { fullName: string; email: string; studentId?: string; password?: string }): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    const res = await createStudentAccount({
      fullName: data.fullName,
      email: data.email,
      studentId: data.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      password: data.password || 'student123',
    });

    if (res.user) {
      // Directly set user and redirect to dashboard
      setCurrentUser(res.user);
      setCurrentView('home');
    }

    return res;
  };

  const addSubject = (name: string, code: string, description: string, color = '#1b6e66') => {
    const newSub: Subject = {
      id: generateUuid(),
      name,
      code: code.toUpperCase(),
      description,
      color,
    };
    setSubjects(prev => [...prev, newSub]);

    // Save to Supabase
    saveSubjectToSupabase(newSub).catch(err => console.warn('Supabase subject save error:', err));

    return newSub;
  };

  const addQuiz = async (quizData: Omit<Quiz, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string; quiz: Quiz }> => {
    const quizId = generateUuid();
    // Ensure all questions and choices have valid UUIDs
    const sanitizedQuestions: Question[] = quizData.questions.map((q, idx) => {
      const questionId = ensureUuid(q.id);
      return {
        ...q,
        id: questionId,
        orderIndex: q.orderIndex || idx + 1,
        choices: q.choices.map((c, cIdx) => ({
          ...c,
          id: ensureUuid(c.id),
          label: c.label || String.fromCharCode(65 + cIdx),
        })),
      };
    });

    const newQuiz: Quiz = {
      ...quizData,
      id: quizId,
      questions: sanitizedQuestions,
      totalQuestions: sanitizedQuestions.length,
      createdAt: new Date().toISOString(),
    };
    
    // Immediately persist locally
    setQuizzes(prev => [newQuiz, ...prev]);

    // Save to Supabase backend and await confirmation
    try {
      const res = await saveQuizToSupabase(newQuiz);
      if (!res.success) {
        console.warn('[QuizRev] Supabase sync alert:', res.error);
        return { success: false, error: res.error, quiz: newQuiz };
      }
      return { success: true, quiz: newQuiz };
    } catch (err: any) {
      console.error('[QuizRev] Unexpected error saving quiz to Supabase:', err);
      return { success: false, error: err.message || 'Supabase save failed', quiz: newQuiz };
    }
  };

  const deleteQuiz = (quizId: string) => {
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
    deleteQuizFromSupabase(quizId).catch(err => console.warn('Supabase delete quiz error:', err));
  };

  // Update answer keys for an existing quiz
  const updateQuizAnswerKeys = (
    quizId: string,
    keyMap: Map<number, { answer: string; explanation?: string }>
  ) => {
    let updatedCount = 0;
    let targetUpdatedQuestions: Question[] = [];

    setQuizzes(prev =>
      prev.map(q => {
        if (q.id !== quizId) return q;

        const updatedQuestions = q.questions.map((question, idx) => {
          const qNum = question.orderIndex || idx + 1;
          const keyEntry = keyMap.get(qNum);

          if (!keyEntry) return question;

          updatedCount++;
          const updatedChoices = question.choices.map(c => ({
            ...c,
            isCorrect: c.label.toUpperCase() === keyEntry.answer.toUpperCase(),
          }));

          return {
            ...question,
            choices: updatedChoices,
            explanation: keyEntry.explanation || question.explanation,
          };
        });

        targetUpdatedQuestions = updatedQuestions;

        return {
          ...q,
          questions: updatedQuestions,
        };
      })
    );

    if (targetUpdatedQuestions.length > 0) {
      updateQuizKeysInSupabase(quizId, targetUpdatedQuestions).catch(err =>
        console.warn('Supabase update keys error:', err)
      );
    }

    return { success: true, updatedCount };
  };

  const recordAttempt = (attemptData: Omit<QuizAttempt, 'id'>) => {
    const newAttempt: QuizAttempt = {
      ...attemptData,
      id: generateUuid(),
    };
    setAttempts(prev => [newAttempt, ...prev]);
    saveAttemptToSupabase(newAttempt).catch(err => console.warn('Supabase record attempt error:', err));
    return newAttempt;
  };

  // Start exam session with randomized questions and choices
  const startExam = (quiz: Quiz) => {
    const preparedQuestions = prepareExamSession(quiz.questions, {
      shuffleQuestions: quiz.shuffleQuestions,
      shuffleChoices: quiz.shuffleChoices,
    });

    setActiveQuiz(quiz);
    setSessionQuestions(preparedQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setFlaggedQuestionIds([]);
    setRemainingSeconds(quiz.durationMinutes * 60);
    setExamStartTime(new Date().toISOString());
    setIsExamInProgress(true);
    setCurrentView('taking-quiz');
  };

  const selectAnswer = (questionId: string, choiceId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestionIds(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const submitExam = (): QuizAttempt | null => {
    if (!activeQuiz || !currentUser) return null;

    const completedAt = new Date().toISOString();
    const timeSpentSeconds = Math.max(
      1,
      activeQuiz.durationMinutes * 60 - remainingSeconds
    );

    let correctCount = 0;
    sessionQuestions.forEach(q => {
      const selectedId = selectedAnswers[q.id];
      const correctChoice = q.choices.find(c => c.isCorrect);
      if (selectedId && correctChoice && selectedId === correctChoice.id) {
        correctCount++;
      }
    });

    const totalQuestions = sessionQuestions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 1000) / 10 : 0;
    const passed = percentage >= activeQuiz.passingPercentage;

    const attempt: QuizAttempt = {
      id: generateUuid(),
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      subjectId: activeQuiz.subjectId,
      subjectName: activeQuiz.subjectName || 'General',
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      startedAt: examStartTime,
      completedAt,
      timeSpentSeconds,
      totalQuestions,
      correctAnswers: correctCount,
      score: correctCount,
      percentage,
      passed,
      answers: { ...selectedAnswers },
    };

    setAttempts(prev => [attempt, ...prev]);
    setLatestAttempt(attempt);
    setIsExamInProgress(false);
    setCurrentView('quiz-result');

    // Save to Supabase (passing currentUser for self-healing profile foreign key)
    saveAttemptToSupabase(attempt, currentUser).then(res => {
      if (res.success) {
        console.info(`[QuizRev] Attempt ${attempt.id} successfully synced to Supabase.`);
      } else {
        console.warn('[QuizRev] Attempt Supabase sync notice:', res.error);
      }
    }).catch(err => console.warn('[QuizRev] Supabase save attempt error:', err));

    return attempt;
  };

  const cancelExam = () => {
    setIsExamInProgress(false);
    setActiveQuiz(null);
    setCurrentView('home');
  };

  const viewAttemptDetails = (attempt: QuizAttempt) => {
    setLatestAttempt(attempt);
    const targetQuiz = quizzes.find(q => q.id === attempt.quizId);
    if (targetQuiz) {
      setActiveQuiz(targetQuiz);
      setSessionQuestions(targetQuiz.questions);
      setSelectedAnswers(attempt.answers);
    }
    setCurrentView('quiz-result');
  };

  const updateSupabaseCredentials = async (url: string, anonKey: string) => {
    saveSupabaseConfig(url, anonKey);
    const newConfig = getSupabaseConfig();
    setSupabaseConfig(newConfig);
    if (newConfig.isConfigured) {
      await refreshFromSupabase();
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers,
        login,
        logout,
        switchUser,
        createStudentAccount,
        registerStudent,
        subjects,
        addSubject,
        quizzes,
        addQuiz,
        deleteQuiz,
        updateQuizAnswerKeys,
        attempts,
        recordAttempt,
        currentView,
        setCurrentView,
        selectedSubjectId,
        setSelectedSubjectId,
        activeQuiz,
        sessionQuestions,
        currentQuestionIndex,
        setCurrentQuestionIndex,
        selectedAnswers,
        flaggedQuestionIds,
        remainingSeconds,
        isExamInProgress,
        startExam,
        selectAnswer,
        toggleFlag,
        submitExam,
        cancelExam,
        latestAttempt,
        viewAttemptDetails,
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        supabaseConfig,
        updateSupabaseCredentials,
        isSyncingWithSupabase,
        pushLocalToSupabase,
        refreshFromSupabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
