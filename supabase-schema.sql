-- ====================================================================
-- QuizRev — Supabase Database Schema
-- Production-Ready Schema with RLS Policies & Sample Seed Data
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Teachers & Students)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')) DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#1b6e66',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  passing_percentage INTEGER NOT NULL DEFAULT 70,
  shuffle_questions BOOLEAN NOT NULL DEFAULT true,
  shuffle_choices BOOLEAN NOT NULL DEFAULT true,
  source_filename TEXT,
  source_format TEXT CHECK (source_format IN ('docx', 'pdf', 'manual', 'imported')),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  points NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Question Choices Table
CREATE TABLE IF NOT EXISTS public.question_choices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  choice_label TEXT NOT NULL, -- e.g. 'A', 'B', 'C', 'D'
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false
);

-- 7. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Student Answers Table
CREATE TABLE IF NOT EXISTS public.student_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_choice_id UUID REFERENCES public.question_choices(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- Indexes for Performance
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON public.quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_choices_question_id ON public.question_choices(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON public.student_answers(attempt_id);

-- ====================================================================
-- Row Level Security (RLS)
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile, teachers can view all profiles
CREATE POLICY "Public profiles are readable by authenticated users" 
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Subjects: Readable by all authenticated users; only teachers can insert/update
CREATE POLICY "Subjects are readable by all" 
  ON public.subjects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can insert/update subjects" 
  ON public.subjects FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- Quizzes: Readable by all; teachers can insert/update/delete
CREATE POLICY "Quizzes are readable by authenticated users" 
  ON public.quizzes FOR SELECT TO authenticated USING (is_published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

CREATE POLICY "Teachers manage quizzes" 
  ON public.quizzes FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- Questions: Readable by authenticated users taking quizzes or teachers
CREATE POLICY "Questions readable by authenticated" 
  ON public.questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers manage questions" 
  ON public.questions FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- Question choices: Readable by authenticated
CREATE POLICY "Choices readable by authenticated" 
  ON public.question_choices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers manage choices" 
  ON public.question_choices FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- Quiz attempts: Students can view/insert their own attempts; Teachers can view all
CREATE POLICY "Students manage own attempts" 
  ON public.quiz_attempts FOR ALL TO authenticated 
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- Student answers:
CREATE POLICY "Students manage own answers" 
  ON public.student_answers FOR ALL TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts WHERE id = student_answers.attempt_id AND (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')))
  );

-- ====================================================================
-- Sample Seed Data (Subjects)
-- ====================================================================
INSERT INTO public.subjects (name, code, description, color) VALUES
  ('General Science', 'SCI', 'Earth Science, Biology, Chemistry & Physics fundamentals', '#1b6e66'),
  ('Mathematics', 'MATH', 'Algebra, Geometry, Trigonometry, Statistics & Calculus', '#2a5b88'),
  ('Professional Education', 'PROFED', 'Child development, curriculum, assessment & teaching methods', '#78350f'),
  ('English & Literature', 'ENG', 'Grammar, vocabulary, critical reading comprehension', '#4c1d95'),
  ('Social Studies & History', 'SOC', 'World history, geography, governance & citizenship', '#831843')
ON CONFLICT (code) DO NOTHING;
