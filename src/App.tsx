import React, { useMemo, useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { MobileNav } from './components/common/MobileNav';
import { LoginScreen } from './components/auth/LoginScreen';
import { SupabaseSettingsModal } from './components/common/SupabaseSettingsModal';
import { GeminiConfigModal } from './components/teacher/GeminiConfigModal';
import { AnswerKeyUploaderModal } from './components/teacher/AnswerKeyUploaderModal';
import { getGeminiConfig } from './lib/geminiAgent';
import { SubjectSelector } from './components/student/SubjectSelector';
import { QuizCard } from './components/student/QuizCard';
import { ActiveQuizScreen } from './components/student/ActiveQuizScreen';
import { QuizResultView } from './components/student/QuizResultView';
import { StudentHistory } from './components/student/StudentHistory';
import { StudentAnalytics } from './components/student/StudentAnalytics';
import { TeacherUploadModal } from './components/teacher/TeacherUploadModal';
import { StudentManager } from './components/teacher/StudentManager';
import { AttemptsHistoryView } from './components/teacher/AttemptsHistoryView';
import { calculateStudentAnalytics } from './lib/analytics';
import { 
  UploadCloud, 
  UserPlus, 
  BookOpen, 
  TrendingUp, 
  CheckCircle2, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Key, 
  Database,
  Loader2,
  RefreshCw 
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    currentUser,
    currentView,
    setCurrentView,
    subjects,
    selectedSubjectId,
    setSelectedSubjectId,
    quizzes,
    deleteQuiz,
    attempts,
    startExam,
    isExamInProgress,
    setIsSupabaseModalOpen,
    supabaseConfig,
    isSyncingWithSupabase,
    refreshFromSupabase,
  } = useApp();

  const [isAnswerKeyModalOpen, setIsAnswerKeyModalOpen] = useState(false);
  const [selectedQuizForKey, setSelectedQuizForKey] = useState<string | undefined>(undefined);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiConfig, setGeminiConfig] = useState(getGeminiConfig());

  const handleGeminiConfigUpdated = () => {
    setGeminiConfig(getGeminiConfig());
  };

  const isTeacher = currentUser?.role === 'teacher';

  // Compute quiz count per subject (Called unconditionally at top level)
  const quizCountsBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    subjects.forEach((s) => (counts[s.id] = 0));
    quizzes.forEach((q) => {
      counts[q.subjectId] = (counts[q.subjectId] || 0) + 1;
    });
    return counts;
  }, [subjects, quizzes]);

  // Filter quizzes by selected subject (Called unconditionally at top level)
  const filteredQuizzes = useMemo(() => {
    if (!selectedSubjectId) return quizzes;
    return quizzes.filter((q) => q.subjectId === selectedSubjectId);
  }, [quizzes, selectedSubjectId]);

  // Student metrics (Called unconditionally at top level)
  const studentAnalytics = useMemo(() => {
    if (!currentUser || isTeacher) return null;
    return calculateStudentAnalytics(currentUser.id, attempts, subjects);
  }, [currentUser, attempts, subjects, isTeacher]);

  const studentAttempts = useMemo(() => {
    if (!currentUser) return [];
    return attempts.filter((a) => a.studentId === currentUser.id);
  }, [currentUser, attempts]);

  const handleOpenAnswerKeyUploader = (quizId?: string) => {
    setSelectedQuizForKey(quizId || (quizzes[0]?.id));
    setIsAnswerKeyModalOpen(true);
  };

  // Safe first name extraction
  const userFirstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'User';

  // If user is not logged in, render the login screen (AFTER all hooks are called)
  if (!currentUser) {
    return <LoginScreen />;
  }

  // If in active exam, render exam taker full screen
  if (isExamInProgress) {
    return <ActiveQuizScreen />;
  }

  return (
    <div className="min-h-screen bg-ground flex flex-col text-ink">
      <Navbar />

      <main className="flex-1">
        {/* VIEW ROUTING */}
        
        {/* 1. QUIZ RESULT VIEW */}
        {currentView === 'quiz-result' && <QuizResultView />}

        {/* 2. STUDENT ATTEMPT HISTORY */}
        {currentView === 'history' && <StudentHistory />}

        {/* 3. STUDENT ANALYTICS */}
        {currentView === 'analytics' && <StudentAnalytics />}

        {/* 4. TEACHER UPLOAD */}
        {currentView === 'upload' && <TeacherUploadModal />}

        {/* 5. TEACHER STUDENTS */}
        {currentView === 'students' && <StudentManager />}

        {/* 6. TEACHER ATTEMPTS */}
        {currentView === 'attempts' && <AttemptsHistoryView />}

        {/* 7. HOME / OVERVIEW VIEW (Both Roles) */}
        {currentView === 'home' && (
          <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-8 pb-24 md:pb-12">
            
            {/* Editorial Greeting Header */}
            <div className="space-y-1.5 text-left sm:text-center max-w-2xl mx-auto pt-2">
              <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {isTeacher
                  ? `Welcome back, ${userFirstName}`
                  : `Good day, ${userFirstName}`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {isTeacher
                  ? `${quizzes.length} mock exams active • ${attempts.length} total student submissions`
                  : `${quizzes.length} mock exams available for practice and revision.`}
              </p>
            </div>

            {/* Role-Specific Dashboard Metrics */}
            {isTeacher ? (
              /* Teacher Overview */
              <div className="space-y-8">
                {/* 4 Tactile Clay KPI Tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Mock Exams</span>
                    <p className="font-sans text-3xl sm:text-4xl font-black text-slate-800 tabular-nums mt-1.5">
                      {quizzes.length}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 mt-1">Across {subjects.length} subjects</p>
                  </div>

                  <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Student Submissions</span>
                    <p className="font-sans text-3xl sm:text-4xl font-black text-slate-800 tabular-nums mt-1.5">
                      {attempts.length}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 mt-1">Total completed tests</p>
                  </div>

                  <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Pass Rate</span>
                    <p className="font-sans text-3xl sm:text-4xl font-black text-emerald-700 tabular-nums mt-1.5">
                      {attempts.length > 0
                        ? `${Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)}%`
                        : '0%'}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 mt-1">Benchmark: 70%+</p>
                  </div>

                  <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Questions Bank</span>
                    <p className="font-sans text-3xl sm:text-4xl font-black text-slate-800 tabular-nums mt-1.5">
                      {quizzes.reduce((acc, q) => acc + q.questions.length, 0)}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 mt-1">Shuffled items & keys</p>
                  </div>
                </div>

                {/* Quick Actions Row with Tactile Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setCurrentView('upload')}
                    className="clay-btn-teal px-4 py-2.5 rounded-xl text-xs font-bold transition-transform active:scale-95 flex items-center space-x-1.5"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Exam (.docx / .pdf)</span>
                  </button>

                  <button
                    onClick={() => handleOpenAnswerKeyUploader()}
                    className="clay-btn-neutral px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-transform active:scale-95 flex items-center space-x-1.5"
                  >
                    <Key className="w-4 h-4 text-accent" />
                    <span>Upload Answer Key</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('students')}
                    className="clay-btn-neutral px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-transform active:scale-95 flex items-center space-x-1.5"
                  >
                    <UserPlus className="w-4 h-4 text-slate-500" />
                    <span>Create Student Account</span>
                  </button>

                  {/* Teacher-Only Supabase DB Configuration Button */}
                  <button
                    onClick={() => setIsSupabaseModalOpen(true)}
                    className="clay-btn-neutral px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-transform active:scale-95 flex items-center space-x-2"
                    title="Configure Supabase Database"
                  >
                    {isSyncingWithSupabase ? (
                      <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                    ) : (
                      <Database className="w-3.5 h-3.5 text-accent" />
                    )}
                    <span>
                      {isSyncingWithSupabase ? 'Syncing...' : 'Supabase DB'}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        supabaseConfig.isConfigured ? 'bg-emerald-500 shadow-xs' : 'bg-amber-500'
                      }`}
                      title={supabaseConfig.isConfigured ? 'Supabase Connected' : 'Local Storage Mode'}
                    />
                  </button>

                  {/* Teacher-Only Gemini AI Configuration Button */}
                  <button
                    onClick={() => setIsGeminiModalOpen(true)}
                    className="clay-btn-neutral px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-transform active:scale-95 flex items-center space-x-2"
                    title="Configure Gemini AI Agent"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>AI Agent ({geminiConfig.model})</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        geminiConfig.isConfigured ? 'bg-emerald-500 shadow-xs' : 'bg-amber-500'
                      }`}
                    />
                  </button>
                </div>

                {/* Published Mock Exams Table (Pillowy Clay Card) */}
                <div className="clay-surface p-6 sm:p-7 rounded-3xl space-y-4 shadow-clay">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-sans text-base font-bold text-slate-800">
                        Published Mock Exams
                      </h3>
                      <p className="text-xs text-slate-500">
                        Manage your active exams, attach answer keys, and configure durations.
                      </p>
                    </div>
                    <span className="clay-surface-pill px-3 py-1 text-xs font-bold text-accent tabular-nums shadow-clay-sm">
                      {quizzes.length} exams
                    </span>
                  </div>

                  {quizzes.length === 0 ? (
                    <div className="text-center py-12 px-4 clay-inset rounded-2xl space-y-3">
                      <div className="w-12 h-12 rounded-2xl clay-surface flex items-center justify-center mx-auto text-accent shadow-clay-sm">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        No Mock Exams Published Yet
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Upload your first exam questions and answer keys in DOCX or PDF format to let students start testing.
                      </p>
                      <button
                        onClick={() => setCurrentView('upload')}
                        className="clay-btn-teal px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload First Exam</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quizzes.map((quiz) => {
                        const quizSubmissions = attempts.filter((a) => a.quizId === quiz.id);

                        return (
                          <div
                            key={quiz.id}
                            className="clay-surface-sm p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:scale-[1.005] transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span
                                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full clay-surface-pill shadow-xs"
                                  style={{
                                    backgroundColor: `${quiz.subjectColor || '#0d9488'}15`,
                                    color: quiz.subjectColor || '#0d9488',
                                  }}
                                >
                                  {quiz.subjectName}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {quiz.questions.length} questions • {quiz.durationMinutes} min limit
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-800">
                                {quiz.title}
                              </h4>
                            </div>

                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="text-right pr-2">
                                <p className="text-[11px] text-slate-400 font-medium">Submissions</p>
                                <p className="text-xs font-bold text-slate-800 tabular-nums">
                                  {quizSubmissions.length}
                                </p>
                              </div>

                              <button
                                onClick={() => handleOpenAnswerKeyUploader(quiz.id)}
                                className="clay-btn-neutral px-3 py-1.5 rounded-xl text-slate-700 text-[11px] font-bold flex items-center space-x-1"
                                title="Attach or update answer key"
                              >
                                <Key className="w-3 h-3 text-accent" />
                                <span>Upload Key</span>
                              </button>

                              <button
                                onClick={() => startExam(quiz)}
                                className="clay-btn-neutral px-3 py-1.5 rounded-xl text-slate-700 text-[11px] font-bold"
                                title="Preview taking exam"
                              >
                                Preview
                              </button>

                              <button
                                onClick={() => deleteQuiz(quiz.id)}
                                className="clay-btn-coral p-2 rounded-xl text-white hover:scale-105 transition-transform"
                                title="Delete quiz"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Student Overview */
              <div className="space-y-8">
                {/* Student KPI Row */}
                {studentAnalytics && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Improvement Rating</span>
                      <div className="flex items-baseline space-x-1.5 mt-1.5">
                        <span
                          className={`font-sans text-3xl font-black tabular-nums ${
                            studentAnalytics.improvementRating > 0
                              ? 'text-emerald-700'
                              : 'text-slate-800'
                          }`}
                        >
                          {studentAnalytics.improvementRating > 0
                            ? `+${studentAnalytics.improvementRating}%`
                            : `${studentAnalytics.improvementRating}%`}
                        </span>
                        {studentAnalytics.improvementRating > 0 && (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-1">Growth progression</p>
                    </div>

                    <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Score</span>
                      <p className="font-sans text-3xl font-black text-slate-800 tabular-nums mt-1.5">
                        {studentAnalytics.averageScore}%
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 mt-1">Overall test accuracy</p>
                    </div>

                    <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Exams Completed</span>
                      <p className="font-sans text-3xl font-black text-slate-800 tabular-nums mt-1.5">
                        {studentAnalytics.totalAttempts}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 mt-1">
                        {studentAnalytics.overallPassRate}% pass rate
                      </p>
                    </div>

                    <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Revision Time</span>
                      <p className="font-sans text-3xl font-black text-slate-800 tabular-nums mt-1.5">
                        {studentAnalytics.totalTimeSpentMinutes}
                        <span className="text-base font-sans font-bold text-slate-500 ml-1">m</span>
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 mt-1">Dedicated study</p>
                    </div>
                  </div>
                )}

                {/* Subject Selector Filter Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-sans text-base font-bold text-slate-800">
                        Select Subject
                      </h3>
                      <button
                        onClick={() => refreshFromSupabase()}
                        disabled={isSyncingWithSupabase}
                        title="Refresh exams from cloud database"
                        className="clay-btn-neutral p-1.5 rounded-xl text-slate-600 hover:text-slate-900 transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWithSupabase ? 'animate-spin text-accent' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isSyncingWithSupabase && (
                        <span className="text-[11px] font-bold text-accent flex items-center space-x-1 animate-pulse">
                          <span>Syncing...</span>
                        </span>
                      )}
                      <span className="clay-surface-pill px-3 py-0.5 text-xs font-bold text-slate-600 shadow-clay-sm">
                        {filteredQuizzes.length} mock {filteredQuizzes.length === 1 ? 'exam' : 'exams'}
                      </span>
                    </div>
                  </div>

                  <SubjectSelector
                    subjects={subjects}
                    selectedSubjectId={selectedSubjectId}
                    onSelectSubject={setSelectedSubjectId}
                    quizCountsBySubject={quizCountsBySubject}
                  />
                </div>

                {/* Quizzes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredQuizzes.map((quiz) => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      attempts={studentAttempts}
                      onStartExam={startExam}
                    />
                  ))}
                </div>

                {filteredQuizzes.length === 0 && (
                  <div className="clay-surface p-10 rounded-3xl text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center mx-auto text-slate-400">
                      <BookOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">No mock exams found</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                        {selectedSubjectId 
                          ? 'No mock exams uploaded for this specific subject yet. Try selecting "All Subjects".'
                          : 'Your teacher has not published mock exams yet, or exams are syncing from the cloud.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => refreshFromSupabase()}
                      disabled={isSyncingWithSupabase}
                      className="clay-btn-neutral px-4 py-2.5 rounded-xl text-slate-700 text-xs font-bold inline-flex items-center space-x-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWithSupabase ? 'animate-spin text-accent' : ''}`} />
                      <span>Check for New Exams</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Supabase Connection Modal (Only openable by teacher from dashboard) */}
      <SupabaseSettingsModal />

      {/* Gemini AI Agent Configuration Modal (Teacher only) */}
      <GeminiConfigModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        onConfigUpdated={handleGeminiConfigUpdated}
      />

      {/* Answer Key Uploader Modal */}
      <AnswerKeyUploaderModal
        initialQuizId={selectedQuizForKey}
        isOpen={isAnswerKeyModalOpen}
        onClose={() => setIsAnswerKeyModalOpen(false)}
      />

      {/* Mobile-First Thumb Navigation Bar */}
      <MobileNav />
    </div>
  );
};

export default App;
