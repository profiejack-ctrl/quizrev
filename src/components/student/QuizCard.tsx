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
    <div className="bg-ground border border-border rounded-2xl p-5 sm:p-6 transition-all hover:border-accent/40 hover:shadow-md flex flex-col justify-between group">
      <div>
        {/* Top Meta: Subject & Badges */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1.5"
            style={{
              backgroundColor: `${quiz.subjectColor || '#1b6e66'}15`,
              color: quiz.subjectColor || '#1b6e66',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: quiz.subjectColor || '#1b6e66' }}
            />
            <span>{quiz.subjectName || 'General'}</span>
          </span>

          {quiz.shuffleQuestions && (
            <span className="text-[11px] text-ink-muted flex items-center space-x-1 bg-surface px-2.5 py-0.5 rounded-md border border-rule">
              <Shuffle className="w-3 h-3 text-accent" />
              <span>Shuffled</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-ink group-hover:text-accent transition-colors leading-snug">
          {quiz.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-ink-muted mt-2 line-clamp-2 leading-relaxed">
          {quiz.description || 'Practice exam designed for mastery, timing assessment, and revision.'}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-rule text-ink">
          <div className="flex items-center space-x-1.5 text-xs text-ink-muted">
            <HelpCircle className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-medium text-ink tabular-nums">{quiz.questions.length}</span>
            <span className="text-[11px]">items</span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-ink-muted">
            <Clock className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-medium text-ink tabular-nums">{quiz.durationMinutes}</span>
            <span className="text-[11px]">mins</span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-ink-muted">
            <Award className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-medium text-ink tabular-nums">{quiz.passingPercentage}%</span>
            <span className="text-[11px]">pass</span>
          </div>
        </div>
      </div>

      {/* Footer Attempt Status & CTA */}
      <div className="mt-5 pt-4 border-t border-rule flex items-center justify-between">
        <div>
          {latestAttempt ? (
            <div className="text-[11px]">
              <span className="text-ink-muted">Last Score: </span>
              <span
                className={`font-semibold tabular-nums ${
                  latestAttempt.passed ? 'text-positive' : 'text-negative'
                }`}
              >
                {latestAttempt.percentage}%
              </span>
              <span className="text-ink-muted ml-1">
                ({latestAttempt.correctAnswers}/{latestAttempt.totalQuestions})
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-ink-muted">Not taken yet</span>
          )}
        </div>

        <button
          onClick={() => onStartExam(quiz)}
          className="px-4 py-2 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
        >
          <span>{latestAttempt ? 'Retake Exam' : 'Take Exam'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
