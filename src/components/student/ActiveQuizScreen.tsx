import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Grid 
} from 'lucide-react';

export const ActiveQuizScreen: React.FC = () => {
  const {
    activeQuiz,
    sessionQuestions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    selectedAnswers,
    selectAnswer,
    flaggedQuestionIds,
    toggleFlag,
    remainingSeconds,
    submitExam,
    cancelExam,
  } = useApp();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isQuestionDrawerOpen, setIsQuestionDrawerOpen] = useState(false);

  if (!activeQuiz || sessionQuestions.length === 0) return null;

  const currentQuestion = sessionQuestions[currentQuestionIndex];
  const totalQuestions = sessionQuestions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = flaggedQuestionIds.length;

  // Format countdown timer (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = remainingSeconds <= 300; // < 5 mins
  const isCriticalTime = remainingSeconds <= 120; // < 2 mins

  const currentSelectedChoiceId = selectedAnswers[currentQuestion.id];
  const isCurrentFlagged = flaggedQuestionIds.includes(currentQuestion.id);

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinalSubmit = () => {
    setIsSubmitModalOpen(false);
    submitExam();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ground flex flex-col overflow-hidden">
      {/* 1. Clay Header Bar */}
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between bg-surface/90 backdrop-blur-md border-b border-white/80 shadow-clay-sm z-10">
        
        {/* Left: Exit button & Exam title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="clay-btn-neutral p-2 rounded-xl text-ink-muted hover:text-ink transition-transform active:scale-95"
            title="Exit Exam"
          >
            <X className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-sans text-sm sm:text-base font-bold text-ink line-clamp-1">
              {activeQuiz.title}
            </h1>
            <p className="text-[11px] text-ink-muted flex items-center space-x-1.5">
              <span className="font-medium text-accent">{activeQuiz.subjectName || 'Mock Exam'}</span>
              <span>•</span>
              <span className="tabular-nums">
                {answeredCount} of {totalQuestions} answered
              </span>
            </p>
          </div>
        </div>

        {/* Right: Timer & Question Overview Pill */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Question Grid Drawer Toggle */}
          <button
            onClick={() => setIsQuestionDrawerOpen(!isQuestionDrawerOpen)}
            className="clay-btn-neutral px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
            title="Overview all questions"
          >
            <Grid className="w-3.5 h-3.5 text-accent" />
            <span className="hidden xs:inline">Questions</span>
          </button>

          {/* Countdown Timer (Pillowy 3D Badge) */}
          <div
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tabular-nums tracking-wider shadow-clay-sm ${
              isCriticalTime
                ? 'bg-rose-50 border border-rose-300 text-rose-600 animate-pulse'
                : isLowTime
                ? 'bg-amber-50 border border-amber-300 text-amber-700'
                : 'clay-surface-pill text-accent border border-white/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Submit Action */}
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="clay-btn-teal px-4 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
          >
            Submit
          </button>
        </div>
      </header>

      {/* 2. Top Progress Bar Inset Trough */}
      <div className="px-4 sm:px-6 pt-3 pb-1">
        <div className="clay-inset-sm h-2.5 rounded-full overflow-hidden bg-[#e2e8f0]/70 p-0.5">
          <div
            className="bg-gradient-to-r from-teal-400 to-teal-600 h-full rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. Horizontal Question Quick-Tracker (Tactile Clay Thumb Scroll) */}
      <div className="px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-2 min-w-max py-1">
          {sessionQuestions.map((q, idx) => {
            const isAnswered = Boolean(selectedAnswers[q.id]);
            const isFlagged = flaggedQuestionIds.includes(q.id);
            const isCurrent = idx === currentQuestionIndex;

            let buttonClass = 'clay-surface-sm text-slate-500 hover:text-slate-900 border border-white/80';
            if (isCurrent) {
              buttonClass = 'clay-btn-teal scale-105 font-bold shadow-clay-sm';
            } else if (isAnswered) {
              buttonClass = 'clay-inset-sm bg-teal-50/70 text-accent font-bold border border-teal-200/50';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`relative w-8 h-8 rounded-xl text-xs flex items-center justify-center transition-all ${buttonClass}`}
              >
                <span>{idx + 1}</span>
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white shadow-xs" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Question & Choices Stage */}
      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 max-w-3xl mx-auto w-full flex flex-col justify-between">
        <div className="space-y-5">
          
          {/* Question Meta & Flag Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>

            <button
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isCurrentFlagged
                  ? 'clay-inset-sm bg-amber-50 text-amber-700 border border-amber-300/60 shadow-clay-inset'
                  : 'clay-btn-neutral text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{isCurrentFlagged ? 'Flagged for review' : 'Flag for review'}</span>
            </button>
          </div>

          {/* Question Text (Pillowy Clay Card) */}
          <div className="clay-surface p-6 sm:p-7 rounded-3xl space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-accent">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Question {currentQuestionIndex + 1}</span>
            </div>
            <h2 className="text-base sm:text-lg text-ink font-semibold leading-relaxed tracking-tight">
              {currentQuestion.questionText}
            </h2>
          </div>

          {/* Choices List with Tactile Press Inset */}
          <div className="space-y-3">
            {currentQuestion.choices.map((choice) => {
              const isSelected = currentSelectedChoiceId === choice.id;

              return (
                <button
                  key={choice.id}
                  onClick={() => selectAnswer(currentQuestion.id, choice.id)}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl flex items-start space-x-3.5 min-h-[58px] transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'clay-inset ring-2 ring-accent bg-teal-50/60 text-slate-900 shadow-clay-inset'
                      : 'clay-surface-sm text-slate-700 hover:text-slate-900 hover:scale-[1.008] active:scale-[0.99]'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-accent text-white shadow-clay-sm'
                        : 'clay-inset-sm text-slate-500 bg-[#eef2f7]'
                    }`}
                  >
                    {choice.label}
                  </span>
                  <span className="text-sm sm:text-base leading-relaxed pt-0.5 font-medium">
                    {choice.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Bottom Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-white/60 flex items-center justify-between safe-pb">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className={`clay-btn-neutral px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
              currentQuestionIndex === 0
                ? 'opacity-40 cursor-not-allowed text-ink-muted'
                : 'text-ink'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="clay-surface-pill px-4 py-1.5 text-xs font-bold text-slate-700 shadow-clay-sm">
            <span className="text-accent tabular-nums">{currentQuestionIndex + 1}</span>
            <span> / </span>
            <span className="tabular-nums">{totalQuestions}</span>
          </div>

          <button
            onClick={handleNext}
            className="clay-btn-teal px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5"
          >
            <span>{currentQuestionIndex === totalQuestions - 1 ? 'Review & Submit' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Question Drawer / Modal */}
      {isQuestionDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex justify-end">
          <div className="clay-surface w-full max-w-xs h-full p-5 flex flex-col justify-between shadow-clay-lg animate-in slide-in-from-right duration-200 rounded-none sm:rounded-l-3xl border-l border-white/80">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/60">
                <h3 className="font-sans text-base font-bold text-ink">
                  Question Overview
                </h3>
                <button
                  onClick={() => setIsQuestionDrawerOpen(false)}
                  className="clay-btn-neutral p-1.5 rounded-xl text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 my-4 text-[11px] text-ink-muted">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-teal-500/20 border border-teal-500" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-[#f4f7fb] border border-white/80 shadow-clay-sm" />
                  <span>Pending ({unansweredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500 border border-white" />
                  <span>Flagged ({flaggedCount})</span>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pt-2 p-1">
                {sessionQuestions.map((q, idx) => {
                  const isAnswered = Boolean(selectedAnswers[q.id]);
                  const isFlagged = flaggedQuestionIds.includes(q.id);
                  const isCurrent = idx === currentQuestionIndex;

                  let gridClass = 'clay-surface-sm text-slate-500';
                  if (isCurrent) {
                    gridClass = 'clay-btn-teal font-bold shadow-clay-sm';
                  } else if (isAnswered) {
                    gridClass = 'clay-inset-sm bg-teal-50/70 text-accent font-bold border border-teal-200/50';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setIsQuestionDrawerOpen(false);
                      }}
                      className={`relative h-10 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${gridClass}`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setIsQuestionDrawerOpen(false);
                setIsSubmitModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl clay-btn-teal text-white text-xs font-bold"
            >
              Submit Exam Now
            </button>
          </div>
        </div>
      )}

      {/* Review & Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="clay-surface rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-clay-lg space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-500/15 text-accent flex items-center justify-center shadow-clay-sm">
                <CheckCircle2 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-sans text-lg font-bold text-ink">
                  Submit Mock Exam?
                </h3>
                <p className="text-xs text-ink-muted">
                  Review your completion before final score submission.
                </p>
              </div>
            </div>

            <div className="clay-inset rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Questions Answered:</span>
                <span className="font-bold text-ink tabular-nums">
                  {answeredCount} of {totalQuestions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Unanswered Questions:</span>
                <span
                  className={`font-bold tabular-nums ${
                    unansweredCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {unansweredCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Flagged for Review:</span>
                <span className="font-bold text-amber-600 tabular-nums">
                  {flaggedCount}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-300/60 pt-2">
                <span className="text-ink-muted">Remaining Time:</span>
                <span className="font-bold text-ink tabular-nums">
                  {formatTime(remainingSeconds)}
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="flex items-start space-x-2.5 p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200 text-amber-900 text-xs shadow-clay-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  You still have <strong className="tabular-nums">{unansweredCount}</strong> unanswered questions. Unanswered items will receive 0 points.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="clay-btn-neutral px-4 py-2 rounded-xl text-xs font-semibold text-ink"
              >
                Return to Exam
              </button>
              <button
                onClick={handleFinalSubmit}
                className="clay-btn-teal px-5 py-2 rounded-xl text-xs font-bold text-white"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Exam Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="clay-surface rounded-3xl w-full max-w-sm p-6 shadow-clay-lg space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center shadow-clay-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans text-base font-bold text-ink">
                  Leave Exam?
                </h3>
                <p className="text-xs text-ink-muted">
                  Your answers will not be recorded.
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Are you sure you want to quit this mock exam session? You can retake it anytime.
            </p>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="clay-btn-neutral px-4 py-2 rounded-xl text-xs font-semibold text-ink"
              >
                Continue Exam
              </button>
              <button
                onClick={cancelExam}
                className="clay-btn-coral px-4 py-2 rounded-xl text-white text-xs font-bold"
              >
                Exit Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
