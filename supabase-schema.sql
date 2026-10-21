-- ====================================================================
-- QuizRev — Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Teachers & Students)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')) DEFAULT 'student',
  avatar_url TEXT,
  password TEXT DEFAULT 'student123',
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
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  passing_percentage INTEGER NOT NULL DEFAULT 70,
  shuffle_questions BOOLEAN NOT NULL DEFAULT true,
  shuffle_choices BOOLEAN NOT NULL DEFAULT true,
  source_filename TEXT,
  source_format TEXT DEFAULT 'manual',
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
  choice_label TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
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
-- Indexes for High Performance
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON public.quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_choices_question_id ON public.question_choices(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON public.student_answers(attempt_id);

-- ====================================================================
-- Permissions & Access Configuration
-- ====================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Disable Row Level Security (RLS) to ensure seamless cross-device synchronization
-- across mobile phones and laptops using the anonymous client key.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_choices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers DISABLE ROW LEVEL SECURITY;

-- Fallback public policies (if RLS is manually re-enabled in Supabase dashboard)
DROP POLICY IF EXISTS "QuizRev Profiles Access" ON public.profiles;
DROP POLICY IF EXISTS "QuizRev Subjects Access" ON public.subjects;
DROP POLICY IF EXISTS "QuizRev Quizzes Access" ON public.quizzes;
DROP POLICY IF EXISTS "QuizRev Questions Access" ON public.questions;
DROP POLICY IF EXISTS "QuizRev Choices Access" ON public.question_choices;
DROP POLICY IF EXISTS "QuizRev Attempts Access" ON public.quiz_attempts;
DROP POLICY IF EXISTS "QuizRev Answers Access" ON public.student_answers;

CREATE POLICY "QuizRev Profiles Access" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "QuizRev Subjects Access" ON public.subjects FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "QuizRev Quizzes Access" ON public.quizzes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "QuizRev Questions Access" ON public.questions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "QuizRev Choices Access" ON public.question_choices FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "QuizRev Attempts Access" ON public.quiz_attempts FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "QuizRev Answers Access" ON public.student_answers FOR ALL TO public USING (true) WITH CHECK (true);

-- ====================================================================
-- Seed Initial Academic Subjects
-- ====================================================================
INSERT INTO public.subjects (id, name, code, description, color) VALUES
  ('11111111-1111-4111-a111-111111111111', 'General Science', 'SCI', 'Earth Science, Biology, Chemistry & Physics fundamentals', '#1b6e66'),
  ('22222222-2222-4222-a222-222222222222', 'Mathematics', 'MATH', 'Algebra, Geometry, Trigonometry, Statistics & Calculus', '#2a5b88'),
  ('33333333-3333-4333-a333-333333333333', 'Professional Education', 'PROFED', 'Child development, curriculum, assessment & teaching methods', '#78350f'),
  ('44444444-4444-4444-a444-444444444444', 'English & Literature', 'ENG', 'Grammar, vocabulary, critical reading comprehension', '#4c1d95'),
  ('55555555-5555-4555-a555-555555555555', 'Social Studies & History', 'SOC', 'World history, geography, governance & citizenship', '#831843')
ON CONFLICT (code) DO NOTHING;

-- Seed Default Teacher Account
INSERT INTO public.profiles (id, email, full_name, role, avatar_url, password) VALUES
  ('00000000-0000-4000-a000-000000000001', 'teacher@quizrev.edu', 'Prof. Jack Hernandez', 'teacher', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', 'admin123')
ON CONFLICT (email) DO NOTHING;

-- ====================================================================
-- Idempotent Column Migrations for Existing Databases
-- Safely adds any new columns if the tables were created in earlier versions
-- ====================================================================
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS source_filename TEXT;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS source_format TEXT DEFAULT 'manual';
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'student123';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS points NUMERIC(4,2) NOT NULL DEFAULT 1.00;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Refresh Supabase PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
