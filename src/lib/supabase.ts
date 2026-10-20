import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default keys or stored keys from local storage
export const getSupabaseConfig = () => {
  const storedUrl = localStorage.getItem('quizrev_supabase_url');
  const storedKey = localStorage.getItem('quizrev_supabase_anon_key');
  
  const url = storedUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = storedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http')),
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
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (url) {
    localStorage.setItem('quizrev_supabase_url', url.trim());
  } else {
    localStorage.removeItem('quizrev_supabase_url');
  }

  if (anonKey) {
    localStorage.setItem('quizrev_supabase_anon_key', anonKey.trim());
  } else {
    localStorage.removeItem('quizrev_supabase_anon_key');
  }

  cachedClient = null;
  cachedConfigKey = '';
};
