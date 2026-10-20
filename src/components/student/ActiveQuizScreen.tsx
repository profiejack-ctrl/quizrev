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
      {/* 1. Header Bar */}
      <header className="h-14 sm:h-16 border-b border-border px-4 sm:px-6 flex items-center justify-between bg-surface/80 backdrop-blur-md">
        
        {/* Left: Exit button & Exam title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="p-1.5 rounded-full hover:bg-ground border border-border text-ink-muted hover:text-ink transition-colors"
            title="Exit Exam"
          >
            <X className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif text-sm sm:text-base font-semibold text-ink line-clamp-1">
              {activeQuiz.title}
            </h1>
            <p className="text-[11px] text-ink-muted flex items-center space-x-1.5">
              <span>{activeQuiz.subjectName || 'Mock Exam'}</span>
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
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-control text-xs font-medium border border-border bg-ground hover:bg-surface text-ink transition-all"
            title="Overview all questions"
          >
            <Grid className="w-3.5 h-3.5 text-ink-muted" />
            <span className="hidden xs:inline">Questions</span>
          </button>

          {/* Countdown Timer */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-control border text-xs font-semibold tabular-nums tracking-wider transition-colors ${
              isCriticalTime
                ? 'bg-negative-bg border-negative text-negative animate-pulse'
                : isLowTime
                ? 'bg-warning-bg border-warning text-warning'
                : 'bg-ground border-border text-ink'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Submit Action */}
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-3.5 py-1.5 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            Submit
          </button>
        </div>
      </header>

      {/* 2. Top Progress Bar */}
      <div className="w-full bg-border h-1">
        <div
          className="bg-accent h-1 transition-all duration-300"
          style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
        />
      </div>

      {/* 3. Horizontal Question Quick-Tracker (Thumb-friendly mobile scroll) */}
      <div className="bg-ground border-b border-rule px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1.5 min-w-max">
          {sessionQuestions.map((q, idx) => {
            const isAnswered = Boolean(selectedAnswers[q.id]);
            const isFlagged = flaggedQuestionIds.includes(q.id);
            const isCurrent = idx === currentQuestionIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`relative w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'ring-2 ring-accent ring-offset-1 bg-accent text-white font-semibold'
                    : isAnswered
                    ? 'bg-accent-light text-accent border border-accent-border font-medium'
                    : 'bg-surface text-ink-muted border border-border hover:border-control'
                }`}
              >
                <span>{idx + 1}</span>
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-warning border border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Question & Choices Stage */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 max-w-3xl mx-auto w-full flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Question Meta & Flag Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>

            <button
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-control text-xs font-medium border transition-all ${
                isCurrentFlagged
                  ? 'bg-warning-bg border-warning/60 text-warning-ink font-semibold'
                  : 'bg-surface border-border text-ink-muted hover:text-ink hover:bg-ground'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-warning text-warning' : ''}`} />
              <span>{isCurrentFlagged ? 'Flagged' : 'Flag for review'}</span>
            </button>
          </div>

          {/* Question Text */}
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-7">
            <h2 className="text-base sm:text-lg text-ink font-medium leading-relaxed">
              {currentQuestion.questionText}
            </h2>
          </div>

          {/* Choices List */}
          <div className="space-y-3">
            {currentQuestion.choices.map((choice) => {
              const isSelected = currentSelectedChoiceId === choice.id;

              return (
                <button
                  key={choice.id}
                  onClick={() => selectAnswer(currentQuestion.id, choice.id)}
                  className={`w-full text-left p-4 sm:p-5 rounded-xl border transition-all flex items-start space-x-3.5 min-h-[56px] active:scale-[0.99] ${
                    isSelected
                      ? 'border-accent bg-accent-light/50 ring-1 ring-accent text-ink shadow-sm'
                      : 'border-border bg-ground hover:border-control hover:bg-surface text-ink'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-accent text-white'
                        : 'bg-surface border border-border text-ink-muted'
                    }`}
                  >
                    {choice.label}
                  </span>
                  <span className="text-sm sm:text-base leading-relaxed pt-0.5">
                    {choice.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Bottom Navigation Bar */}
        <div className="mt-8 pt-4 border-t border-border flex items-center justify-between safe-pb">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2.5 rounded-control border border-border text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              currentQuestionIndex === 0
                ? 'opacity-40 cursor-not-allowed text-ink-muted'
                : 'bg-ground hover:bg-surface text-ink'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="text-xs text-ink-muted">
            <span className="font-semibold text-ink tabular-nums">{currentQuestionIndex + 1}</span>
            <span> / </span>
            <span className="tabular-nums">{totalQuestions}</span>
          </div>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
          >
            <span>{currentQuestionIndex === totalQuestions - 1 ? 'Review & Submit' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Question Drawer / Modal */}
      {isQuestionDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex justify-end">
          <div className="bg-ground w-full max-w-xs h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="font-serif text-base font-semibold text-ink">
                  Question Overview
                </h3>
                <button
                  onClick={() => setIsQuestionDrawerOpen(false)}
                  className="p-1 rounded-full text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 my-4 text-[11px] text-ink-muted">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-accent-light border border-accent-border" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-surface border border-border" />
                  <span>Unanswered ({unansweredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-warning border border-white" />
                  <span>Flagged ({flaggedCount})</span>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pt-2">
                {sessionQuestions.map((q, idx) => {
                  const isAnswered = Boolean(selectedAnswers[q.id]);
                  const isFlagged = flaggedQuestionIds.includes(q.id);
                  const isCurrent = idx === currentQuestionIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setIsQuestionDrawerOpen(false);
                      }}
                      className={`relative h-10 rounded-xl text-xs font-medium flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'ring-2 ring-accent bg-accent text-white font-bold'
                          : isAnswered
                          ? 'bg-accent-light text-accent border border-accent-border'
                          : 'bg-surface text-ink-muted border border-border'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-warning border border-white" />
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
              className="w-full py-2.5 rounded-control bg-accent text-white text-xs font-medium"
            >
              Submit Exam Now
            </button>
          </div>
        </div>
      )}

      {/* Review & Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-ground border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light text-accent flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-ink">
                  Submit Mock Exam?
                </h3>
                <p className="text-xs text-ink-muted">
                  Review your completion before final submission.
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-4 border border-border space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Questions Answered:</span>
                <span className="font-semibold text-ink tabular-nums">
                  {answeredCount} of {totalQuestions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Unanswered Questions:</span>
                <span
                  className={`font-semibold tabular-nums ${
                    unansweredCount > 0 ? 'text-negative' : 'text-positive'
                  }`}
                >
                  {unansweredCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Flagged for Review:</span>
                <span className="font-semibold text-warning tabular-nums">
                  {flaggedCount}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-rule pt-2">
                <span className="text-ink-muted">Remaining Time:</span>
                <span className="font-semibold text-ink tabular-nums">
                  {formatTime(remainingSeconds)}
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  You still have <strong className="tabular-nums">{unansweredCount}</strong> unanswered questions. Unanswered items will receive 0 points.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-control border border-border text-xs font-medium text-ink hover:bg-surface transition-colors"
              >
                Return to Exam
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-sm"
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
          <div className="bg-ground border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-negative-bg text-negative flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-ink">
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

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-3.5 py-1.5 rounded-control border border-border text-xs font-medium text-ink hover:bg-surface"
              >
                Continue Exam
              </button>
              <button
                onClick={cancelExam}
                className="px-4 py-1.5 rounded-control bg-negative text-white text-xs font-medium hover:bg-negative/90"
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
