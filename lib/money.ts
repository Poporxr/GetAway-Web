// All money is integer kobo (₦1 = 100 kobo). Pricing rules live here and are
// enforced by the local store (lib/localstore.ts); the UI merely displays
// what the store quotes.
export const MIN_GIFT_KOBO = 200_000; // ₦2,000
export const SIZE_UNLOCK_KOBO = 500_000; // gift of ₦5,000+ (before surcharge) unlocks 2x-4x
export const SIZE_SURCHARGE_KOBO: Record<number, number> = {
  1: 0,
  2: 50_000, // +₦500
  3: 70_000, // +₦700
  4: 100_000, // +₦1,000
};
export const COMMISSION_RATE = 0.1; // 10% of the full successful payment
export const POLICY_VERSION = 'v1.0';

export interface Quote {
  ok: boolean;
  error?: string;
  giftKobo: number;
  size: number;
  surchargeKobo: number;
  totalKobo: number;
  platformFeeKobo: number;
  ownerShareKobo: number;
}

export function allowedSizes(giftKobo: number): number[] {
  return giftKobo >= SIZE_UNLOCK_KOBO ? [1, 2, 3, 4] : [1];
}

export function quote(giftKobo: number, size: number): Quote {
  const bad = (error: string): Quote => ({
    ok: false, error, giftKobo, size,
    surchargeKobo: 0, totalKobo: 0, platformFeeKobo: 0, ownerShareKobo: 0,
  });
  if (!Number.isInteger(giftKobo) || giftKobo < MIN_GIFT_KOBO) return bad('Minimum gift is ₦2,000.');
  if (![1, 2, 3, 4].includes(size)) return bad('Invalid signature size.');
  if (size > 1 && giftKobo < SIZE_UNLOCK_KOBO) return bad('Gifts of ₦5,000 or more unlock larger signatures.');
  const surchargeKobo = SIZE_SURCHARGE_KOBO[size];
  const totalKobo = giftKobo + surchargeKobo;
  const platformFeeKobo = Math.round(totalKobo * COMMISSION_RATE);
  return {
    ok: true, giftKobo, size, surchargeKobo, totalKobo,
    platformFeeKobo, ownerShareKobo: totalKobo - platformFeeKobo,
  };
}

/** ₦5,000 · ₦200.50 · trims trailing .00 */
export function fmt(kobo: number): string {
  const naira = kobo / 100;
  const str = Number.isInteger(naira)
    ? naira.toLocaleString('en-NG')
    : naira.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `₦${str}`;
}
