'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionUserId } from '@/lib/localstore';
import AuthForm from '@/components/AuthForm';

export default function SignupPage() {
  const router = useRouter();
  useEffect(() => {
    if (getSessionUserId()) router.replace('/dashboard');
  }, [router]);
  return <AuthForm mode="signup" />;
}
