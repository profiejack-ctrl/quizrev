import { getSupabaseClient } from './supabase';
import { generateUuid, ensureUuid } from './uuid';
import { Subject, Quiz, Question, QuestionChoice, UserProfile, QuizAttempt } from '../types/quiz';

export interface SupabaseSyncResult {
  subjects: Subject[];
  profiles: UserProfile[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
}

/**
 * Pings Supabase to verify connection and credentials
 */
export async function testSupabaseConnection(
  url?: string,
  anonKey?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, message: 'Please enter a valid Supabase URL and Anon Key.' };
    }

    const { error } = await supabase.from('subjects').select('id', { head: true, count: 'exact' });
    if (error) {
      return { success: false, message: `Supabase Error: ${error.message}` };
    }

    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed.' };
  }
}

/**
 * Loads all data from Supabase tables
 */
export async function fetchAllFromSupabase(): Promise<SupabaseSyncResult | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // 1. Fetch Subjects (Don't abort if this fails or is empty!)
    const { data: dbSubjects, error: subError } = await supabase
      .from('subjects')
      .select('*');

    if (subError) {
      console.warn('[QuizRev] Supabase fetch subjects error:', subError.message);
    }

    const subjects: Subject[] = (dbSubjects || []).map((s: any) => ({
      id: String(s.id),
      name: s.name,
      code: s.code,
      description: s.description || '',
      color: s.color || '#1b6e66',
    }));

    const subjectMap = new Map<string, Subject>();
    subjects.forEach(s => subjectMap.set(s.id, s));

    // 2. Fetch Profiles
    const { data: dbProfiles, error: profError } = await supabase.from('profiles').select('*');
    if (profError) {
      console.warn('[QuizRev] Supabase fetch profiles error:', profError.message);
    }
    const profiles: UserProfile[] = (dbProfiles || []).map((p: any) => ({
      id: String(p.id),
      email: p.email,
      fullName: p.full_name || p.fullName || 'User',
      studentId: p.student_id || p.studentId || undefined,
      role: (p.role === 'teacher' ? 'teacher' : 'student') as 'teacher' | 'student',
      avatarUrl: p.avatar_url || p.avatarUrl || undefined,
      createdAt: p.created_at || new Date().toISOString(),
      password: p.password || (p.role === 'teacher' ? 'admin123' : 'student123'),
    }));

    // 3. Fetch Quizzes, Questions, and Question Choices
    const { data: dbQuizzes, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (quizError) {
      console.warn('[QuizRev] Supabase fetch quizzes error:', quizError.message);
    }

    const { data: dbQuestions, error: questError } = await supabase
      .from('questions')
      .select('*')
      .order('order_index', { ascending: true });

    if (questError) {
      console.warn('[QuizRev] Supabase fetch questions error:', questError.message);
    }

    const { data: dbChoices, error: choiceError } = await supabase
      .from('question_choices')
      .select('*')
      .order('order_index', { ascending: true });

    if (choiceError) {
      console.warn('[QuizRev] Supabase fetch choices error:', choiceError.message);
    }

    // Group choices by question_id
    const choicesByQuestion = new Map<string, QuestionChoice[]>();
    (dbChoices || []).forEach((c: any) => {
      const qId = String(c.question_id);
      if (!choicesByQuestion.has(qId)) {
        choicesByQuestion.set(qId, []);
      }
      choicesByQuestion.get(qId)!.push({
        id: String(c.id),
        label: c.choice_label || c.label || 'A',
        text: c.choice_text || c.text || '',
        isCorrect: Boolean(c.is_correct ?? c.isCorrect),
      });
    });

    // Group questions by quiz_id
    const questionsByQuiz = new Map<string, Question[]>();
    (dbQuestions || []).forEach((q: any) => {
      const quizId = String(q.quiz_id);
      if (!questionsByQuiz.has(quizId)) {
        questionsByQuiz.set(quizId, []);
      }
      const qId = String(q.id);
      questionsByQuiz.get(quizId)!.push({
        id: qId,
        orderIndex: Number(q.order_index) || 1,
        questionText: q.question_text || q.questionText || '',
        points: Number(q.points) || 1,
        explanation: q.explanation || undefined,
        choices: choicesByQuestion.get(qId) || [],
      });
    });

    // Assemble Quizzes
    const quizzes: Quiz[] = (dbQuizzes || []).map((q: any) => {
      const qId = String(q.id);
      const subId = String(q.subject_id);
      const sub = subjectMap.get(subId);
      const quizQuestions = questionsByQuiz.get(qId) || [];

      return {
        id: qId,
        subjectId: subId,
        subjectName: sub?.name || 'General',
        subjectColor: sub?.color || '#1b6e66',
        title: q.title || 'Mock Exam',
        description: q.description || '',
        durationMinutes: Number(q.duration_minutes) || 25,
        passingPercentage: Number(q.passing_percentage) || 70,
        shuffleQuestions: Boolean(q.shuffle_questions),
        shuffleChoices: Boolean(q.shuffle_choices),
        questions: quizQuestions,
        totalQuestions: quizQuestions.length,
        sourceFilename: q.source_filename || undefined,
        sourceFormat: q.source_format || 'manual',
        isPublished: Boolean(q.is_published ?? true),
        createdAt: q.created_at || new Date().toISOString(),
      };
    });

    // 4. Fetch Attempts and Student Answers
    const { data: dbAttempts, error: attError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .order('created_at', { ascending: false });

    if (attError) {
      console.warn('[QuizRev] Supabase fetch attempts error:', attError.message);
    }

    const { data: dbAnswers } = await supabase
      .from('student_answers')
      .select('*');

    // Group student answers by attempt_id: attempt_id -> { [question_id]: selected_choice_id }
    const answersByAttempt = new Map<string, Record<string, string>>();
    (dbAnswers || []).forEach((ans: any) => {
      const attId = String(ans.attempt_id);
      if (!answersByAttempt.has(attId)) {
        answersByAttempt.set(attId, {});
      }
      if (ans.question_id && ans.selected_choice_id) {
        answersByAttempt.get(attId)![String(ans.question_id)] = String(ans.selected_choice_id);
      }
    });

    const quizMap = new Map<string, Quiz>();
    quizzes.forEach(q => quizMap.set(q.id, q));

    const profileMap = new Map<string, UserProfile>();
    profiles.forEach(p => profileMap.set(p.id, p));

    const attempts: QuizAttempt[] = (dbAttempts || []).map((a: any) => {
      const attId = String(a.id);
      const quizId = String(a.quiz_id);
      const targetQuiz = quizMap.get(quizId);
      const student = profileMap.get(String(a.student_id));

      return {
        id: attId,
        quizId,
        quizTitle: targetQuiz?.title || 'Mock Exam',
        subjectId: targetQuiz?.subjectId || '',
        subjectName: targetQuiz?.subjectName || 'General',
        studentId: String(a.student_id),
        studentName: student?.fullName || 'Student',
        startedAt: a.started_at || a.created_at || new Date().toISOString(),
        completedAt: a.completed_at || new Date().toISOString(),
        timeSpentSeconds: Number(a.time_spent_seconds) || 60,
        totalQuestions: Number(a.total_questions) || (targetQuiz?.questions.length || 0),
        correctAnswers: Number(a.correct_answers) || Number(a.score) || 0,
        score: Number(a.score) || 0,
        percentage: Number(a.percentage) || 0,
        passed: Boolean(a.passed),
        answers: answersByAttempt.get(attId) || {},
      };
    });

    console.info(`[QuizRev] Fetched from Supabase: ${quizzes.length} exams, ${subjects.length} subjects, ${attempts.length} attempts, ${profiles.length} profiles.`);
    return { subjects, profiles, quizzes, attempts };
  } catch (err: any) {
    console.warn('[QuizRev] Failed to load from Supabase:', err);
    return null;
  }
}

/**
 * Saves or updates a quiz and its questions & choices in Supabase
 */
export async function saveQuizToSupabase(
  quiz: Quiz,
  subjectInfo?: Subject
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client is not connected.' };
  }

  try {
    const quizId = quiz.id;

    // 0. Auto-ensure subject exists in Supabase so foreign key constraint quizzes_subject_id_fkey is satisfied!
    try {
      const subjectToUpsert = subjectInfo || {
        id: quiz.subjectId,
        name: quiz.subjectName || 'General Science',
        code: (quiz.subjectName || 'GEN').substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'SUB',
        description: 'Auto-synchronized subject for ' + quiz.title,
        color: quiz.subjectColor || '#1b6e66',
      };

      const { error: subErr } = await supabase.from('subjects').upsert({
        id: subjectToUpsert.id,
        name: subjectToUpsert.name,
        code: subjectToUpsert.code,
        description: subjectToUpsert.description || '',
        color: subjectToUpsert.color || '#1b6e66',
      }, { onConflict: 'id' });

      if (subErr) {
        console.warn('[QuizRev] Subject upsert notice:', subErr.message);
      }
    } catch (e) {
      console.warn('[QuizRev] Pre-saving subject notice:', e);
    }

    // 1. Upsert Quiz
    const quizPayload: Record<string, any> = {
      id: quizId,
      subject_id: quiz.subjectId,
      title: quiz.title,
      description: quiz.description || '',
      duration_minutes: quiz.durationMinutes,
      passing_percentage: quiz.passingPercentage,
      shuffle_questions: quiz.shuffleQuestions,
      shuffle_choices: quiz.shuffleChoices,
      source_filename: quiz.sourceFilename || null,
      source_format: quiz.sourceFormat || 'manual',
      is_published: quiz.isPublished ?? true,
      created_at: quiz.createdAt || new Date().toISOString(),
    };

    let { error: quizError } = await supabase.from('quizzes').upsert(quizPayload);

    // Schema cache fallback: If Supabase schema lacks source_filename, source_format, or other optional columns
    if (quizError) {
      const missingColMatch = quizError.message?.match(/Could not find the '([a-zA-Z0-9_]+)' column/i);
      const isMissingCol = Boolean(missingColMatch) || 
        quizError.message?.toLowerCase().includes('source_filename') ||
        quizError.message?.toLowerCase().includes('source_format') ||
        quizError.message?.toLowerCase().includes('is_published');

      if (isMissingCol) {
        console.warn('[QuizRev] Missing column in remote Supabase schema cache; retrying upsert with core columns:', quizError.message);
        
        // Remove optional/new columns
        delete quizPayload.source_filename;
        delete quizPayload.source_format;
        if (quizError.message?.toLowerCase().includes('is_published')) {
          delete quizPayload.is_published;
        }
        if (missingColMatch && missingColMatch[1] && missingColMatch[1] in quizPayload) {
          delete quizPayload[missingColMatch[1]];
        }

        const retryRes = await supabase.from('quizzes').upsert(quizPayload);
        quizError = retryRes.error;
      }
    }

    if (quizError) {
      console.error('[QuizRev] Error saving quiz to Supabase:', quizError);
      return { success: false, error: quizError.message };
    }

    // 2. Upsert Questions
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      const qId = q.id;

      const questionPayload: Record<string, any> = {
        id: qId,
        quiz_id: quizId,
        order_index: q.orderIndex || i + 1,
        question_text: q.questionText,
        points: q.points || 1,
        explanation: q.explanation || null,
      };

      let { error: qError } = await supabase.from('questions').upsert(questionPayload);

      // Graceful fallback if explanation or points column is missing in older schema
      if (qError && (
        qError.message?.toLowerCase().includes('explanation') ||
        qError.message?.toLowerCase().includes('points') ||
        qError.message?.match(/Could not find the '([a-zA-Z0-9_]+)' column/i)
      )) {
        console.warn('[QuizRev] Retrying question upsert without optional columns:', qError.message);
        delete questionPayload.explanation;
        delete questionPayload.points;
        const retryQ = await supabase.from('questions').upsert(questionPayload);
        qError = retryQ.error;
      }

      if (qError) {
        console.error('[QuizRev] Error saving question to Supabase:', qError);
        continue;
      }

      // 3. Upsert Question Choices
      for (let j = 0; j < q.choices.length; j++) {
        const c = q.choices[j];
        await supabase.from('question_choices').upsert({
          id: c.id,
          question_id: qId,
          order_index: j + 1,
          choice_label: c.label,
          choice_text: c.text,
          is_correct: Boolean(c.isCorrect),
        });
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[QuizRev] saveQuizToSupabase exception:', err);
    return { success: false, error: err.message || 'Unknown save error' };
  }
}

/**
 * Deletes a quiz from Supabase
 */
export async function deleteQuizFromSupabase(quizId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
    if (error) {
      console.error('Error deleting quiz from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('deleteQuizFromSupabase exception:', err);
    return false;
  }
}

/**
 * Updates question choices and explanations when answer keys are modified
 */
export async function updateQuizKeysInSupabase(
  quizId: string,
  questions: Question[]
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    for (const q of questions) {
      if (q.explanation) {
        await supabase.from('questions').update({ explanation: q.explanation }).eq('id', q.id);
      }
      for (const c of q.choices) {
        await supabase.from('question_choices').update({ is_correct: Boolean(c.isCorrect) }).eq('id', c.id);
      }
    }
    return true;
  } catch (err) {
    console.error('updateQuizKeysInSupabase exception:', err);
    return false;
  }
}

/**
 * Saves a subject to Supabase
 */
export async function saveSubjectToSupabase(subject: Subject): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('subjects').upsert({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      color: subject.color || '#1b6e66',
    });

    if (error) {
      console.error('Error saving subject to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('saveSubjectToSupabase exception:', err);
    return false;
  }
}

/**
 * Saves a user profile to Supabase
 */
export async function saveProfileToSupabase(profile: UserProfile): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      full_name: profile.fullName,
      student_id: profile.studentId || null,
      role: profile.role,
      avatar_url: profile.avatarUrl || null,
      created_at: profile.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving profile to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('saveProfileToSupabase exception:', err);
    return false;
  }
}

/**
 * Saves a quiz attempt and its individual student answers to Supabase
 */
export async function saveAttemptToSupabase(attempt: QuizAttempt): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const attemptId = attempt.id;

    // 1. Insert Attempt
    const { error: attError } = await supabase.from('quiz_attempts').insert({
      id: attemptId,
      quiz_id: attempt.quizId,
      student_id: attempt.studentId,
      started_at: attempt.startedAt || new Date().toISOString(),
      completed_at: attempt.completedAt || new Date().toISOString(),
      time_spent_seconds: attempt.timeSpentSeconds,
      total_questions: attempt.totalQuestions,
      correct_answers: attempt.correctAnswers,
      score: attempt.score,
      percentage: attempt.percentage,
      passed: attempt.passed,
    });

    if (attError) {
      console.error('Error saving attempt to Supabase:', attError);
      return false;
    }

    // 2. Insert Student Answers
    const answerEntries = Object.entries(attempt.answers);
    for (const [qId, choiceId] of answerEntries) {
      await supabase.from('student_answers').insert({
        id: generateUuid(),
        attempt_id: attemptId,
        question_id: qId,
        selected_choice_id: choiceId,
      });
    }

    return true;
  } catch (err) {
    console.error('saveAttemptToSupabase exception:', err);
    return false;
  }
}

/**
 * Pushes all in-memory local data up to Supabase in one operation
 */
export async function pushAllLocalDataToSupabase(data: {
  subjects: Subject[];
  profiles: UserProfile[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
}): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase client is not configured.' };
  }

  try {
    let syncedSubjects = 0;
    let syncedQuizzes = 0;
    let syncedAttempts = 0;
    let syncedProfiles = 0;

    // 1. Sync subjects
    for (const s of data.subjects) {
      const ok = await saveSubjectToSupabase(s);
      if (ok) syncedSubjects++;
    }

    // 2. Sync profiles
    for (const p of data.profiles) {
      const ok = await saveProfileToSupabase(p);
      if (ok) syncedProfiles++;
    }

    // 3. Sync quizzes
    for (const q of data.quizzes) {
      const res = await saveQuizToSupabase(q);
      if (res.success) syncedQuizzes++;
    }

    // 4. Sync attempts
    for (const a of data.attempts) {
      const ok = await saveAttemptToSupabase(a);
      if (ok) syncedAttempts++;
    }

    return {
      success: true,
      message: `Successfully synchronized: ${syncedSubjects} subjects, ${syncedProfiles} accounts, ${syncedQuizzes} exams, and ${syncedAttempts} attempts to Supabase!`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Sync failed.' };
  }
}
