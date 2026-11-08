import { BadgeCheck, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { loadDB } from '@/lib/store';
import { VerificationForm } from '@/components/DashboardWidgets';

export const dynamic = 'force-dynamic';

export default async function VerificationPage() {
  const user = await requireUser();
  const db = loadDB();
  const profile = db.profiles.find((p) => p.userId === user.id);
  const v = profile?.verification ?? { status: 'not_submitted' as const };

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="text-lg font-extrabold text-stone-900">Student verification</h2>
      <p className="text-sm text-stone-500">Withdrawals unlock once your student status is verified. This protects gift money from fake accounts.</p>

      <div className="mt-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
        {v.status === 'verified' ? (
          <div className="text-center">
            <ShieldCheck className="mx-auto text-emerald-500" size={44} />
            <p className="mt-2 font-bold text-stone-900">You&apos;re verified</p>
            <p className="text-sm text-stone-500">Withdrawals are open on the Withdrawals tab.</p>
          </div>
        ) : v.status === 'pending_review' ? (
          <div className="text-center">
            <Clock className="mx-auto text-amber-500" size={44} />
            <p className="mt-2 font-bold text-stone-900">Under review</p>
            <p className="text-sm text-stone-500">
              {v.idType} · {v.idNumber} — submitted {v.submittedAt ? new Date(v.submittedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : ''}.
            </p>
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              Prototype note: admin review is out of scope, so this status is simulated and stays “pending” — no admin console exists in this build to approve it.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start gap-2 rounded-2xl bg-stone-50 p-3 text-sm text-stone-600">
              <ShieldAlert size={17} className="mt-0.5 shrink-0 text-violet-600" />
              <span>Current status: <strong>not submitted</strong>. Submit your student ID details below to enter the review queue.</span>
            </div>
            <VerificationForm />
          </>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-3xl bg-violet-50 p-4 text-sm text-violet-900 ring-1 ring-violet-100">
        <BadgeCheck size={17} className="mt-0.5 shrink-0" />
        <span>Your account: {profile?.school} · {profile?.department}. Payout bank: {profile?.bankName} — {profile?.accountNumber} ({profile?.accountName}).</span>
      </div>
    </div>
  );
}
