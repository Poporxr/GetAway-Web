'use client';

// Browser-only store for the SignOut mockup. The entire "database" lives in
// the visitor's own localStorage under a versioned key and is seeded on first
// load with the demo data. Nothing is stored on any server: clearing browser
// storage resets the app to the pristine seed. All business rules that used
// to live behind API routes (pricing, settlement, entitlements, signature
// validation, balances, gates) run here, unchanged.

import type { ShirtType, Surface } from './uv';
import { quote, POLICY_VERSION } from './money';
import { signatureBox, withinBounds, findCollision, MAX_SIGNATURES_PER_SHIRT } from './signatures';
import { MAX_TEXT_LEN } from './text';

// ---------- types (same shapes the old server store used) ----------
export interface User { id: string; name: string; email: string; passwordHash: string; createdAt: string }
export type VerificationStatus = 'not_submitted' | 'pending_review' | 'verified' | 'rejected';
export interface Profile {
  userId: string;
  school: string; department: string;
  bankName: string; bankCode: string; accountNumber: string; accountName: string;
  commissionAcceptedAt: string | null; policyVersion: string | null;
  verification: {
    status: VerificationStatus; idType?: string; idNumber?: string;
    evidenceName?: string; submittedAt?: string; note?: string;
  };
}
export interface Shirt { id: string; ownerId: string; type: ShirtType; slug: string; createdAt: string }
export type PaymentStatus = 'pending' | 'success' | 'failed';
export interface Payment {
  id: string; reference: string; shirtId: string;
  contributorName: string; contributorEmail: string;
  giftKobo: number; size: number; surchargeKobo: number; totalKobo: number;
  platformFeeKobo: number; ownerShareKobo: number;
  status: PaymentStatus; attempts: number; createdAt: string; paidAt?: string;
}
export interface Entitlement {
  id: string; token: string; paymentId: string; shirtId: string; size: number;
  expiresAt: string; usedAt?: string; createdAt: string;
}
export interface Stroke { color: string; width: number; points: { x: number; y: number }[] }
export interface SignatureRec {
  id: string; shirtId: string; paymentId: string; contributorName: string;
  surface: Surface; x: number; y: number; w: number; h: number; rotation: number;
  color: string; mode: 'draw' | 'type' | 'text';
  strokes?: Stroke[]; text?: string; font?: string; aspect: number; size: number;
  createdAt: string;
}
export interface LedgerEntry {
  id: string; ownerId: string; paymentId?: string; withdrawalId?: string;
  type: 'earning' | 'withdrawal'; amountKobo: number;
  status: 'available' | 'pending' | 'paid'; createdAt: string;
}
export interface Withdrawal {
  id: string; ownerId: string; amountKobo: number; status: 'pending' | 'paid' | 'failed';
  idempotencyKey: string; createdAt: string;
}
export interface DB {
  users: User[]; profiles: Profile[]; shirts: Shirt[]; payments: Payment[];
  entitlements: Entitlement[]; signatures: SignatureRec[]; ledger: LedgerEntry[];
  withdrawals: Withdrawal[];
}

// ---------- persistence (localStorage only) ----------
export const DB_KEY = 'signout-db-v1';
export const SESSION_KEY = 'signout-session-v1';

let cache: DB | null = null;

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null; // storage blocked (private mode etc.): run on the in-memory copy
  }
}

export function loadDB(): DB {
  if (cache) return cache;
  const store = storage();
  if (!store) return seed(); // non-browser context: throwaway copy, never cached
  try {
    const raw = store.getItem(DB_KEY);
    if (raw) {
      cache = JSON.parse(raw) as DB;
      return cache;
    }
  } catch { /* corrupted store: fall through and reseed */ }
  const db = seed();
  persist(db);
  return db;
}

export function persist(db: DB) {
  cache = db;
  const store = storage();
  if (!store) return;
  try {
    store.setItem(DB_KEY, JSON.stringify(db));
  } catch { /* quota/blocked: the in-memory cache still serves this tab */ }
}

export function updateDB<T>(fn: (db: DB) => T): T {
  const db = loadDB();
  const out = fn(db);
  persist(db);
  return out;
}

// ---------- ids / time ----------
function randomHex(bytes: number): string {
  let out = '';
  const c = (globalThis as any).crypto as Crypto | undefined;
  if (c?.getRandomValues) {
    const arr = new Uint8Array(bytes);
    c.getRandomValues(arr);
    for (const b of arr) out += b.toString(16).padStart(2, '0');
    return out;
  }
  for (let i = 0; i < bytes; i++) out += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return out;
}

export const id = (p: string) => `${p}_${randomHex(6)}`;
export const nowISO = () => new Date().toISOString();
export const slugify = (name: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'shirt'}-${randomHex(3)}`;

// ---------- password hashing (mockup-grade) ----------
// The old server store used node scrypt, which cannot run in a browser. This
// is a tiny synchronous salted hash (FNV-1a rounds) — fine for a local mockup
// where the "database" sits on the visitor's own device; it is NOT real
// password security and must never ship to production.
export function hashPassword(password: string): string {
  const salt = randomHex(8);
  return `${salt}:${hashWithSalt(password, salt)}`;
}
function hashWithSalt(password: string, salt: string): string {
  let h1 = 0x811c9dc5, h2 = 0x1000193;
  const input = `${salt}:${password}`;
  for (let round = 0; round < 64; round++) {
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ (ch + round), 0x85ebca6b) >>> 0;
    }
    h1 = (h1 ^ (h2 << 13)) >>> 0;
    h2 = (h2 ^ (h1 >>> 7)) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  return hashWithSalt(password, salt) === hash;
}

// ---------- session (localStorage holds the current user id) ----------
export function getSessionUserId(): string | null {
  const store = storage();
  if (!store) return null;
  try { return store.getItem(SESSION_KEY); } catch { return null; }
}
export function setSessionUserId(userId: string) {
  const store = storage();
  if (!store) return;
  try { store.setItem(SESSION_KEY, userId); } catch { /* ignore */ }
}
export function clearSession() {
  const store = storage();
  if (!store) return;
  try { store.removeItem(SESSION_KEY); } catch { /* ignore */ }
}
export function currentUser(): User | null {
  const userId = getSessionUserId();
  if (!userId) return null;
  return loadDB().users.find((u) => u.id === userId) ?? null;
}
export function currentProfile(): Profile | null {
  const user = currentUser();
  if (!user) return null;
  return loadDB().profiles.find((p) => p.userId === user.id) ?? null;
}

// ---------- seed (identical demo data to the old server store) ----------
function typedSig(partial: Partial<SignatureRec> & Pick<SignatureRec, 'shirtId' | 'paymentId' | 'contributorName' | 'surface' | 'x' | 'y' | 'text' | 'color' | 'size'>): SignatureRec {
  const aspect = partial.aspect ?? Math.max(1.6, (partial.text!.length * 0.42));
  const w = partial.w ?? ({ 1: 0.36, 2: 0.5, 3: 0.62, 4: 0.76 } as Record<number, number>)[partial.size];
  return {
    id: id('sig'), mode: 'type', rotation: 0, aspect,
    w, h: partial.h ?? 0, createdAt: nowISO(), ...partial,
  } as SignatureRec;
}

function seed(): DB {
  const db: DB = { users: [], profiles: [], shirts: [], payments: [], entitlements: [], signatures: [], ledger: [], withdrawals: [] };
  const owner: User = {
    id: id('usr'), name: 'Adaeze Nwosu', email: 'demo@signout.ng',
    passwordHash: hashPassword('demo1234'), createdAt: '2026-10-28T09:00:00.000Z',
  };
  db.users.push(owner);
  db.profiles.push({
    userId: owner.id,
    school: 'University of Lagos (UNILAG)', department: 'Computer Science',
    bankName: 'Guaranty Trust Bank (GTBank)', bankCode: '058',
    accountNumber: '0123456789', accountName: 'Adaeze Nwosu',
    commissionAcceptedAt: '2026-10-28T09:05:00.000Z', policyVersion: 'v1.0',
    verification: { status: 'not_submitted' },
  });
  const tee: Shirt = { id: id('shr'), ownerId: owner.id, type: 'tee', slug: 'adaeze-signs-out-k7x2', createdAt: '2026-10-28T09:06:00.000Z' };
  const longsleeve: Shirt = { id: id('shr'), ownerId: owner.id, type: 'longsleeve', slug: 'adaeze-longsleeve-m3p9', createdAt: '2026-10-28T09:07:00.000Z' };
  db.shirts.push(tee, longsleeve);

  const mkPayment = (shirtId: string, ref: string, name: string, giftKobo: number, size: number, surchargeKobo: number, feeKobo: number, daysAgo: number, ledgerStatus: 'available' | 'pending'): Payment => {
    const total = giftKobo + surchargeKobo;
    const p: Payment = {
      id: id('pay'), reference: ref, shirtId, contributorName: name, contributorEmail: '',
      giftKobo, size, surchargeKobo, totalKobo: total, platformFeeKobo: feeKobo,
      ownerShareKobo: total - feeKobo, status: 'success', attempts: 1,
      createdAt: new Date(Date.now() - daysAgo * 86400_000).toISOString(),
      paidAt: new Date(Date.now() - daysAgo * 86400_000).toISOString(),
    };
    db.payments.push(p);
    db.ledger.push({ id: id('led'), ownerId: owner.id, paymentId: p.id, type: 'earning', amountKobo: p.ownerShareKobo, status: ledgerStatus, createdAt: p.createdAt });
    return p;
  };

  const p1 = mkPayment(tee.id, 'SO-DEMO-0001', 'Blessing A.', 200_000, 1, 0, 20_000, 3, 'available');
  const p2 = mkPayment(tee.id, 'SO-DEMO-0002', 'Tobi M.', 500_000, 2, 50_000, 55_000, 2, 'available');
  const p3 = mkPayment(tee.id, 'SO-DEMO-0003', 'Mum', 1_000_000, 4, 100_000, 110_000, 1, 'available');
  const p4 = mkPayment(tee.id, 'SO-DEMO-0004', 'Kunle S.', 300_000, 1, 0, 30_000, 1, 'available');
  const p5 = mkPayment(tee.id, 'SO-DEMO-0005', 'Fatima B.', 500_000, 3, 70_000, 57_000, 0, 'pending');
  const p6 = mkPayment(longsleeve.id, 'SO-DEMO-0006', 'Chidi O.', 200_000, 1, 0, 20_000, 4, 'available');

  db.signatures.push(
    typedSig({ shirtId: tee.id, paymentId: p1.id, contributorName: 'Blessing A.', surface: 'front', x: 0.30, y: 0.30, text: 'Blessing A.', color: '#1e40d8', size: 1, rotation: -4 }),
    typedSig({ shirtId: tee.id, paymentId: p2.id, contributorName: 'Tobi M.', surface: 'front', x: 0.62, y: 0.48, text: 'Tobi M.', color: '#1f2430', size: 2, rotation: 3 }),
    typedSig({ shirtId: tee.id, paymentId: p3.id, contributorName: 'Mum', surface: 'front', x: 0.50, y: 0.72, text: 'Mum ❤', color: '#d81f3e', size: 4, rotation: -2 }),
    typedSig({ shirtId: tee.id, paymentId: p4.id, contributorName: 'Kunle S.', surface: 'back', x: 0.42, y: 0.35, text: 'Kunle S.', color: '#0d9e57', size: 1, rotation: 5 }),
    typedSig({ shirtId: tee.id, paymentId: p5.id, contributorName: 'Fatima B.', surface: 'back', x: 0.55, y: 0.58, text: 'Fatima B.', color: '#0f766e', size: 3, rotation: -3 }),
    typedSig({ shirtId: longsleeve.id, paymentId: p6.id, contributorName: 'Chidi O.', surface: 'front', x: 0.50, y: 0.40, text: 'Chidi O.', color: '#1e40d8', size: 1, rotation: 0 }),
  );
  // fill in footprint heights with the shared box math (region aspect differs per shirt)
  for (const s of db.signatures) {
    const shirt = db.shirts.find((sh) => sh.id === s.shirtId)!;
    s.h = signatureBox(shirt.type, s.surface, s.size, s.aspect, s.x, s.y).h;
  }
  return db;
}

// ---------- derived views ----------
export function ownerBalance(db: DB, ownerId: string) {
  let available = 0, pending = 0, withdrawn = 0;
  for (const e of db.ledger) {
    if (e.ownerId !== ownerId) continue;
    if (e.type === 'earning') {
      if (e.status === 'available') available += e.amountKobo;
      if (e.status === 'pending') pending += e.amountKobo;
    }
    if (e.type === 'withdrawal' && e.status === 'paid') withdrawn += e.amountKobo;
  }
  // pending withdrawals hold funds from the available bucket
  for (const w of db.withdrawals) {
    if (w.ownerId === ownerId && w.status === 'pending') available -= w.amountKobo;
  }
  const ownerShirts = db.shirts.filter((s) => s.ownerId === ownerId).map((s) => s.id);
  const payments = db.payments.filter((p) => ownerShirts.includes(p.shirtId) && p.status === 'success');
  return {
    availableKobo: available, pendingKobo: pending, withdrawnKobo: withdrawn,
    giftCount: payments.length,
    grossKobo: payments.reduce((s, p) => s + p.totalKobo, 0),
    feesKobo: payments.reduce((s, p) => s + p.platformFeeKobo, 0),
    signatureCount: db.signatures.filter((s) => ownerShirts.includes(s.shirtId)).length,
  };
}

// ---------- auth operations ----------
export function signup(input: { name?: string; email?: string; password?: string }):
  | { ok: true; user: User; onboarded: boolean }
  | { ok: false; error: string } {
  const { name, email, password } = input;
  if (!name?.trim() || !email?.includes('@') || !password || String(password).length < 6) {
    return { ok: false, error: 'Enter your name, a valid email and a password of 6+ characters.' };
  }
  const db = loadDB();
  if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return { ok: false, error: 'An account with this email already exists. Please log in.' };
  }
  const user: User = { id: id('usr'), name: String(name).trim(), email: String(email).trim(), passwordHash: hashPassword(String(password)), createdAt: nowISO() };
  updateDB((d) => {
    d.users.push(user);
    d.profiles.push({
      userId: user.id, school: '', department: '', bankName: '', bankCode: '',
      accountNumber: '', accountName: '', commissionAcceptedAt: null, policyVersion: null,
      verification: { status: 'not_submitted' },
    });
  });
  setSessionUserId(user.id);
  return { ok: true, user, onboarded: false };
}

export function login(input: { email?: string; password?: string }):
  | { ok: true; user: User; onboarded: boolean }
  | { ok: false; error: string } {
  const { email, password } = input;
  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
    return { ok: false, error: 'Email or password is incorrect.' };
  }
  const profile = db.profiles.find((p) => p.userId === user.id);
  setSessionUserId(user.id);
  return { ok: true, user, onboarded: Boolean(profile?.commissionAcceptedAt) };
}

export function logout() {
  clearSession();
}

// ---------- onboarding (order enforced: school → bank → commission) ----------
export function onboardingStep(userId: string, body: any): { ok: true } | { ok: false; error: string } {
  return updateDB((db) => {
    const profile = db.profiles.find((p) => p.userId === userId);
    if (!profile) return { ok: false as const, error: 'Profile not found.' };
    if (body.step === 'school') {
      if (!body.school?.trim() || !body.department?.trim()) return { ok: false as const, error: 'School and department are required.' };
      profile.school = String(body.school).trim();
      profile.department = String(body.department).trim();
      return { ok: true as const };
    }
    if (body.step === 'bank') {
      if (!profile.school) return { ok: false as const, error: 'Complete the school step first.' };
      if (!body.bankName || !/^\d{10}$/.test(String(body.accountNumber || '')) || !body.accountName?.trim()) {
        return { ok: false as const, error: 'Choose your bank, enter the 10-digit account number and the account name.' };
      }
      profile.bankName = String(body.bankName);
      profile.bankCode = String(body.bankCode || '');
      profile.accountNumber = String(body.accountNumber);
      profile.accountName = String(body.accountName).trim();
      return { ok: true as const };
    }
    if (body.step === 'commission') {
      if (!profile.bankName) return { ok: false as const, error: 'Complete the bank step first.' };
      if (body.accepted !== true) return { ok: false as const, error: 'You must acknowledge the 10% commission to continue.' };
      profile.commissionAcceptedAt = nowISO();
      profile.policyVersion = POLICY_VERSION;
      return { ok: true as const };
    }
    return { ok: false as const, error: 'Unknown step.' };
  });
}

// ---------- shirts ----------
export function createShirt(userId: string, type: string):
  | { ok: true; shirt: Shirt }
  | { ok: false; error: string } {
  if (type !== 'tee' && type !== 'longsleeve') {
    return { ok: false, error: 'Invalid shirt type.' };
  }
  return updateDB((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return { ok: false as const, error: 'Not signed in.' };
    if (db.shirts.some((s) => s.ownerId === userId && s.type === type)) {
      return { ok: false as const, error: 'You already have this shirt — each owner gets one of each design.' };
    }
    const shirt: Shirt = {
      id: id('shr'), ownerId: userId, type: type as ShirtType,
      slug: slugify(`${user.name.split(' ')[0]}-${type === 'tee' ? 'signs-out' : 'longsleeve'}`),
      createdAt: nowISO(),
    };
    db.shirts.push(shirt);
    return { ok: true as const, shirt };
  });
}

export interface PublicShirtView {
  shirt: Shirt;
  owner: { name: string; school: string; department: string };
  signatures: SignatureRec[];
  gifts: Payment[];
  giftCount: number;
  full: boolean;
}

export function getPublicShirt(slug: string): { ok: true; view: PublicShirtView } | { ok: false; error: string } {
  const db = loadDB();
  const shirt = db.shirts.find((s) => s.slug === slug);
  if (!shirt) return { ok: false, error: 'Shirt not found.' };
  const owner = db.users.find((u) => u.id === shirt.ownerId);
  const profile = db.profiles.find((p) => p.userId === shirt.ownerId);
  const signatures = db.signatures.filter((s) => s.shirtId === shirt.id);
  const gifts = db.payments
    .filter((p) => p.shirtId === shirt.id && p.status === 'success')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    ok: true,
    view: {
      shirt,
      owner: { name: owner?.name ?? 'A graduate', school: profile?.school ?? '', department: profile?.department ?? '' },
      signatures,
      gifts,
      giftCount: gifts.length,
      full: signatures.length >= MAX_SIGNATURES_PER_SHIRT,
    },
  };
}

// ---------- checkout + mock payment settlement ----------
// Creates a pending payment with an authoritative quote. The client never
// sets prices: gift + size go in, the totals are computed here from money.ts.
export function createCheckout(input: { slug?: string; contributorName?: string; contributorEmail?: string; giftNaira?: number; size?: number }):
  | { ok: true; reference: string }
  | { ok: false; error: string } {
  const db = loadDB();
  const shirt = db.shirts.find((s) => s.slug === input.slug);
  if (!shirt) return { ok: false, error: 'Shirt not found.' };
  if (!String(input.contributorName || '').trim()) {
    return { ok: false, error: 'Your name is required.' };
  }
  const sigCount = db.signatures.filter((s) => s.shirtId === shirt.id).length;
  if (sigCount >= MAX_SIGNATURES_PER_SHIRT) {
    return { ok: false, error: 'This shirt is full — no more signatures fit.' };
  }
  const giftKobo = Math.round(Number(input.giftNaira) * 100);
  const q = quote(giftKobo, Number(input.size));
  if (!q.ok) return { ok: false, error: q.error! };

  const payment: Payment = {
    id: id('pay'),
    reference: `SO-${Date.now().toString(36).toUpperCase()}${randomHex(2).toUpperCase()}`,
    shirtId: shirt.id,
    contributorName: String(input.contributorName).trim().slice(0, 60),
    contributorEmail: String(input.contributorEmail || '').trim().slice(0, 120),
    giftKobo: q.giftKobo, size: q.size, surchargeKobo: q.surchargeKobo,
    totalKobo: q.totalKobo, platformFeeKobo: q.platformFeeKobo, ownerShareKobo: q.ownerShareKobo,
    status: 'pending', attempts: 0, createdAt: nowISO(),
  };
  updateDB((d) => { d.payments.push(payment); });
  return { ok: true, reference: payment.reference };
}

// Settlement seam — with real Paystack this is where the webhook / verified
// amount lands; everything downstream (entitlement, ledger) stays the same.
export const ENTITLEMENT_TTL_MS = 24 * 60 * 60 * 1000; // signing pass valid 24h (demo-friendly "short-lived")

export function settlePayment(reference: string, verifiedAmountKobo: number):
  | { ok: true; payment: Payment; entitlement: Entitlement }
  | { ok: false; error: string } {
  return updateDB<{ ok: true; payment: Payment; entitlement: Entitlement } | { ok: false; error: string }>((db) => {
    const payment = db.payments.find((p) => p.reference === reference);
    if (!payment) return { ok: false as const, error: 'Payment not found.' };
    if (payment.status === 'success') {
      const existing = db.entitlements.find((e) => e.paymentId === payment.id);
      if (existing) return { ok: true as const, payment, entitlement: existing };
    }
    if (verifiedAmountKobo !== payment.totalKobo) {
      return { ok: false as const, error: 'Paid amount does not match the quoted total.' };
    }
    payment.status = 'success';
    payment.paidAt = nowISO();
    const entitlement: Entitlement = {
      id: id('ent'), token: randomHex(24),
      paymentId: payment.id, shirtId: payment.shirtId, size: payment.size,
      expiresAt: new Date(Date.now() + ENTITLEMENT_TTL_MS).toISOString(),
      createdAt: nowISO(),
    };
    db.entitlements.push(entitlement);
    const shirt = db.shirts.find((s) => s.id === payment.shirtId);
    if (shirt) {
      db.ledger.push({
        id: id('led'), ownerId: shirt.ownerId, paymentId: payment.id,
        type: 'earning', amountKobo: payment.ownerShareKobo, status: 'available', createdAt: nowISO(),
      });
    }
    return { ok: true as const, payment, entitlement };
  });
}

export function recordFailedAttempt(reference: string) {
  updateDB((db) => {
    const payment = db.payments.find((p) => p.reference === reference);
    if (payment && payment.status !== 'success') payment.attempts += 1;
  });
}

export function publicPaymentView(db: DB, payment: Payment) {
  const entitlement = payment.status === 'success'
    ? db.entitlements.find((e) => e.paymentId === payment.id)
    : undefined;
  return {
    reference: payment.reference,
    contributorName: payment.contributorName,
    giftKobo: payment.giftKobo, surchargeKobo: payment.surchargeKobo,
    totalKobo: payment.totalKobo, platformFeeKobo: payment.platformFeeKobo,
    ownerShareKobo: payment.ownerShareKobo, size: payment.size,
    status: payment.status, attempts: payment.attempts,
    entitlementToken: entitlement?.token ?? null,
    entitlementUsed: entitlement?.usedAt ?? null,
  };
}

export type PaymentPageView = ReturnType<typeof publicPaymentView> & { shirtSlug: string; ownerName: string };

export function getPaymentView(reference: string): { ok: true; view: PaymentPageView } | { ok: false; error: string } {
  const db = loadDB();
  const payment = db.payments.find((p) => p.reference === reference);
  if (!payment) return { ok: false, error: 'Payment not found.' };
  const shirt = db.shirts.find((s) => s.id === payment.shirtId);
  const owner = db.users.find((u) => u.id === shirt?.ownerId);
  return {
    ok: true,
    view: { ...publicPaymentView(db, payment), shirtSlug: shirt?.slug ?? '', ownerName: owner?.name ?? '' },
  };
}

// MOCK gateway confirm. In production this step does not exist client-side:
// Paystack redirects back and settlement happens via settlePayment() with the
// gateway-confirmed amount.
export function confirmPayment(reference: string, outcome: string):
  | { ok: true; entitlementToken: string }
  | { ok: false; error: string } {
  const db = loadDB();
  const payment = db.payments.find((p) => p.reference === reference);
  if (!payment) return { ok: false, error: 'Payment not found.' };
  if (outcome === 'failure') {
    recordFailedAttempt(reference);
    return { ok: false, error: 'The mock bank declined this card. Try the test card to succeed.' };
  }
  if (outcome !== 'success') return { ok: false, error: 'Invalid outcome.' };
  // The mock gateway "verifies" the exact quoted total, like Paystack's verify would.
  const result = settlePayment(reference, payment.totalKobo);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, entitlementToken: result.entitlement.token };
}

// ---------- signing ----------
export interface EntitlementView {
  shirt: { id: string; type: ShirtType; slug: string };
  owner: { name: string; school: string; department: string };
  contributorName: string;
  size: number;
  expiresAt: string;
  signatures: SignatureRec[];
}

export function getEntitlementView(token: string): { ok: true; view: EntitlementView } | { ok: false; error: string } {
  const db = loadDB();
  const ent = db.entitlements.find((e) => e.token === token);
  if (!ent) return { ok: false, error: 'This signing link is not valid.' };
  if (ent.usedAt) return { ok: false, error: 'This signing pass has already been used — one signature per gift.' };
  if (new Date(ent.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: 'This signing pass has expired. Your payment is safe — contact the shirt owner.' };
  }
  const shirt = db.shirts.find((s) => s.id === ent.shirtId);
  const payment = db.payments.find((p) => p.id === ent.paymentId);
  const owner = db.users.find((u) => u.id === shirt?.ownerId);
  const profile = db.profiles.find((p) => p.userId === shirt?.ownerId);
  if (!shirt || !payment) return { ok: false, error: 'Signing pass is incomplete.' };
  return {
    ok: true,
    view: {
      shirt: { id: shirt.id, type: shirt.type, slug: shirt.slug },
      owner: { name: owner?.name ?? '', school: profile?.school ?? '', department: profile?.department ?? '' },
      contributorName: payment.contributorName,
      size: ent.size,
      expiresAt: ent.expiresAt,
      signatures: db.signatures.filter((s) => s.shirtId === shirt.id),
    },
  };
}

// Consumes a signing entitlement and persists the signature. All entitlement,
// bounds and collision rules are re-validated here — the editor UI is never
// trusted on its own.
export function submitSignature(token: string, body: any):
  | { ok: true; signature: SignatureRec }
  | { ok: false; error: string } {
  const result = updateDB<{ error: string } | { signature: SignatureRec }>((db) => {
    const ent = db.entitlements.find((e) => e.token === token);
    if (!ent) return { error: 'Signing pass not found.' };
    if (ent.usedAt) return { error: 'This signing pass has already been used.' };
    if (new Date(ent.expiresAt).getTime() < Date.now()) return { error: 'This signing pass has expired.' };
    const shirt = db.shirts.find((s) => s.id === ent.shirtId);
    const payment = db.payments.find((p) => p.id === ent.paymentId);
    if (!shirt || !payment || payment.status !== 'success') return { error: 'Payment for this pass is not settled.' };
    if (body.surface !== 'front' && body.surface !== 'back') return { error: 'Choose the front or the back.' };

    const existing = db.signatures.filter((s) => s.shirtId === shirt.id);
    if (existing.length >= MAX_SIGNATURES_PER_SHIRT) return { error: 'This shirt is full.' };

    // sanitize the signature asset
    const aspect = Math.max(0.5, Math.min(6, Number(body.aspect) || 2.5));
    const color = /^#[0-9a-fA-F]{6}$/.test(String(body.color)) ? String(body.color) : '#1f2430';
    let strokes: Stroke[] | undefined;
    let text: string | undefined;
    let font: string | undefined;
    if (body.mode === 'draw') {
      if (!Array.isArray(body.strokes) || !body.strokes.length) return { error: 'Your signature looks empty.' };
      let totalPoints = 0;
      strokes = [];
      for (const s of body.strokes.slice(0, 60)) {
        if (!Array.isArray(s?.points)) continue;
        totalPoints += s.points.length;
        strokes.push({
          color: /^#[0-9a-fA-F]{6}$/.test(String(s.color)) ? String(s.color) : color,
          width: Math.max(0.002, Math.min(0.08, Number(s.width) || 0.01)),
          points: s.points.slice(0, 1200).map((p: any) => ({
            x: Math.max(0, Math.min(1, Number(p.x) || 0)),
            y: Math.max(0, Math.min(1, Number(p.y) || 0)),
          })),
        });
      }
      if (totalPoints > 20000 || !strokes.length) return { error: 'Signature drawing is too large.' };
    } else if (body.mode === 'type' || body.mode === 'text') {
      // 'type' is the legacy single-font mode; new clients send 'text' with a
      // font choice and may include emojis. Both store the same way.
      text = String(body.text || '').trim().slice(0, MAX_TEXT_LEN);
      if (!text) return { error: 'Write something first — a name, a note, an emoji.' };
      font = ['hand', 'sans', 'display'].includes(String(body.font)) ? String(body.font) : 'hand';
      body.mode = 'text';
    } else {
      return { error: 'Invalid signature mode.' };
    }

    const x = Number(body.x), y = Number(body.y);
    const rotation = Math.max(-30, Math.min(30, Number(body.rotation) || 0));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { error: 'Invalid placement.' };
    // the signer may shrink the box below the entitlement's width, never above
    const scale = Math.max(0.4, Math.min(1, Number(body.scale) || 1));
    const box = signatureBox(shirt.type, body.surface, ent.size, aspect, x, y, scale);
    if (!withinBounds(box)) return { error: 'Your signature crosses the edge of the signing area.' };
    if (findCollision(shirt.type, body.surface, box, existing)) {
      return { error: 'That spot overlaps another signature. Pick a free space.' };
    }

    const sig: SignatureRec = {
      id: id('sig'), shirtId: shirt.id, paymentId: payment.id,
      contributorName: payment.contributorName,
      surface: body.surface, x, y, w: box.w, h: box.h, rotation,
      color, mode: body.mode, strokes, text, font, aspect, size: ent.size,
      createdAt: nowISO(),
    };
    db.signatures.push(sig);
    ent.usedAt = nowISO();
    return { signature: sig };
  });
  if ('error' in result) return { ok: false, error: result.error };
  return { ok: true, signature: result.signature };
}

// ---------- verification + withdrawals ----------
// Owner submits student-verification evidence. Admin review is out of scope
// for the prototype: the status simply stays "pending_review" (simulated queue).
export function submitVerification(userId: string, body: { idType?: string; idNumber?: string; evidenceName?: string }):
  | { ok: true; status: VerificationStatus }
  | { ok: false; error: string } {
  if (!body.idType || !String(body.idNumber || '').trim()) {
    return { ok: false, error: 'Choose an ID type and enter its number.' };
  }
  updateDB((db) => {
    const profile = db.profiles.find((p) => p.userId === userId);
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
  return { ok: true, status: 'pending_review' };
}

export function getWithdrawalsView(userId: string) {
  const db = loadDB();
  return {
    balance: ownerBalance(db, userId),
    withdrawals: db.withdrawals.filter((w) => w.ownerId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export function requestWithdrawal(userId: string, input: { amountNaira?: number; idempotencyKey?: string }):
  | { ok: true; withdrawal: Withdrawal; deduped: boolean }
  | { ok: false; error: string } {
  const amountKobo = Math.round(Number(input.amountNaira) * 100);
  const key = String(input.idempotencyKey || '');
  if (!key) return { ok: false, error: 'Missing idempotency key.' };
  if (!Number.isInteger(amountKobo) || amountKobo < 10_000) {
    return { ok: false, error: 'Minimum withdrawal is ₦100.' };
  }
  const result = updateDB<{ error: string } | { withdrawal: Withdrawal; deduped?: boolean }>((db) => {
    const existing = db.withdrawals.find((w) => w.idempotencyKey === key && w.ownerId === userId);
    if (existing) return { withdrawal: existing, deduped: true };
    const profile = db.profiles.find((p) => p.userId === userId);
    if (!profile || profile.verification.status !== 'verified') {
      return { error: 'You must complete student verification before withdrawing.' };
    }
    const balance = ownerBalance(db, userId);
    if (amountKobo > balance.availableKobo) return { error: 'Amount exceeds your available balance.' };
    const w: Withdrawal = { id: id('wdl'), ownerId: userId, amountKobo, status: 'pending', idempotencyKey: key, createdAt: nowISO() };
    db.withdrawals.push(w);
    return { withdrawal: w };
  });
  if ('error' in result) return { ok: false, error: result.error };
  return { ok: true, withdrawal: result.withdrawal, deduped: Boolean((result as any).deduped) };
}
