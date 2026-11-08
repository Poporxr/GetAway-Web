import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { loadDB } from '@/lib/store';
import OnboardingWizard from '@/components/OnboardingWizard';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await requireUser();
  const db = loadDB();
  const profile = db.profiles.find((p) => p.userId === user.id);
  if (profile?.commissionAcceptedAt) redirect('/dashboard');
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
