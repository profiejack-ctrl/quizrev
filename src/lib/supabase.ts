import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to clean environment variable strings (strip accidental quotes/whitespace)
const cleanEnvVar = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

// Default keys or stored keys from local storage
export const getSupabaseConfig = () => {
  const storedUrl = cleanEnvVar(localStorage.getItem('quizrev_supabase_url'));
  const storedKey = cleanEnvVar(localStorage.getItem('quizrev_supabase_anon_key'));
  
  // Check all common environment variable naming conventions
  const envUrl = cleanEnvVar(
    import.meta.env.VITE_SUPABASE_URL ||
    (import.meta.env as any).SUPABASE_URL ||
    (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL ||
    ''
  );

  const envKey = cleanEnvVar(
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    (import.meta.env as any).VITE_SUPABASE_KEY ||
    (import.meta.env as any).SUPABASE_ANON_KEY ||
    (import.meta.env as any).SUPABASE_KEY ||
    (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  );
  
  const url = storedUrl || envUrl;
  const anonKey = storedKey || envKey;
  const isConfigured = Boolean(
    url && 
    anonKey && 
    (url.startsWith('https://') || url.startsWith('http://'))
  );

  return {
    url,
    anonKey,
    isConfigured,
  };
};

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  const configKey = `${config.url}_${config.anonKey}`;

  if (!config.isConfigured) {
    return null;
  }

  if (cachedClient && cachedConfigKey === configKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedConfigKey = configKey;
    return cachedClient;
  } catch (err) {
    console.warn('[QuizRev] Failed to initialize Supabase client:', err);
    return null;
  }
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  const cleanedUrl = cleanEnvVar(url);
  const cleanedKey = cleanEnvVar(anonKey);

  if (cleanedUrl) {
    localStorage.setItem('quizrev_supabase_url', cleanedUrl);
  } else {
    localStorage.removeItem('quizrev_supabase_url');
  }

  if (cleanedKey) {
    localStorage.setItem('quizrev_supabase_anon_key', cleanedKey);
  } else {
    localStorage.removeItem('quizrev_supabase_anon_key');
  }

  cachedClient = null;
  cachedConfigKey = '';
};
