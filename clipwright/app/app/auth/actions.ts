'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/env';

export type AuthState = { error?: string; notice?: string };

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === 'string' ? v : '';
  return s.startsWith('/') && !s.startsWith('//') ? s : '/studio';
};

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  if (!email || !password) return { error: 'Enter your email and password.' };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message === 'Email not confirmed' ? 'Confirm your email first. Check your inbox.' : 'Wrong email or password.' };
  redirect(safeNext(form.get('next')));
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email.' };
  if (password.length < 8) return { error: 'Use at least 8 characters for the password.' };
  if (!form.get('terms')) return { error: 'Accept the terms to continue.' };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=/studio` } });
  if (error) return { error: error.message };
  if (data.session) redirect('/studio');
  return { notice: 'Check your inbox and click the link to confirm your account.' };
}

export async function resetPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get('email') || '').trim();
  if (!email) return { error: 'Enter your email.' };
  const supabase = await supabaseServer();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/callback?next=/dashboard` });
  return { notice: 'If that email has an account, a reset link is on its way.' };
}

export async function signInWithGoogle() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${siteUrl()}/auth/callback?next=/studio` } });
  if (error || !data.url) redirect('/login?error=google');
  redirect(data.url);
}
