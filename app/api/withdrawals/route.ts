import { NextResponse } from 'next/server';
import { loadDB, updateDB, id, nowISO, ownerBalance, type Withdrawal } from '@/lib/store';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const db = loadDB();
  return NextResponse.json({
    balance: ownerBalance(db, user.id),
    withdrawals: db.withdrawals.filter((w) => w.ownerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const amountKobo = Math.round(Number(body.amountNaira) * 100);
  const key = String(body.idempotencyKey || '');
  if (!key) return NextResponse.json({ error: 'Missing idempotency key.' }, { status: 400 });
  if (!Number.isInteger(amountKobo) || amountKobo < 10_000) {
    return NextResponse.json({ error: 'Minimum withdrawal is ₦100.' }, { status: 400 });
  }
  const result = updateDB((db) => {
    const existing = db.withdrawals.find((w) => w.idempotencyKey === key && w.ownerId === user.id);
    if (existing) return { withdrawal: existing, deduped: true };
    const profile = db.profiles.find((p) => p.userId === user.id);
    if (!profile || profile.verification.status !== 'verified') {
      return { error: 'You must complete student verification before withdrawing.', status: 403 };
    }
    const balance = ownerBalance(db, user.id);
    if (amountKobo > balance.availableKobo) return { error: 'Amount exceeds your available balance.', status: 400 };
    const w: Withdrawal = { id: id('wdl'), ownerId: user.id, amountKobo, status: 'pending', idempotencyKey: key, createdAt: nowISO() };
    db.withdrawals.push(w);
    return { withdrawal: w };
  });
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  return NextResponse.json({ ok: true, withdrawal: result.withdrawal, deduped: Boolean((result as any).deduped) });
}
