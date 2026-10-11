'use client';
import { useActionState } from 'react';
import type { AuthState } from './actions';

type Props = {
  action: (prev: AuthState, form: FormData) => Promise<AuthState>;
  submit: string;
  next?: string;
  withPassword?: boolean;
  withTerms?: boolean;
};

export default function AuthForm({ action, submit, next, withPassword = true, withTerms = false }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form className="stack" action={formAction}>
      <input type="hidden" name="next" value={next || ''} />
      <label htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" required /></label>
      {withPassword && <label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete={withTerms ? 'new-password' : 'current-password'} minLength={8} required /></label>}
      {withTerms && <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 500 }}><input type="checkbox" name="terms" style={{ width: 'auto' }} /> I agree to the Terms and Privacy Policy</label>}
      {state.error && <p className="msg msg--err" role="alert">{state.error}</p>}
      {state.notice && <p className="msg msg--ok" role="status">{state.notice}</p>}
      <button className="btn btn--rec" type="submit" disabled={pending}>{pending ? 'Please wait…' : submit}</button>
    </form>
  );
}
