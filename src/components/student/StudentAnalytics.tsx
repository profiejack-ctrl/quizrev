import React from 'react';
import { useApp } from '../../context/AppContext';
import { calculateStudentAnalytics } from '../../lib/analytics';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  Clock, 
  BarChart2 
} from 'lucide-react';

export const StudentAnalytics: React.FC = () => {
  const { currentUser, attempts, subjects, setCurrentView } = useApp();

  if (!currentUser) return null;

  const analytics = calculateStudentAnalytics(currentUser.id, attempts, subjects);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8 pb-24 md:pb-12">
      {/* Title Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-ink">
          Performance & Improvement Analytics
        </h2>
        <p className="text-xs text-ink-muted mt-1">
          Quantitative revision insights, historical trends, and subject mastery ratings.
        </p>
      </div>

      {analytics.totalAttempts === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-border/60 mx-auto flex items-center justify-center text-ink-muted">
            <BarChart2 className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-base font-semibold text-ink">
            No Analytics Available Yet
          </h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
            Take at least one mock exam to generate your personalized improvement rating, subject breakdowns, and score curve.
          </p>
          <button
            onClick={() => setCurrentView('home')}
            className="px-4 py-2 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors inline-flex items-center space-x-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Take Your First Mock Exam</span>
          </button>
        </div>
      ) : (
        <>
          {/* 4 KPIs: Design-Taste Strict Anti-Slop (Type over tiles, no tinted circles) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Improvement Rating Card */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <span className="text-xs font-medium text-ink-muted">
                Improvement Rating
              </span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span
                  className={`font-serif text-3xl sm:text-4xl font-bold tabular-nums ${
                    analytics.improvementRating > 0
                      ? 'text-positive'
                      : analytics.improvementRating < 0
                      ? 'text-negative'
                      : 'text-ink'
                  }`}
                >
                  {analytics.improvementRating > 0 ? `+${analytics.improvementRating}%` : `${analytics.improvementRating}%`}
                </span>
                {analytics.improvementRating > 0 ? (
                  <TrendingUp className="w-4 h-4 text-positive flex-shrink-0" />
                ) : analytics.improvementRating < 0 ? (
                  <TrendingDown className="w-4 h-4 text-negative flex-shrink-0" />
                ) : (
                  <Minus className="w-4 h-4 text-ink-muted flex-shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-ink-muted mt-1 leading-tight">
                {analytics.totalAttempts >= 3
                  ? 'Latest 3 exams vs baseline'
                  : 'Relative to passing baseline'}
              </p>
            </div>

            {/* Average Score */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <span className="text-xs font-medium text-ink-muted">
                Average Score
              </span>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-ink tabular-nums mt-2">
                {analytics.averageScore}%
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Across {analytics.totalAttempts} total mock exams
              </p>
            </div>

            {/* Pass Rate */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <span className="text-xs font-medium text-ink-muted">
                Overall Pass Rate
              </span>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-ink tabular-nums mt-2">
                {analytics.overallPassRate}%
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Benchmark requirement: 70%+
              </p>
            </div>

            {/* Total Exam Time */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <span className="text-xs font-medium text-ink-muted">
                Total Revision Time
              </span>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-ink tabular-nums mt-2">
                {analytics.totalTimeSpentMinutes}
                <span className="text-lg font-sans font-normal text-ink-muted ml-1">min</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Active testing engagement
              </p>
            </div>
          </div>

          {/* Score Progression Trend Chart */}
          <div className="bg-ground border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-ink">
                  Exam Score Progression
                </h3>
                <p className="text-xs text-ink-muted">
                  Chronological test score timeline
                </p>
              </div>
              <span className="text-xs text-ink-muted tabular-nums">
                {analytics.scoreHistory.length} attempts recorded
              </span>
            </div>

            {/* Inline SVG Chart */}
            <div className="relative pt-6 pb-2">
              <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-rule">
                {analytics.scoreHistory.map((pt, idx) => {
                  const heightPercent = Math.max(10, Math.min(100, pt.percentage));
                  const isPass = pt.percentage >= 70;

                  return (
                    <div
                      key={pt.attemptId}
                      className="flex-1 flex flex-col items-center h-full justify-end group"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-ink text-white px-2 py-1 rounded mb-1 whitespace-nowrap pointer-events-none tabular-nums z-10">
                        {pt.percentage}% • {pt.quizTitle}
                      </div>

                      <span className="text-[10px] font-semibold text-ink-muted mb-1 tabular-nums">
                        {pt.percentage}%
                      </span>

                      {/* Bar */}
                      <div
                        className={`w-full max-w-[40px] rounded-t-lg transition-all ${
                          isPass
                            ? 'bg-accent group-hover:bg-accent-hover'
                            : 'bg-negative/70 group-hover:bg-negative'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />

                      {/* Date label */}
                      <span className="text-[10px] text-ink-muted mt-2 truncate w-full text-center">
                        {pt.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 70% passing guideline mark */}
              <div className="absolute top-[30%] left-0 right-0 border-b border-dashed border-border pointer-events-none flex justify-end">
                <span className="text-[9px] text-ink-subtle bg-ground px-1 -mt-2">
                  70% Pass Benchmark
                </span>
              </div>
            </div>
          </div>

          {/* Subject Mastery Breakdown */}
          <div className="bg-ground border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-serif text-lg font-semibold text-ink">
                Subject Breakdown & Readiness
              </h3>
              <p className="text-xs text-ink-muted">
                Identification of strongest domains and focus topics needing revision.
              </p>
            </div>

            <div className="space-y-4">
              {analytics.subjectBreakdown.map((sub) => {
                const statusColor =
                  sub.status === 'Mastered'
                    ? 'bg-positive-bg text-positive-ink border-positive/30'
                    : sub.status === 'Proficient'
                    ? 'bg-accent-light text-accent border-accent-border'
                    : 'bg-negative-bg text-negative-ink border-negative/30';

                return (
                  <div
                    key={sub.subjectId}
                    className="p-4 rounded-xl border border-border bg-surface/50 hover:bg-surface transition-colors space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: sub.subjectColor }}
                        />
                        <span className="font-medium text-sm text-ink">
                          {sub.subjectName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {sub.status}
                        </span>
                        <span className="text-xs font-bold text-ink tabular-nums">
                          {sub.averageScore}% avg
                        </span>
                        <span className="text-xs text-ink-muted">
                          ({sub.totalAttempts} {sub.totalAttempts === 1 ? 'attempt' : 'attempts'})
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${sub.averageScore}%`,
                          backgroundColor: sub.subjectColor,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                      <span>Pass Rate: <strong className="text-ink tabular-nums">{sub.passRate}%</strong></span>
                      <span>High: <strong className="text-ink tabular-nums">{sub.highestScore}%</strong> • Low: <strong className="text-ink tabular-nums">{sub.lowestScore}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
