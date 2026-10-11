import AuthForm from '@/app/auth/AuthForm';
import { resetPassword } from '@/app/auth/actions';

export default function Forgot() {
  return (
    <div className="auth card">
      <h1>Reset password</h1>
      <AuthForm action={resetPassword} submit="Send reset link" withPassword={false} />
    </div>
  );
}
