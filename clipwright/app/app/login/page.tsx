import Link from 'next/link';
import AuthForm from '@/app/auth/AuthForm';
import { signIn, signInWithGoogle } from '@/app/auth/actions';

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="auth card">
      <h1>Sign in</h1>
      <AuthForm action={signIn} submit="Sign in" next={next} />
      <form action={signInWithGoogle} style={{ marginTop: 10 }}><button className="btn" type="submit" style={{ width: '100%' }}>Continue with Google</button></form>
      <p className="muted" style={{ fontSize: 14 }}><Link href="/forgot">Forgot password?</Link> · New here? <Link href="/register">Create an account</Link></p>
    </div>
  );
}
