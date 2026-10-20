import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Database, CheckCircle, Copy, Check, ExternalLink, Key, Globe } from 'lucide-react';

export const SupabaseSettingsModal: React.FC = () => {
  const {
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
    supabaseConfig,
    updateSupabaseCredentials,
  } = useApp();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'sql'>('settings');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isSupabaseModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseCredentials(url, anonKey);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSupabaseModalOpen(false);
    }, 1200);
  };

  const copySqlSchema = () => {
    const sqlText = `-- QuizRev Supabase Schema
-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')) DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#1b6e66',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  passing_percentage INTEGER NOT NULL DEFAULT 70,
  shuffle_questions BOOLEAN NOT NULL DEFAULT true,
  shuffle_choices BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  points NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.question_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  choice_label TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
);`;

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
                QuizRev Supabase Integration & Schema
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
            API Credentials
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
            <form onSubmit={handleSave} className="space-y-4">
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
                      ? 'QuizRev is synced with your Supabase backend project.'
                      : 'All quizzes, attempts, and accounts are stored securely in browser storage. Enter your Supabase Project URL and Anon Key below to hook up to your live Supabase cloud database.'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1.5 flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Supabase Project URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1.5 flex items-center space-x-1">
                  <Key className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Supabase Anon Public API Key</span>
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-surface font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent hover:underline flex items-center space-x-1"
                >
                  <span>Open Supabase Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-sm flex items-center space-x-1.5"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Connection</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-ink-muted">
                  Run this SQL in your Supabase SQL Editor:
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
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#1f201d] text-[#e0e0e0] p-3.5 rounded-xl font-mono text-[11px] max-h-64 overflow-y-auto leading-relaxed border border-border">
                <pre>
{`-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  student_id TEXT
);

-- 2. Quizzes & Questions
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  duration_minutes INT DEFAULT 30,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_choices BOOLEAN DEFAULT true
);

-- 3. Attempts & Scores
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id),
  student_id UUID REFERENCES profiles(id),
  score NUMERIC(5,2),
  percentage NUMERIC(5,2),
  passed BOOLEAN
);`}
                </pre>
              </div>
              <p className="text-[11px] text-ink-muted">
                Tip: You can also find the complete script in <code className="bg-surface px-1 py-0.5 rounded border border-border">supabase-schema.sql</code> in the project directory.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
