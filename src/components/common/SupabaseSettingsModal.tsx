import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { testSupabaseConnection } from '../../lib/supabaseSync';
import { 
  X, 
  Database, 
  CheckCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Key, 
  Globe,
  Loader2,
  UploadCloud,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const SupabaseSettingsModal: React.FC = () => {
  const {
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
    supabaseConfig,
    updateSupabaseCredentials,
    isSyncingWithSupabase,
    pushLocalToSupabase,
    refreshFromSupabase,
  } = useApp();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [copied, setCopied] = useState(false);
  const [copiedFix, setCopiedFix] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'sql'>('settings');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isSupabaseModalOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url, anonKey);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSupabaseCredentials(url, anonKey);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSupabaseModalOpen(false);
    }, 1200);
  };

  const handlePushToCloud = async () => {
    setSyncFeedback(null);
    const res = await pushLocalToSupabase();
    setSyncFeedback(res);
  };

  const handlePullFromCloud = async () => {
    setSyncFeedback(null);
    await refreshFromSupabase();
    setSyncFeedback({ success: true, message: 'Successfully refreshed local data from Supabase backend!' });
  };

  const copyMigrationSql = () => {
    const fixSql = `-- ====================================================================
-- QuizRev — Fix Missing Columns in Existing Supabase Database
-- Run this in your Supabase SQL Editor if you see schema cache errors:
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
NOTIFY pgrst, 'reload schema';`;

    navigator.clipboard.writeText(fixSql);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  const copySqlSchema = () => {
    const sqlText = `-- ====================================================================
-- QuizRev — Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#1b6e66',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  points NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.question_choices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  choice_label TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false
);

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

CREATE TABLE IF NOT EXISTS public.student_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_choice_id UUID REFERENCES public.question_choices(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_choices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers DISABLE ROW LEVEL SECURITY;

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

INSERT INTO public.subjects (id, name, code, description, color) VALUES
  ('11111111-1111-4111-a111-111111111111', 'General Science', 'SCI', 'Earth Science, Biology, Chemistry & Physics fundamentals', '#1b6e66'),
  ('22222222-2222-4222-a222-222222222222', 'Mathematics', 'MATH', 'Algebra, Geometry, Trigonometry, Statistics & Calculus', '#2a5b88'),
  ('33333333-3333-4333-a333-333333333333', 'Professional Education', 'PROFED', 'Child development, curriculum, assessment & teaching methods', '#78350f'),
  ('44444444-4444-4444-a444-444444444444', 'English & Literature', 'ENG', 'Grammar, vocabulary, critical reading comprehension', '#4c1d95'),
  ('55555555-5555-4555-a555-555555555555', 'Social Studies & History', 'SOC', 'World history, geography, governance & citizenship', '#831843')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, avatar_url) VALUES
  ('00000000-0000-4000-a000-000000000001', 'teacher@quizrev.edu', 'Prof. Jack Hernandez', 'teacher', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80')
ON CONFLICT (email) DO NOTHING;

-- Schema migrations for existing databases
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

NOTIFY pgrst, 'reload schema';`;

    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-ground border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-ink leading-tight">
                Database Configuration
              </h3>
              <p className="text-xs text-ink-muted">
                QuizRev Live Supabase Cloud Sync & Persistence
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSupabaseModalOpen(false)}
            className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-ground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border px-6 bg-ground">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 text-xs font-medium border-b-2 mr-6 transition-colors ${
              activeTab === 'settings'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            API Credentials & Sync
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            SQL Migration Schema
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'settings' ? (
            <div className="space-y-4">
              {/* Status Box */}
              <div className={`p-3.5 rounded-xl border text-xs flex items-start space-x-3 ${
                supabaseConfig.isConfigured 
                  ? 'bg-positive-bg/40 border-positive/30 text-positive-ink' 
                  : 'bg-warning-bg/40 border-warning/30 text-warning-ink'
              }`}>
                <div className="w-2 h-2 rounded-full bg-current mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">
                    {supabaseConfig.isConfigured
                      ? 'Live Supabase Connection Configured'
                      : 'Running in Local Storage Mode'}
                  </p>
                  <p className="mt-0.5 opacity-90 leading-relaxed">
                    {supabaseConfig.isConfigured
                      ? 'QuizRev is actively synchronizing exams, student accounts, and test attempts to your Supabase backend.'
                      : 'Data is currently saved only on this machine. Enter your Supabase Project URL and Anon Key below to automatically save and share mock exams across all devices.'}
                  </p>
                </div>
              </div>

              {/* Cloud Sync Actions Bar (When Configured) */}
              {supabaseConfig.isConfigured && (
                <div className="p-3 bg-surface border border-border rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink">Cloud Data Synchronization</span>
                    {isSyncingWithSupabase && (
                      <span className="text-[11px] text-accent flex items-center space-x-1 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Syncing...</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={isSyncingWithSupabase}
                      onClick={handlePushToCloud}
                      className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors flex items-center space-x-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Push Local Data to Supabase</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSyncingWithSupabase}
                      onClick={handlePullFromCloud}
                      className="px-3 py-1.5 rounded-lg border border-border bg-ground text-ink text-xs font-medium hover:bg-surface transition-colors flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Pull Cloud Data</span>
                    </button>
                  </div>
                </div>
              )}

              {syncFeedback && (
                <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                  syncFeedback.success
                    ? 'bg-positive-bg/40 border-positive/30 text-positive-ink'
                    : 'bg-negative-bg/50 border-negative/30 text-negative-ink'
                }`}>
                  {syncFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-positive flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-negative flex-shrink-0" />
                  )}
                  <span>{syncFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5 flex items-center space-x-1">
                    <Globe className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Supabase Project URL *</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5 flex items-center space-x-1">
                    <Key className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Supabase Anon Public API Key *</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-surface font-mono"
                  />
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                    testResult.success
                      ? 'bg-positive-bg/40 border-positive/30 text-positive-ink'
                      : 'bg-negative-bg/50 border-negative/30 text-negative-ink'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-positive flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-negative flex-shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-rule">
                  <button
                    type="button"
                    disabled={isTesting || !url.trim() || !anonKey.trim()}
                    onClick={handleTestConnection}
                    className="px-3.5 py-2 rounded-control border border-border text-xs font-medium text-ink bg-ground hover:bg-surface transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <span>Test Connection</span>
                    )}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-sm flex items-center space-x-1.5"
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Connected!</span>
                        </>
                      ) : (
                        <span>Save Connection</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Fix Card for Existing Databases */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900 flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quick Fix: Missing Column / Schema Cache Error</span>
                  </span>
                  <button
                    type="button"
                    onClick={copyMigrationSql}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    {copiedFix ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied Fix!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Fix SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  If you see <em>"Could not find the 'source_filename' column of 'quizzes' in the schema cache"</em>, your existing database tables just need these new columns added:
                </p>
                <div className="bg-[#1f201d] text-amber-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                  <code>ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS source_filename TEXT;</code><br />
                  <code>ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS source_format TEXT DEFAULT 'manual';</code><br />
                  <code>ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;</code><br />
                  <code>NOTIFY pgrst, 'reload schema';</code>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-ink-muted">
                  Full Database Setup Schema:
                </p>
                <button
                  onClick={copySqlSchema}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-surface text-ink transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-positive" />
                      <span className="text-positive">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#1f201d] text-[#e0e0e0] p-3.5 rounded-xl font-mono text-[11px] max-h-60 overflow-y-auto leading-relaxed border border-border">
                <pre>
{`-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT,
  role TEXT DEFAULT 'student',
  avatar_url TEXT
);

-- 2. Subjects & Quizzes
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#1b6e66'
);

CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 30,
  passing_percentage INT DEFAULT 70,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_choices BOOLEAN DEFAULT true,
  source_filename TEXT,
  source_format TEXT DEFAULT 'manual',
  is_published BOOLEAN DEFAULT true
);

-- 3. Questions & Choices
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  order_index INT DEFAULT 0,
  question_text TEXT NOT NULL,
  points NUMERIC(4,2) DEFAULT 1.00,
  explanation TEXT
);

CREATE TABLE public.question_choices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  order_index INT DEFAULT 0,
  choice_label TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false
);

-- 4. Attempts & Answers
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  time_spent_seconds INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  score NUMERIC(5,2) DEFAULT 0,
  percentage NUMERIC(5,2) DEFAULT 0,
  passed BOOLEAN DEFAULT false
);

CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_choice_id UUID REFERENCES question_choices(id) ON DELETE SET NULL,
  is_correct BOOLEAN DEFAULT false
);

-- 5. Safe Migrations for Existing Tables
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS source_filename TEXT;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS source_format TEXT DEFAULT 'manual';
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
NOTIFY pgrst, 'reload schema';

-- 6. Policies
CREATE POLICY "Public Profiles" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Subjects" ON public.subjects FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Quizzes" ON public.quizzes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Questions" ON public.questions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Choices" ON public.question_choices FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Attempts" ON public.quiz_attempts FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Answers" ON public.student_answers FOR ALL TO public USING (true) WITH CHECK (true);`}
                </pre>
              </div>
              <p className="text-[11px] text-ink-muted">
                Tip: The full script with seed academic subjects is located at <code className="bg-surface px-1 py-0.5 rounded border border-border">supabase-schema.sql</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
