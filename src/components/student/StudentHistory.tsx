import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { QuizAttempt } from '../../types/quiz';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  BookOpen, 
  Calendar,
  RefreshCw 
} from 'lucide-react';

export const StudentHistory: React.FC = () => {
  const { currentUser, attempts, subjects, viewAttemptDetails, setCurrentView, refreshFromSupabase, isSyncingWithSupabase } = useApp();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    refreshFromSupabase();
  }, []);

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
          <div className="flex items-center space-x-2.5">
            <h2 className="font-sans text-2xl font-bold text-ink">
              Mock Exam History
            </h2>
            <button
              onClick={() => refreshFromSupabase()}
              disabled={isSyncingWithSupabase}
              title="Refresh attempt history from database"
              className="clay-btn-neutral p-1.5 rounded-xl text-slate-600 hover:text-slate-900 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingWithSupabase ? 'animate-spin text-accent' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            All your past exam sessions, scores, and review breakdowns.
          </p>
        </div>

        {/* Quick Filter Tactile Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedSubject(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedSubject === null
                ? 'clay-inset-sm text-accent bg-teal-50 border border-teal-200/50 shadow-clay-inset'
                : 'clay-surface-sm text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedSubject === sub.id
                  ? 'clay-inset-sm text-accent bg-teal-50 border border-teal-200/50 shadow-clay-inset'
                  : 'clay-surface-sm text-slate-600 hover:text-slate-900'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Attempts List */}
      {filteredAttempts.length === 0 ? (
        <div className="clay-surface p-12 text-center rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl clay-inset flex items-center justify-center text-slate-400 mx-auto">
            <History className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-sans text-base font-bold text-ink">
            No Exam History Yet
          </h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
            You haven't completed any mock exams in this category. Start an exam to test your readiness and track your scores.
          </p>
          <button
            onClick={() => setCurrentView('home')}
            className="clay-btn-teal px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Browse Mock Exams</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAttempts.map((attempt) => (
            <div
              key={attempt.id}
              onClick={() => viewAttemptDetails(attempt)}
              className="clay-surface p-4 sm:p-5 rounded-2xl hover:scale-[1.01] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="clay-surface-pill px-3 py-0.5 text-[11px] font-bold text-accent shadow-clay-sm">
                    {attempt.subjectName}
                  </span>
                  <span className="text-xs font-medium text-ink-muted flex items-center space-x-1">
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

                <h4 className="font-sans text-base font-bold text-ink group-hover:text-accent transition-colors">
                  {attempt.quizTitle}
                </h4>

                <div className="flex items-center space-x-4 text-xs font-medium text-ink-muted">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span className="tabular-nums">{formatDuration(attempt.timeSpentSeconds)}</span>
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-slate-800 tabular-nums">{attempt.correctAnswers}</strong> of{' '}
                    <span className="tabular-nums">{attempt.totalQuestions}</span> correct
                  </span>
                </div>
              </div>

              {/* Score Badge & Action */}
              <div className="flex items-center justify-between sm:justify-end space-x-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                <div className="text-right">
                  <div className="flex items-center space-x-1.5 sm:justify-end">
                    {attempt.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span
                      className={`font-sans text-xl font-black tabular-nums ${
                        attempt.passed ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {attempt.percentage}%
                    </span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      attempt.passed ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {attempt.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>

                <div className="clay-surface-sm w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-accent group-hover:scale-105 transition-all">
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
