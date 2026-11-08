import { NextResponse } from 'next/server';
import { updateDB, nowISO } from '@/lib/store';
import { currentUser } from '@/lib/auth';
import { POLICY_VERSION } from '@/lib/money';

export const dynamic = 'force-dynamic';

// Onboarding order is enforced here: school → bank → commission acknowledgement.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const result = updateDB((db) => {
    const profile = db.profiles.find((p) => p.userId === user.id);
    if (!profile) return { error: 'Profile not found.' };
    if (body.step === 'school') {
      if (!body.school?.trim() || !body.department?.trim()) return { error: 'School and department are required.' };
      profile.school = String(body.school).trim();
      profile.department = String(body.department).trim();
      return { ok: true };
    }
    if (body.step === 'bank') {
      if (!profile.school) return { error: 'Complete the school step first.' };
      if (!body.bankName || !/^\d{10}$/.test(String(body.accountNumber || '')) || !body.accountName?.trim()) {
        return { error: 'Choose your bank, enter the 10-digit account number and the account name.' };
      }
      profile.bankName = String(body.bankName);
      profile.bankCode = String(body.bankCode || '');
      profile.accountNumber = String(body.accountNumber);
      profile.accountName = String(body.accountName).trim();
      return { ok: true };
    }
    if (body.step === 'commission') {
      if (!profile.bankName) return { error: 'Complete the bank step first.' };
      if (body.accepted !== true) return { error: 'You must acknowledge the 10% commission to continue.' };
      profile.commissionAcceptedAt = nowISO();
      profile.policyVersion = POLICY_VERSION;
      return { ok: true };
    }
    return { error: 'Unknown step.' };
  });
  if ('error' in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true });
}
