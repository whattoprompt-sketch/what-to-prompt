import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'CRITICAL: Missing Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY). Authentication will fail.';
  if (import.meta.env.DEV) {
    throw new Error(errorMsg);
  } else {
    console.error(errorMsg);
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://invalid-config.supabase.co',
  supabaseAnonKey || 'invalid-key'
);
