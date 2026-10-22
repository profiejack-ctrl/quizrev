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
          colors: ['#0d9488', '#059669', '#f4f7fb'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [latestAttempt]);

  if (!latestAttempt) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-ink-muted text-sm font-medium">No exam attempt found.</p>
        <button
          onClick={() => setCurrentView('home')}
          className="clay-btn-teal px-5 py-2.5 rounded-xl text-xs font-bold"
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
          className="clay-btn-neutral px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-4 h-4 text-accent" />
          <span>All Mock Exams</span>
        </button>

        <span className="clay-surface-pill px-3 py-1 text-xs font-medium text-slate-500 shadow-clay-sm">
          Completed {new Date(latestAttempt.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Main Score Hero Card */}
      <div className="clay-surface p-6 sm:p-8 rounded-3xl text-center space-y-6 shadow-clay">
        {/* Status Pill */}
        <div className="inline-flex items-center justify-center">
          <span
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase flex items-center space-x-1.5 shadow-clay-sm ${
              latestAttempt.passed
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-rose-50 text-rose-700 border border-rose-300'
            }`}
          >
            {latestAttempt.passed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Passed Mock Exam</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Needs Improvement</span>
              </>
            )}
          </span>
        </div>

        {/* 3D Clay Score Medallion */}
        <div className="relative mx-auto w-36 h-36 sm:w-44 sm:h-44 rounded-full clay-surface flex items-center justify-center shadow-clay-lg">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full clay-inset flex flex-col items-center justify-center">
            <span className="font-sans text-4xl sm:text-5xl font-black tracking-tight text-slate-800 tabular-nums">
              {latestAttempt.percentage}%
            </span>
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider mt-0.5">
              Accuracy
            </span>
          </div>
        </div>

        <div>
          <h2 className="font-sans text-lg sm:text-xl font-bold text-ink tracking-tight">
            {latestAttempt.quizTitle}
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {latestAttempt.subjectName}
          </p>
        </div>

        {/* 3 Metric Clay Tiles */}
        <div className="grid grid-cols-3 gap-3 pt-2 max-w-md mx-auto text-center">
          <div className="clay-surface-sm p-3.5 rounded-2xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Score</p>
            <p className="text-base sm:text-lg font-black text-slate-800 tabular-nums mt-0.5">
              {latestAttempt.correctAnswers} / {latestAttempt.totalQuestions}
            </p>
          </div>

          <div className="clay-surface-sm p-3.5 rounded-2xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Time</p>
            <p className="text-base sm:text-lg font-black text-slate-800 tabular-nums mt-0.5">
              {formatSeconds(latestAttempt.timeSpentSeconds)}
            </p>
          </div>

          <div className="clay-surface-sm p-3.5 rounded-2xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pass Req.</p>
            <p className="text-base sm:text-lg font-black text-slate-800 tabular-nums mt-0.5">
              70%
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRetake}
            className="clay-btn-teal px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake This Exam</span>
          </button>

          <button
            onClick={() => setCurrentView('analytics')}
            className="clay-btn-neutral px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1.5"
          >
            <BarChart2 className="w-3.5 h-3.5 text-accent" />
            <span>View Progress & Analytics</span>
          </button>
        </div>
      </div>

      {/* Question Breakdown Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h3 className="font-sans text-lg font-bold text-ink">
            Question Review & Answer Key
          </h3>
          <p className="text-xs text-ink-muted">
            Detailed breakdown of your answers and comprehensive explanations.
          </p>
        </div>
        <span className="clay-surface-pill px-3 py-1 text-xs font-bold text-accent tabular-nums shadow-clay-sm">
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
              className={`clay-surface p-5 sm:p-6 rounded-3xl transition-all space-y-3.5 ${
                isUserCorrect
                  ? 'border-white/80'
                  : 'border-rose-200/80 shadow-clay-sm'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums shadow-clay-sm ${
                      isUserCorrect
                        ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-300/60'
                        : 'bg-rose-500/15 text-rose-700 border border-rose-300/60'
                    }`}
                  >
                    {qIdx + 1}
                  </span>
                  <span className={`text-xs font-bold ${isUserCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isUserCorrect ? 'Correct (+1 pt)' : 'Incorrect (0 pt)'}
                  </span>
                </div>

                {isUserCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
              </div>

              {/* Question Text */}
              <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
                {q.questionText}
              </p>

              {/* Choices Review */}
              <div className="space-y-2.5">
                {q.choices.map((choice) => {
                  const wasChosen = userChoiceId === choice.id;
                  const isThisCorrect = choice.isCorrect;

                  let choiceClass = 'clay-surface-sm p-3 sm:p-3.5 rounded-xl text-xs flex items-center justify-between text-slate-700';

                  if (isThisCorrect) {
                    choiceClass = 'clay-inset-sm p-3 sm:p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/70 text-emerald-950 font-semibold text-xs flex items-center justify-between';
                  } else if (wasChosen && !isThisCorrect) {
                    choiceClass = 'clay-inset-sm p-3 sm:p-3.5 rounded-xl border border-rose-300 bg-rose-50/70 text-rose-900 font-semibold text-xs flex items-center justify-between line-through';
                  }

                  return (
                    <div
                      key={choice.id}
                      className={choiceClass}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="font-black text-slate-600">{choice.label}.</span>
                        <span>{choice.text}</span>
                      </div>

                      <div className="text-[11px] font-bold flex-shrink-0 ml-2">
                        {isThisCorrect && (
                          <span className="text-emerald-700 flex items-center space-x-1">
                            <span>Correct Answer</span>
                          </span>
                        )}
                        {wasChosen && !isThisCorrect && (
                          <span className="text-rose-700">
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
                <div className="clay-inset-sm rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-700">
                  <Lightbulb className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Explanation: </span>
                    <span className="leading-relaxed font-medium">{q.explanation}</span>
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
