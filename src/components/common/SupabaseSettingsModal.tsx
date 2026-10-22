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
      <div className="clay-surface rounded-3xl w-full max-w-lg shadow-clay-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center text-accent shadow-clay-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-ink leading-tight">
                Database Configuration
              </h3>
              <p className="text-xs text-ink-muted">
                QuizRev Live Supabase Cloud Sync & Persistence
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSupabaseModalOpen(false)}
            className="clay-btn-neutral p-1.5 rounded-xl text-ink-muted hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200/60 px-6 py-2 bg-[#eef2f7] space-x-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all ${
              activeTab === 'settings'
                ? 'clay-inset-sm text-accent bg-teal-50 border border-teal-200/50 shadow-clay-inset'
                : 'clay-surface-sm text-slate-600 hover:text-slate-900'
            }`}
          >
            API Credentials & Sync
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all ${
              activeTab === 'sql'
                ? 'clay-inset-sm text-accent bg-teal-50 border border-teal-200/50 shadow-clay-inset'
                : 'clay-surface-sm text-slate-600 hover:text-slate-900'
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
              <div className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 shadow-clay-sm font-medium ${
                supabaseConfig.isConfigured 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <div className="w-2.5 h-2.5 rounded-full bg-current mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold">
                    {supabaseConfig.isConfigured
                      ? 'Live Supabase Connection Configured'
                      : 'Running in Local Storage Mode'}
                  </p>
                  <p className="mt-0.5 opacity-90 leading-relaxed font-normal">
                    {supabaseConfig.isConfigured
                      ? 'QuizRev is actively synchronizing exams, student accounts, and test attempts to your Supabase backend.'
                      : 'Data is currently saved only on this machine. Enter your Supabase Project URL and Anon Key below to automatically save and share mock exams across all devices.'}
                  </p>
                </div>
              </div>

              {/* Cloud Sync Actions Bar (When Configured) */}
              {supabaseConfig.isConfigured && (
                <div className="clay-surface-sm p-4 rounded-2xl space-y-2.5 shadow-clay-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Cloud Data Synchronization</span>
                    {isSyncingWithSupabase && (
                      <span className="text-[11px] font-bold text-accent flex items-center space-x-1 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Syncing...</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isSyncingWithSupabase}
                      onClick={handlePushToCloud}
                      className="clay-btn-teal px-3.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center space-x-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Push Local Data to Supabase</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSyncingWithSupabase}
                      onClick={handlePullFromCloud}
                      className="clay-btn-neutral px-3.5 py-1.5 rounded-xl text-slate-700 text-xs font-bold flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-accent" />
                      <span>Pull Cloud Data</span>
                    </button>
                  </div>
                </div>
              )}

              {syncFeedback && (
                <div className={`p-3.5 rounded-2xl border text-xs flex items-center space-x-2 font-medium shadow-clay-sm ${
                  syncFeedback.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}>
                  {syncFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{syncFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-accent" />
                    <span>Supabase Project URL *</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="clay-inset w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-accent" />
                    <span>Supabase Anon Public API Key *</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="clay-inset w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent font-mono"
                  />
                </div>

                {testResult && (
                  <div className={`p-3.5 rounded-2xl border text-xs flex items-center space-x-2 font-medium shadow-clay-sm ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                  <button
                    type="button"
                    disabled={isTesting || !url.trim() || !anonKey.trim()}
                    onClick={handleTestConnection}
                    className="clay-btn-neutral px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1.5 disabled:opacity-50"
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
                      className="clay-btn-teal px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center space-x-1.5"
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
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 shadow-clay-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quick Fix: Missing Column / Schema Cache Error</span>
                  </span>
                  <button
                    type="button"
                    onClick={copyMigrationSql}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm"
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
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  If you see <em>"Could not find the 'source_filename' column of 'quizzes' in the schema cache"</em>, your existing database tables just need these new columns added:
                </p>
                <div className="bg-[#1f201d] text-amber-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner">
                  <code>ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS source_filename TEXT;</code><br />
                  <code>ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS source_format TEXT DEFAULT 'manual';</code><br />
                  <code>ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;</code><br />
                  <code>NOTIFY pgrst, 'reload schema';</code>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">
                  Full Database Setup Schema:
                </p>
                <button
                  onClick={copySqlSchema}
                  className="clay-btn-neutral flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-accent" />
                      <span>Copy Full SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#1f201d] text-[#e0e0e0] p-4 rounded-2xl font-mono text-[11px] max-h-60 overflow-y-auto leading-relaxed border border-slate-700/60 shadow-inner">
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
