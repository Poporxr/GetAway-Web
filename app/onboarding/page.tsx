'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientDB } from '@/lib/hooks';
import { getSessionUserId } from '@/lib/localstore';
import { LoadingBlock } from '@/components/ui';
import OnboardingWizard from '@/components/OnboardingWizard';

export default function OnboardingPage() {
  const router = useRouter();
  const { ready, db } = useClientDB();
  const userId = ready ? getSessionUserId() : null;
  const profile = ready && db && userId ? db.profiles.find((p) => p.userId === userId) : undefined;

  useEffect(() => {
    if (!ready) return;
    if (!userId) router.replace('/login');
    else if (profile?.commissionAcceptedAt) router.replace('/dashboard');
  }, [ready, userId, profile, router]);

  if (!ready || !userId || profile?.commissionAcceptedAt) return <LoadingBlock />;
  return (
    <OnboardingWizard
      initial={{
        school: profile?.school ?? '', department: profile?.department ?? '',
        bankName: profile?.bankName ?? '', bankCode: profile?.bankCode ?? '',
        accountNumber: profile?.accountNumber ?? '', accountName: profile?.accountName ?? '',
      }}
    />
  );
}
