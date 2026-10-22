import React, { useEffect } from 'react';
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
  BarChart2,
  RefreshCw 
} from 'lucide-react';

export const StudentAnalytics: React.FC = () => {
  const { currentUser, attempts, subjects, setCurrentView, refreshFromSupabase, isSyncingWithSupabase } = useApp();

  useEffect(() => {
    refreshFromSupabase();
  }, []);

  if (!currentUser) return null;

  const analytics = calculateStudentAnalytics(currentUser.id, attempts, subjects);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8 pb-24 md:pb-12">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-2xl font-bold text-ink">
            Performance & Improvement Analytics
          </h2>
          <p className="text-xs text-ink-muted mt-1">
            Quantitative revision insights, historical trends, and subject mastery ratings.
          </p>
        </div>
        <button
          onClick={() => refreshFromSupabase()}
          disabled={isSyncingWithSupabase}
          title="Refresh analytics from database"
          className="clay-btn-neutral p-2 rounded-xl text-slate-600 hover:text-slate-900 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncingWithSupabase ? 'animate-spin text-accent' : ''}`} />
        </button>
      </div>

      {analytics.totalAttempts === 0 ? (
        <div className="clay-surface p-12 text-center rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl clay-inset flex items-center justify-center text-slate-400 mx-auto">
            <BarChart2 className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-sans text-base font-bold text-ink">
            No Analytics Available Yet
          </h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
            Take at least one mock exam to generate your personalized improvement rating, subject breakdowns, and score curve.
          </p>
          <button
            onClick={() => setCurrentView('home')}
            className="clay-btn-teal px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Take Your First Mock Exam</span>
          </button>
        </div>
      ) : (
        <>
          {/* 4 Tactile Clay KPI Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Improvement Rating Card */}
            <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Improvement
              </span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span
                  className={`font-sans text-3xl sm:text-4xl font-black tabular-nums ${
                    analytics.improvementRating > 0
                      ? 'text-emerald-700'
                      : analytics.improvementRating < 0
                      ? 'text-rose-700'
                      : 'text-slate-800'
                  }`}
                >
                  {analytics.improvementRating > 0 ? `+${analytics.improvementRating}%` : `${analytics.improvementRating}%`}
                </span>
                {analytics.improvementRating > 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : analytics.improvementRating < 0 ? (
                  <TrendingDown className="w-5 h-5 text-rose-600 flex-shrink-0" />
                ) : (
                  <Minus className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-[11px] font-medium text-ink-muted mt-1 leading-tight">
                {analytics.totalAttempts >= 3
                  ? 'Latest 3 exams vs baseline'
                  : 'Relative to passing baseline'}
              </p>
            </div>

            {/* Average Score */}
            <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Avg. Score
              </span>
              <div className="font-sans text-3xl sm:text-4xl font-black text-slate-800 tabular-nums mt-2">
                {analytics.averageScore}%
              </div>
              <p className="text-[11px] font-medium text-ink-muted mt-1">
                Across {analytics.totalAttempts} total mock exams
              </p>
            </div>

            {/* Pass Rate */}
            <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pass Rate
              </span>
              <div className="font-sans text-3xl sm:text-4xl font-black text-slate-800 tabular-nums mt-2">
                {analytics.overallPassRate}%
              </div>
              <p className="text-[11px] font-medium text-ink-muted mt-1">
                Benchmark: 70%+
              </p>
            </div>

            {/* Total Exam Time */}
            <div className="clay-surface p-5 sm:p-6 rounded-3xl hover:scale-[1.01] transition-transform">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Revision Time
              </span>
              <div className="font-sans text-3xl sm:text-4xl font-black text-slate-800 tabular-nums mt-2">
                {analytics.totalTimeSpentMinutes}
                <span className="text-base font-sans font-bold text-slate-500 ml-1">min</span>
              </div>
              <p className="text-[11px] font-medium text-ink-muted mt-1">
                Active study time
              </p>
            </div>
          </div>

          {/* Score Progression Trend Chart */}
          <div className="clay-surface p-6 sm:p-7 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans text-lg font-bold text-ink">
                  Exam Score Progression
                </h3>
                <p className="text-xs text-ink-muted">
                  Chronological test score timeline
                </p>
              </div>
              <span className="clay-surface-pill px-3 py-1 text-xs font-bold text-accent tabular-nums shadow-clay-sm">
                {analytics.scoreHistory.length} attempts recorded
              </span>
            </div>

            {/* Inset Chart Stage */}
            <div className="clay-inset rounded-2xl p-4 sm:p-6 relative pt-8">
              <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-300/60">
                {analytics.scoreHistory.map((pt) => {
                  const heightPercent = Math.max(10, Math.min(100, pt.percentage));
                  const isPass = pt.percentage >= 70;

                  return (
                    <div
                      key={pt.attemptId}
                      className="flex-1 flex flex-col items-center h-full justify-end group"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white font-medium px-2 py-1 rounded-lg mb-1 whitespace-nowrap pointer-events-none tabular-nums z-10 shadow-clay-sm">
                        {pt.percentage}% • {pt.quizTitle}
                      </div>

                      <span className="text-[10px] font-bold text-slate-600 mb-1 tabular-nums">
                        {pt.percentage}%
                      </span>

                      {/* Tactile Bar */}
                      <div
                        className={`w-full max-w-[40px] rounded-t-xl transition-all shadow-sm ${
                          isPass
                            ? 'bg-gradient-to-t from-teal-500 to-teal-400 group-hover:from-teal-600 group-hover:to-teal-500'
                            : 'bg-gradient-to-t from-rose-500 to-rose-400 group-hover:from-rose-600 group-hover:to-rose-500'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />

                      {/* Date label */}
                      <span className="text-[10px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                        {pt.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 70% passing guideline mark */}
              <div className="absolute top-[34%] left-0 right-0 border-b border-dashed border-slate-400/50 pointer-events-none flex justify-end px-4">
                <span className="clay-surface-pill px-2 py-0.5 text-[9px] font-bold text-slate-500 -mt-2.5 shadow-clay-sm">
                  70% Pass Benchmark
                </span>
              </div>
            </div>
          </div>

          {/* Subject Mastery Breakdown */}
          <div className="clay-surface p-6 sm:p-7 rounded-3xl space-y-5">
            <div>
              <h3 className="font-sans text-lg font-bold text-ink">
                Subject Breakdown & Readiness
              </h3>
              <p className="text-xs text-ink-muted">
                Identification of strongest domains and focus topics needing revision.
              </p>
            </div>

            <div className="space-y-3.5">
              {analytics.subjectBreakdown.map((sub) => {
                const statusColor =
                  sub.status === 'Mastered'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : sub.status === 'Proficient'
                    ? 'bg-teal-50 text-teal-700 border-teal-300'
                    : 'bg-rose-50 text-rose-700 border-rose-300';

                return (
                  <div
                    key={sub.subjectId}
                    className="clay-surface-sm p-4 sm:p-5 rounded-2xl space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3 h-3 rounded-full shadow-xs"
                          style={{ backgroundColor: sub.subjectColor }}
                        />
                        <span className="font-bold text-sm text-ink">
                          {sub.subjectName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-clay-sm ${statusColor}`}>
                          {sub.status}
                        </span>
                        <span className="text-xs font-bold text-ink tabular-nums">
                          {sub.averageScore}% avg
                        </span>
                        <span className="text-xs font-medium text-ink-muted">
                          ({sub.totalAttempts} {sub.totalAttempts === 1 ? 'attempt' : 'attempts'})
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Inset Trough */}
                    <div className="clay-inset-sm w-full rounded-full h-3 overflow-hidden p-0.5 bg-[#e2e8f0]/70">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{
                          width: `${sub.averageScore}%`,
                          backgroundColor: sub.subjectColor || '#0d9488',
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-0.5">
                      <span>Pass Rate: <strong className="text-slate-800 tabular-nums font-bold">{sub.passRate}%</strong></span>
                      <span>High: <strong className="text-slate-800 tabular-nums font-bold">{sub.highestScore}%</strong> • Low: <strong className="text-slate-800 tabular-nums font-bold">{sub.lowestScore}%</strong></span>
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
