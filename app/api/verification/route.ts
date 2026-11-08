import { NextResponse } from 'next/server';
import { updateDB, nowISO } from '@/lib/store';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Owner submits student-verification evidence. Admin review is out of scope
// for the prototype: the status simply stays "pending_review" (simulated queue).
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body.idType || !String(body.idNumber || '').trim()) {
    return NextResponse.json({ error: 'Choose an ID type and enter its number.' }, { status: 400 });
  }
  updateDB((db) => {
    const profile = db.profiles.find((p) => p.userId === user.id);
    if (!profile) return;
    profile.verification = {
      status: 'pending_review',
      idType: String(body.idType),
      idNumber: String(body.idNumber).trim().slice(0, 40),
      evidenceName: String(body.evidenceName || 'evidence').slice(0, 120),
      submittedAt: nowISO(),
      note: 'Awaiting manual review (simulated in this prototype).',
    };
  });
  return NextResponse.json({ ok: true, status: 'pending_review' });
}
