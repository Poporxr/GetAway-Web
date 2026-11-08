import { NextResponse } from 'next/server';
import { loadDB, updateDB, hashPassword, id, nowISO } from '@/lib/store';
import { createSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { name, email, password } = await req.json().catch(() => ({}));
  if (!name?.trim() || !email?.includes('@') || !password || String(password).length < 6) {
    return NextResponse.json({ error: 'Enter your name, a valid email and a password of 6+ characters.' }, { status: 400 });
  }
  const db = loadDB();
  if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 });
  }
  const user = { id: id('usr'), name: String(name).trim(), email: String(email).trim(), passwordHash: hashPassword(String(password)), createdAt: nowISO() };
  updateDB((d) => {
    d.users.push(user);
    d.profiles.push({
      userId: user.id, school: '', department: '', bankName: '', bankCode: '',
      accountNumber: '', accountName: '', commissionAcceptedAt: null, policyVersion: null,
      verification: { status: 'not_submitted' },
    });
  });
  const token = createSession(user.id);
  const res = NextResponse.json({ ok: true, onboarded: false });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
