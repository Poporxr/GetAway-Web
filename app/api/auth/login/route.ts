import { NextResponse } from 'next/server';
import { loadDB, verifyPassword } from '@/lib/store';
import { createSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }
  const profile = db.profiles.find((p) => p.userId === user.id);
  const token = createSession(user.id);
  const res = NextResponse.json({ ok: true, onboarded: Boolean(profile?.commissionAcceptedAt) });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
