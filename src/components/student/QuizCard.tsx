import React from 'react';
import { Quiz, QuizAttempt } from '../../types/quiz';
import { Clock, HelpCircle, Shuffle, Award, ArrowRight } from 'lucide-react';

interface QuizCardProps {
  quiz: Quiz;
  attempts: QuizAttempt[];
  onStartExam: (quiz: Quiz) => void;
  onViewHistory?: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  attempts,
  onStartExam,
}) => {
  const quizAttempts = attempts.filter((a) => a.quizId === quiz.id);
  const latestAttempt = quizAttempts[0];
  const hasPassed = quizAttempts.some((a) => a.passed);

  return (
    <div className="clay-surface p-6 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group">
      <div>
        {/* Top Meta: Subject & Badges */}
        <div className="flex items-center justify-between mb-3.5">
          <span
            className="text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center space-x-2 clay-surface-pill"
            style={{
              color: quiz.subjectColor || '#0d9488',
            }}
          >
            <span
              className="w-2 h-2 rounded-full shadow-inner"
              style={{ backgroundColor: quiz.subjectColor || '#0d9488' }}
            />
            <span>{quiz.subjectName || 'General'}</span>
          </span>

          {quiz.shuffleQuestions && (
            <span className="text-[10px] font-bold text-ink-muted flex items-center space-x-1.5 clay-inset-sm px-2.5 py-1 rounded-full">
              <Shuffle className="w-3 h-3 text-accent" />
              <span>Shuffled</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-ink group-hover:text-accent transition-colors leading-snug">
          {quiz.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-ink-muted mt-2 line-clamp-2 leading-relaxed font-medium">
          {quiz.description || 'Practice exam designed for mastery, timing assessment, and revision.'}
        </p>

        {/* Metrics Pill Grid */}
        <div className="clay-inset p-3 rounded-2xl grid grid-cols-3 gap-2 mt-4 text-ink">
          <div className="flex items-center space-x-1.5 text-xs text-ink-muted">
            <HelpCircle className="w-3.5 h-3.5 text-accent" />
            <span className="font-bold text-ink tabular-nums">{quiz.questions.length}</span>
            <span className="text-[11px] font-medium">items</span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-ink-muted">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span className="font-bold text-ink tabular-nums">{quiz.durationMinutes}</span>
            <span className="text-[11px] font-medium">mins</span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-ink-muted">
            <Award className="w-3.5 h-3.5 text-accent" />
            <span className="font-bold text-ink tabular-nums">{quiz.passingPercentage}%</span>
            <span className="text-[11px] font-medium">pass</span>
          </div>
        </div>
      </div>

      {/* Footer Attempt Status & CTA */}
      <div className="mt-5 pt-4 border-t border-rule flex items-center justify-between">
        <div>
          {latestAttempt ? (
            <div className="clay-surface-pill px-3 py-1 flex items-center space-x-1.5 text-[11px]">
              <span className="text-ink-muted font-medium">Score: </span>
              <span
                className={`font-bold tabular-nums ${
                  latestAttempt.passed ? 'text-positive' : 'text-negative'
                }`}
              >
                {latestAttempt.percentage}%
              </span>
              <span className="text-ink-muted font-medium">
                ({latestAttempt.correctAnswers}/{latestAttempt.totalQuestions})
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-ink-muted font-medium px-2 py-1">Not taken yet</span>
          )}
        </div>

        <button
          onClick={() => onStartExam(quiz)}
          className="px-4 py-2 rounded-2xl clay-btn clay-btn-teal text-xs font-bold transition-all shadow-clay-btn flex items-center space-x-1.5 active:scale-95 cursor-pointer"
        >
          <span>{latestAttempt ? 'Retake Exam' : 'Take Exam'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
