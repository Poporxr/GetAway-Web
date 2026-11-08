import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loadDB, updateDB, type User } from './store';

export const SESSION_COOKIE = 'signout_session';

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  updateDB((db) => { db.sessions[token] = { userId, createdAt: new Date().toISOString() }; });
  return token;
}
export function destroySession(token: string) {
  updateDB((db) => { delete db.sessions[token]; });
}
export async function sessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}
export async function currentUser(): Promise<User | null> {
  const token = await sessionToken();
  if (!token) return null;
  const db = loadDB();
  const sess = db.sessions[token];
  if (!sess) return null;
  return db.users.find((u) => u.id === sess.userId) ?? null;
}
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}
export function sessionCookieOptions() {
  return { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 14 };
}
