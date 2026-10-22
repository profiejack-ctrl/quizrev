import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { QuizAttempt } from '../../types/quiz';
import { 
  ClipboardList, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  X, 
  Check, 
  Lightbulb, 
  RefreshCw 
} from 'lucide-react';

export const AttemptsHistoryView: React.FC = () => {
  const { attempts, subjects, quizzes, refreshFromSupabase, isSyncingWithSupabase } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectingAttempt, setInspectingAttempt] = useState<QuizAttempt | null>(null);

  // Auto-refresh attempts when opening this screen
  useEffect(() => {
    refreshFromSupabase();
  }, []);

  // Filters
  const filteredAttempts = attempts.filter((att) => {
    const matchesSubject = !selectedSubjectId || att.subjectId === selectedSubjectId;
    const matchesSearch =
      att.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.quizTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // Analytics for Teacher
  const totalSubmissions = attempts.length;
  const passCount = attempts.filter((a) => a.passed).length;
  const passRate = totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 100) : 0;
  const avgScore =
    totalSubmissions > 0
      ? Math.round(
          (attempts.reduce((acc, a) => acc + a.percentage, 0) / totalSubmissions) * 10
        ) / 10
      : 0;

  const targetQuiz = inspectingAttempt
    ? quizzes.find((q) => q.id === inspectingAttempt.quizId)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <h2 className="font-sans text-2xl font-bold text-ink">
            Student Exam Attempts & Scores
          </h2>
          <button
            onClick={() => refreshFromSupabase()}
            disabled={isSyncingWithSupabase}
            title="Refresh attempts from cloud database"
            className="clay-btn-neutral p-1.5 rounded-xl text-slate-600 hover:text-slate-900 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingWithSupabase ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-ink-muted mt-0.5">
          Comprehensive gradebook and item-response tracking for all student submissions.
        </p>
      </div>

      {/* Teacher Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Submissions</p>
          <p className="font-sans text-3xl sm:text-4xl font-black text-slate-800 tabular-nums mt-1.5">
            {totalSubmissions}
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-1">Mock exam attempts</p>
        </div>

        <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Score</p>
          <p className="font-sans text-3xl sm:text-4xl font-black text-slate-800 tabular-nums mt-1.5">
            {avgScore}%
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-1">Classwide average</p>
        </div>

        <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Class Pass Rate</p>
          <p className="font-sans text-3xl sm:text-4xl font-black text-emerald-700 tabular-nums mt-1.5">
            {passRate}%
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-1">Benchmark met</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student or exam title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="clay-inset w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent font-medium"
          />
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedSubjectId(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedSubjectId === null
                ? 'clay-inset-sm text-accent bg-teal-50 border border-teal-200/50 shadow-clay-inset'
                : 'clay-surface-sm text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedSubjectId === sub.id
                  ? 'clay-inset-sm text-accent bg-teal-50 border border-teal-200/50 shadow-clay-inset'
                  : 'clay-surface-sm text-slate-600 hover:text-slate-900'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tactile Clay Table / Gradebook */}
      <div className="clay-surface rounded-3xl p-4 sm:p-6 overflow-hidden shadow-clay">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Mock Exam</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 font-medium">
                    No attempts found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {att.studentName}
                    </td>
                    <td className="px-4 py-3.5 text-slate-800 font-medium max-w-[200px] truncate">
                      {att.quizTitle}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium">
                      <span className="clay-surface-pill px-2.5 py-0.5 text-[11px] font-bold text-accent shadow-xs">
                        {att.subjectName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-sans font-black text-slate-800 tabular-nums text-sm">
                      {att.percentage}%
                      <span className="text-[10px] text-slate-400 font-medium ml-1">
                        ({att.correctAnswers}/{att.totalQuestions})
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                          att.passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-300'
                        }`}
                      >
                        {att.passed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Passed</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Failed</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500 whitespace-nowrap font-medium">
                      {new Date(att.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setInspectingAttempt(att)}
                        className="clay-btn-neutral px-3 py-1 rounded-xl text-[11px] font-bold text-accent"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Attempt Modal */}
      {inspectingAttempt && targetQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="clay-surface rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-clay-lg flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200/60 bg-white/50 flex items-center justify-between">
              <div>
                <h3 className="font-sans text-lg font-bold text-ink">
                  Attempt Details: {inspectingAttempt.studentName}
                </h3>
                <p className="text-xs text-ink-muted">
                  {inspectingAttempt.quizTitle} • {inspectingAttempt.percentage}% ({inspectingAttempt.correctAnswers}/{inspectingAttempt.totalQuestions})
                </p>
              </div>
              <button
                onClick={() => setInspectingAttempt(null)}
                className="clay-btn-neutral p-1.5 rounded-xl text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {targetQuiz.questions.map((q, idx) => {
                const userChoiceId = inspectingAttempt.answers[q.id];
                const userChoice = q.choices.find((c) => c.id === userChoiceId);
                const correctChoice = q.choices.find((c) => c.isCorrect);
                const isCorrect = userChoice && userChoice.isCorrect;

                return (
                  <div
                    key={q.id}
                    className={`clay-surface-sm p-4 rounded-2xl text-xs space-y-2.5 ${
                      isCorrect ? 'border-emerald-200/60' : 'border-rose-200/80 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-slate-800">
                        {idx + 1}. {q.questionText}
                      </span>
                      {isCorrect ? (
                        <span className="text-emerald-700 font-bold flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold flex items-center space-x-1">
                          <X className="w-3.5 h-3.5" />
                          <span>Incorrect</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 pl-3">
                      {q.choices.map((c) => {
                        const isStudentChoice = c.id === userChoiceId;
                        return (
                          <div
                            key={c.id}
                            className={`px-3 py-1.5 rounded-xl flex items-center justify-between font-medium ${
                              c.isCorrect
                                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                                : isStudentChoice
                                ? 'bg-rose-50 text-rose-800 font-semibold border border-rose-200'
                                : 'text-slate-500'
                            }`}
                          >
                            <span>
                              {c.label}. {c.text}
                            </span>
                            {c.isCorrect && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                                Answer Key
                              </span>
                            )}
                            {isStudentChoice && !c.isCorrect && (
                              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-bold">
                                Student Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="clay-inset-sm p-3 rounded-xl text-[11px] text-slate-600 flex items-start space-x-2">
                        <Lightbulb className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                        <span>{q.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
