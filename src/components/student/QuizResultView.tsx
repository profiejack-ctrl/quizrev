import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  ArrowLeft, 
  RotateCcw, 
  BarChart2, 
  BookOpen, 
  Lightbulb 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuizResultView: React.FC = () => {
  const {
    latestAttempt,
    activeQuiz,
    sessionQuestions,
    setCurrentView,
    startExam,
  } = useApp();

  useEffect(() => {
    if (latestAttempt && latestAttempt.passed) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#1b6e66', '#2e7d32', '#f3f3f3'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [latestAttempt]);

  if (!latestAttempt) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-muted text-sm">No exam attempt found.</p>
        <button
          onClick={() => setCurrentView('home')}
          className="mt-4 px-4 py-2 bg-accent text-white rounded-control text-xs"
        >
          Return Home
        </button>
      </div>
    );
  }

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleRetake = () => {
    if (activeQuiz) {
      startExam(activeQuiz);
    } else {
      setCurrentView('home');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 md:pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center space-x-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Mock Exams</span>
        </button>

        <span className="text-xs text-ink-muted">
          Completed {new Date(latestAttempt.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase flex items-center space-x-1.5 ${
              latestAttempt.passed
                ? 'bg-positive-bg text-positive-ink border border-positive/30'
                : 'bg-negative-bg text-negative-ink border border-negative/30'
            }`}
          >
            {latestAttempt.passed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-positive" />
                <span>Passed Mock Exam</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-negative" />
                <span>Needs Improvement</span>
              </>
            )}
          </span>
        </div>

        <div>
          <div className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-ink tabular-nums">
            {latestAttempt.percentage}%
          </div>
          <p className="text-sm font-medium text-ink-muted mt-1">
            {latestAttempt.quizTitle}
          </p>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-rule max-w-md mx-auto text-center">
          <div className="p-3 bg-ground rounded-xl border border-border">
            <p className="text-[11px] text-ink-muted">Score</p>
            <p className="text-base font-semibold text-ink tabular-nums mt-0.5">
              {latestAttempt.correctAnswers} / {latestAttempt.totalQuestions}
            </p>
          </div>

          <div className="p-3 bg-ground rounded-xl border border-border">
            <p className="text-[11px] text-ink-muted">Time Spent</p>
            <p className="text-base font-semibold text-ink tabular-nums mt-0.5">
              {formatSeconds(latestAttempt.timeSpentSeconds)}
            </p>
          </div>

          <div className="p-3 bg-ground rounded-xl border border-border">
            <p className="text-[11px] text-ink-muted">Subject</p>
            <p className="text-xs font-semibold text-ink truncate mt-1">
              {latestAttempt.subjectName}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            onClick={handleRetake}
            className="px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shadow-sm flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake This Exam</span>
          </button>

          <button
            onClick={() => setCurrentView('analytics')}
            className="px-5 py-2.5 rounded-control border border-border bg-ground hover:bg-surface text-ink text-xs font-medium transition-all flex items-center space-x-1.5"
          >
            <BarChart2 className="w-3.5 h-3.5 text-ink-muted" />
            <span>View Progress & Analytics</span>
          </button>
        </div>
      </div>

      {/* Question Breakdown Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-ink">
            Question Review & Answer Key
          </h3>
          <p className="text-xs text-ink-muted">
            Detailed breakdown of your answers and comprehensive explanations.
          </p>
        </div>
        <span className="text-xs font-medium text-ink-muted tabular-nums">
          {latestAttempt.correctAnswers} of {latestAttempt.totalQuestions} Correct
        </span>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {sessionQuestions.map((q, qIdx) => {
          const userChoiceId = latestAttempt.answers[q.id];
          const userChoice = q.choices.find((c) => c.id === userChoiceId);
          const correctChoice = q.choices.find((c) => c.isCorrect);
          const isUserCorrect = Boolean(userChoice && userChoice.isCorrect);

          return (
            <div
              key={q.id}
              className={`border rounded-2xl p-5 sm:p-6 transition-all ${
                isUserCorrect
                  ? 'bg-ground border-border'
                  : 'bg-ground border-negative/30'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold tabular-nums ${
                      isUserCorrect
                        ? 'bg-positive-bg text-positive-ink'
                        : 'bg-negative-bg text-negative-ink'
                    }`}
                  >
                    {qIdx + 1}
                  </span>
                  <span className="text-xs font-medium text-ink-muted">
                    {isUserCorrect ? 'Correct (+1 pt)' : 'Incorrect (0 pt)'}
                  </span>
                </div>

                {isUserCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-positive flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-negative flex-shrink-0" />
                )}
              </div>

              {/* Question Text */}
              <p className="text-sm font-medium text-ink mb-4 leading-relaxed">
                {q.questionText}
              </p>

              {/* Choices Review */}
              <div className="space-y-2 mb-4">
                {q.choices.map((choice) => {
                  const wasChosen = userChoiceId === choice.id;
                  const isThisCorrect = choice.isCorrect;

                  let choiceStyle = 'bg-surface border-border text-ink-muted';

                  if (isThisCorrect) {
                    choiceStyle = 'bg-positive-bg/40 border-positive/50 text-ink font-medium';
                  } else if (wasChosen && !isThisCorrect) {
                    choiceStyle = 'bg-negative-bg/50 border-negative/50 text-negative-ink line-through';
                  }

                  return (
                    <div
                      key={choice.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${choiceStyle}`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="font-semibold">{choice.label}.</span>
                        <span>{choice.text}</span>
                      </div>

                      <div className="text-[11px] font-medium flex-shrink-0">
                        {isThisCorrect && (
                          <span className="text-positive font-semibold flex items-center space-x-1">
                            <span>Correct Answer</span>
                          </span>
                        )}
                        {wasChosen && !isThisCorrect && (
                          <span className="text-negative font-semibold">
                            Your Choice
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {q.explanation && (
                <div className="bg-surface rounded-xl p-3.5 border border-rule flex items-start space-x-2.5 text-xs text-ink-muted">
                  <Lightbulb className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-ink">Explanation: </span>
                    <span className="leading-relaxed">{q.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
