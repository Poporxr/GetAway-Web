import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import AuthForm from '@/components/AuthForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await currentUser()) redirect('/dashboard');
  return <AuthForm mode="login" />;
}
