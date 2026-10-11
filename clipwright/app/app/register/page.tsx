import Link from 'next/link';
import AuthForm from '@/app/auth/AuthForm';
import { signUp, signInWithGoogle } from '@/app/auth/actions';

export default function Register() {
  return (
    <div className="auth card">
      <h1>Create account</h1>
      <p className="muted">50 free credits to try the studio. No card needed.</p>
      <AuthForm action={signUp} submit="Create account" withTerms />
      <form action={signInWithGoogle} style={{ marginTop: 10 }}><button className="btn" type="submit" style={{ width: '100%' }}>Sign up with Google</button></form>
      <p className="muted" style={{ fontSize: 14 }}>Already have an account? <Link href="/login">Sign in</Link></p>
    </div>
  );
}
