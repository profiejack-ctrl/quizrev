import { QuizAttempt, Subject, StudentAnalyticsData, SubjectAnalytics } from '../types/quiz';

/**
 * Computes deep student analytics, performance trends, and improvement ratings
 */
export function calculateStudentAnalytics(
  studentId: string,
  allAttempts: QuizAttempt[],
  subjects: Subject[]
): StudentAnalyticsData {
  const studentAttempts = allAttempts
    .filter(a => a.studentId === studentId)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  if (studentAttempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      overallPassRate: 0,
      totalTimeSpentMinutes: 0,
      improvementRating: 0,
      recentTrend: 'steady',
      subjectBreakdown: [],
      scoreHistory: [],
    };
  }

  const totalAttempts = studentAttempts.length;
  const totalScorePct = studentAttempts.reduce((acc, curr) => acc + curr.percentage, 0);
  const averageScore = Math.round((totalScorePct / totalAttempts) * 10) / 10;
  
  const passedCount = studentAttempts.filter(a => a.passed).length;
  const overallPassRate = Math.round((passedCount / totalAttempts) * 100);

  const totalTimeSeconds = studentAttempts.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);
  const totalTimeSpentMinutes = Math.round(totalTimeSeconds / 60);

  // Improvement Rating Calculation
  // We compare the student's latest 3 attempts with their initial baseline attempts
  let improvementRating = 0;
  let recentTrend: 'improving' | 'steady' | 'declining' = 'steady';

  if (studentAttempts.length >= 3) {
    const recentBatch = studentAttempts.slice(-3);
    const earlierBatch = studentAttempts.slice(0, Math.max(1, studentAttempts.length - 3));
    
    const recentAvg = recentBatch.reduce((sum, a) => sum + a.percentage, 0) / recentBatch.length;
    const earlierAvg = earlierBatch.reduce((sum, a) => sum + a.percentage, 0) / earlierBatch.length;
    
    improvementRating = Math.round((recentAvg - earlierAvg) * 10) / 10;
  } else if (studentAttempts.length === 2) {
    improvementRating = Math.round((studentAttempts[1].percentage - studentAttempts[0].percentage) * 10) / 10;
  } else if (studentAttempts.length === 1) {
    // Relative to standard 70% passing benchmark
    improvementRating = Math.round((studentAttempts[0].percentage - 70) * 10) / 10;
  }

  if (improvementRating > 0.5) recentTrend = 'improving';
  else if (improvementRating < -0.5) recentTrend = 'declining';
  else recentTrend = 'steady';

  // Subject-level breakdown
  const subjectMap = new Map<string, QuizAttempt[]>();
  studentAttempts.forEach(attempt => {
    const list = subjectMap.get(attempt.subjectId) || [];
    list.push(attempt);
    subjectMap.set(attempt.subjectId, list);
  });

  const subjectBreakdown: SubjectAnalytics[] = [];

  subjects.forEach(subject => {
    const attempts = subjectMap.get(subject.id);
    if (!attempts || attempts.length === 0) return;

    const subTotal = attempts.length;
    const scores = attempts.map(a => a.percentage);
    const avg = Math.round((scores.reduce((a, b) => a + b, 0) / subTotal) * 10) / 10;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passCount = attempts.filter(a => a.passed).length;
    const passRate = Math.round((passCount / subTotal) * 100);

    let status: 'Mastered' | 'Proficient' | 'Needs Review' = 'Proficient';
    if (avg >= 85) status = 'Mastered';
    else if (avg < 70) status = 'Needs Review';

    subjectBreakdown.push({
      subjectId: subject.id,
      subjectName: subject.name,
      subjectColor: subject.color,
      totalAttempts: subTotal,
      averageScore: avg,
      highestScore: highest,
      lowestScore: lowest,
      passRate,
      status,
    });
  });

  // Score History for visualization
  const scoreHistory = studentAttempts.map(a => ({
    attemptId: a.id,
    quizTitle: a.quizTitle,
    date: new Date(a.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: a.score,
    percentage: a.percentage,
    subjectName: a.subjectName,
  }));

  return {
    totalAttempts,
    averageScore,
    overallPassRate,
    totalTimeSpentMinutes,
    improvementRating,
    recentTrend,
    subjectBreakdown,
    scoreHistory,
  };
}
