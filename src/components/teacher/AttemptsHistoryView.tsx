import React, { useState } from 'react';
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
  Lightbulb 
} from 'lucide-react';

export const AttemptsHistoryView: React.FC = () => {
  const { attempts, subjects, quizzes } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectingAttempt, setInspectingAttempt] = useState<QuizAttempt | null>(null);

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
        <h2 className="font-serif text-2xl font-bold text-ink">
          Student Exam Attempts & Scores
        </h2>
        <p className="text-xs text-ink-muted">
          Comprehensive gradebook and item-response tracking for all student submissions.
        </p>
      </div>

      {/* Teacher Metric Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-xs text-ink-muted">Total Submissions</p>
          <p className="font-serif text-3xl font-bold text-ink tabular-nums mt-1.5">
            {totalSubmissions}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">Mock exam attempts</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-xs text-ink-muted">Average Score</p>
          <p className="font-serif text-3xl font-bold text-ink tabular-nums mt-1.5">
            {avgScore}%
          </p>
          <p className="text-[11px] text-ink-muted mt-1">Classwide average</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-xs text-ink-muted">Class Pass Rate</p>
          <p className="font-serif text-3xl font-bold text-positive tabular-nums mt-1.5">
            {passRate}%
          </p>
          <p className="text-[11px] text-ink-muted mt-1">Scores meeting passing threshold</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by student or exam title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-surface"
          />
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedSubjectId(null)}
            className={`px-3 py-1.5 rounded-control text-xs font-medium transition-all ${
              selectedSubjectId === null
                ? 'bg-ink text-white'
                : 'bg-surface text-ink-muted border border-border hover:text-ink'
            }`}
          >
            All
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3 py-1.5 rounded-control text-xs font-medium transition-all whitespace-nowrap ${
                selectedSubjectId === sub.id
                  ? 'bg-accent text-white'
                  : 'bg-surface text-ink-muted border border-border hover:text-ink'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-ground border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface border-b border-border text-ink-muted font-medium">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Mock Exam</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3 text-right">Score</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Date</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-ink-muted">
                    No attempts found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {att.studentName}
                    </td>
                    <td className="px-5 py-3.5 text-ink font-medium max-w-[200px] truncate">
                      {att.quizTitle}
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted">
                      <span className="px-2 py-0.5 rounded-md bg-surface border border-rule text-[11px]">
                        {att.subjectName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-serif font-bold text-ink tabular-nums text-sm">
                      {att.percentage}%
                      <span className="text-[10px] text-ink-muted font-sans font-normal ml-1">
                        ({att.correctAnswers}/{att.totalQuestions})
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          att.passed
                            ? 'bg-positive-bg text-positive-ink'
                            : 'bg-negative-bg text-negative-ink'
                        }`}
                      >
                        {att.passed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-positive" />
                            <span>Passed</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-negative" />
                            <span>Failed</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-muted whitespace-nowrap">
                      {new Date(att.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setInspectingAttempt(att)}
                        className="px-2.5 py-1 rounded-control border border-border hover:border-control text-[11px] font-medium text-accent hover:bg-accent-light/50 transition-colors"
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
          <div className="bg-ground border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border bg-surface flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-ink">
                  Attempt Details: {inspectingAttempt.studentName}
                </h3>
                <p className="text-xs text-ink-muted">
                  {inspectingAttempt.quizTitle} • {inspectingAttempt.percentage}% ({inspectingAttempt.correctAnswers}/{inspectingAttempt.totalQuestions})
                </p>
              </div>
              <button
                onClick={() => setInspectingAttempt(null)}
                className="p-1 rounded-full text-ink-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
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
                    className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                      isCorrect ? 'bg-surface border-border' : 'bg-negative-bg/20 border-negative/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-ink">
                        {idx + 1}. {q.questionText}
                      </span>
                      {isCorrect ? (
                        <span className="text-positive font-bold flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </span>
                      ) : (
                        <span className="text-negative font-bold flex items-center space-x-1">
                          <X className="w-3.5 h-3.5" />
                          <span>Incorrect</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 pl-4">
                      {q.choices.map((c) => {
                        const isStudentChoice = c.id === userChoiceId;
                        return (
                          <div
                            key={c.id}
                            className={`px-2 py-1 rounded flex items-center justify-between ${
                              c.isCorrect
                                ? 'text-positive font-semibold'
                                : isStudentChoice
                                ? 'text-negative font-semibold'
                                : 'text-ink-muted'
                            }`}
                          >
                            <span>
                              {c.label}. {c.text}
                            </span>
                            {c.isCorrect && (
                              <span className="text-[10px] bg-positive-bg px-1.5 py-0.2 rounded">
                                Answer Key
                              </span>
                            )}
                            {isStudentChoice && !c.isCorrect && (
                              <span className="text-[10px] bg-negative-bg px-1.5 py-0.2 rounded">
                                Student Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="pl-4 text-[11px] text-ink-muted flex items-start space-x-1.5">
                        <Lightbulb className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
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
