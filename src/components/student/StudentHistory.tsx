import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QuizAttempt } from '../../types/quiz';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  BookOpen, 
  Calendar 
} from 'lucide-react';

export const StudentHistory: React.FC = () => {
  const { currentUser, attempts, subjects, viewAttemptDetails, setCurrentView } = useApp();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  if (!currentUser) return null;

  const studentAttempts = attempts.filter((a) => a.studentId === currentUser.id);

  const filteredAttempts = selectedSubject
    ? studentAttempts.filter((a) => a.subjectId === selectedSubject)
    : studentAttempts;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 md:pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">
            Mock Exam History
          </h2>
          <p className="text-xs text-ink-muted">
            All your past exam sessions, scores, and review breakdowns.
          </p>
        </div>

        {/* Quick Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedSubject(null)}
            className={`px-3 py-1.5 rounded-control text-xs font-medium transition-all ${
              selectedSubject === null
                ? 'bg-ink text-white'
                : 'bg-surface text-ink-muted border border-border hover:text-ink'
            }`}
          >
            All
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`px-3 py-1.5 rounded-control text-xs font-medium transition-all whitespace-nowrap ${
                selectedSubject === sub.id
                  ? 'bg-accent text-white'
                  : 'bg-surface text-ink-muted border border-border hover:text-ink'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Attempts List */}
      {filteredAttempts.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-border/60 mx-auto flex items-center justify-center text-ink-muted">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-base font-semibold text-ink">
            No Exam History Yet
          </h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
            You haven't completed any mock exams in this category. Start an exam to test your readiness and track your scores.
          </p>
          <button
            onClick={() => setCurrentView('home')}
            className="px-4 py-2 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors inline-flex items-center space-x-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Browse Mock Exams</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAttempts.map((attempt) => (
            <div
              key={attempt.id}
              onClick={() => viewAttemptDetails(attempt)}
              className="bg-ground border border-border rounded-2xl p-4 sm:p-5 hover:border-accent/40 hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-surface border border-rule text-ink-muted">
                    {attempt.subjectName}
                  </span>
                  <span className="text-xs text-ink-muted flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(attempt.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </span>
                </div>

                <h4 className="font-serif text-base font-semibold text-ink group-hover:text-accent transition-colors">
                  {attempt.quizTitle}
                </h4>

                <div className="flex items-center space-x-4 text-xs text-ink-muted">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{formatDuration(attempt.timeSpentSeconds)}</span>
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-ink tabular-nums">{attempt.correctAnswers}</strong> of{' '}
                    <span className="tabular-nums">{attempt.totalQuestions}</span> items correct
                  </span>
                </div>
              </div>

              {/* Score Badge & Action */}
              <div className="flex items-center justify-between sm:justify-end space-x-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-rule">
                <div className="text-right">
                  <div className="flex items-center space-x-1.5 sm:justify-end">
                    {attempt.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-positive" />
                    ) : (
                      <XCircle className="w-4 h-4 text-negative" />
                    )}
                    <span
                      className={`font-serif text-xl font-bold tabular-nums ${
                        attempt.passed ? 'text-positive' : 'text-negative'
                      }`}
                    >
                      {attempt.percentage}%
                    </span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-semibold tracking-wider ${
                      attempt.passed ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {attempt.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-ink-muted group-hover:text-ink group-hover:bg-border transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
