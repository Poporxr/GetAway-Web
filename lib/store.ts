import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { ShirtType, Surface } from './uv';
import { signatureBox } from './signatures';

// ---------- types ----------
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
  color: string; mode: 'draw' | 'type';
  strokes?: Stroke[]; text?: string; aspect: number; size: number;
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
  withdrawals: Withdrawal[]; sessions: Record<string, { userId: string; createdAt: string }>;
}

// ---------- persistence (single JSON file; sync IO keeps the prototype race-free) ----------
// On Vercel the project filesystem is read-only, so the store lives in /tmp there
// (per-instance and reset on cold starts; fine for a prototype, a real DB comes later).
const DATA_DIR = process.env.VERCEL ? '/tmp/signout-data' : path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'store.json');
let cache: DB | null = null;

export const id = (p: string) => `${p}_${crypto.randomBytes(6).toString('hex')}`;
export const nowISO = () => new Date().toISOString();

export function loadDB(): DB {
  if (cache) return cache;
  try {
    if (fs.existsSync(FILE)) {
      cache = JSON.parse(fs.readFileSync(FILE, 'utf8')) as DB;
      return cache;
    }
  } catch { /* unreadable store: fall through and reseed */ }
  const db = seed();
  persist(db);
  return db;
}
export function persist(db: DB) {
  cache = db;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
  } catch { /* read-only filesystem (serverless): in-memory cache still serves this instance */ }
}
export function updateDB<T>(fn: (db: DB) => T): T {
  const db = loadDB();
  const out = fn(db);
  persist(db);
  return out;
}

// ---------- helpers ----------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), test);
}
export const slugify = (name: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'shirt'}-${crypto.randomBytes(3).toString('hex')}`;

// ---------- seed ----------
function typedSig(partial: Partial<SignatureRec> & Pick<SignatureRec, 'shirtId' | 'paymentId' | 'contributorName' | 'surface' | 'x' | 'y' | 'text' | 'color' | 'size'>): SignatureRec {
  const aspect = partial.aspect ?? Math.max(1.6, (partial.text!.length * 0.42));
  const w = partial.w ?? ({ 1: 0.36, 2: 0.5, 3: 0.62, 4: 0.76 } as Record<number, number>)[partial.size];
  return {
    id: id('sig'), mode: 'type', rotation: 0, aspect,
    w, h: partial.h ?? 0, createdAt: nowISO(), ...partial,
  } as SignatureRec;
}

function seed(): DB {
  const db: DB = { users: [], profiles: [], shirts: [], payments: [], entitlements: [], signatures: [], ledger: [], withdrawals: [], sessions: {} };
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
    typedSig({ shirtId: tee.id, paymentId: p5.id, contributorName: 'Fatima B.', surface: 'back', x: 0.55, y: 0.58, text: 'Fatima B.', color: '#7c3aed', size: 3, rotation: -3 }),
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
