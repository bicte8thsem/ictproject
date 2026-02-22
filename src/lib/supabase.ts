// ============================================
// SUPABASE CLIENT CONFIGURATION
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const hasPlaceholderValues =
  supabaseUrl.includes('your-project.supabase.co') ||
  supabaseAnonKey.includes('your-anon-key-here');
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !hasPlaceholderValues);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase credentials are missing or placeholders are still in use. Update .env and restart the app.'
  );
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'http://localhost:54321',
  isSupabaseConfigured ? supabaseAnonKey : 'mock-key'
);

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart `npm run dev`.'
    );
  }
}

// ============================================
// AUTH FUNCTIONS
// ============================================

export async function signInWithEmail(email: string, password: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  assertSupabaseConfigured();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getSession() {
  assertSupabaseConfigured();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function handleError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [
      maybeError.message,
      maybeError.details,
      maybeError.hint,
      maybeError.code ? `code: ${maybeError.code}` : undefined,
    ].filter(Boolean);
    if (parts.length > 0) {
      return new Error(parts.join(' | '));
    }
  }
  return new Error('An unknown error occurred');
}
