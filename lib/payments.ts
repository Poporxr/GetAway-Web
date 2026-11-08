import crypto from 'node:crypto';
import { updateDB, id, nowISO, type Entitlement, type Payment } from './store';

// This is the webhook/verification seam. With real Paystack, the confirm route
// is replaced by: (1) POST /checkout initialises a Paystack transaction and
// redirects to their hosted page, (2) Paystack's webhook (HMAC-verified) or a
// server-side GET /transaction/verify/:reference returns the paid amount, and
// that verified amount is passed here as `verifiedAmountKobo`. Everything
// downstream (entitlement, ledger) stays exactly the same.
export const ENTITLEMENT_TTL_MS = 24 * 60 * 60 * 1000; // signing pass valid 24h (demo-friendly "short-lived")

export function settlePayment(reference: string, verifiedAmountKobo: number):
  | { ok: true; payment: Payment; entitlement: Entitlement }
  | { ok: false; error: string } {
  return updateDB((db) => {
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
      id: id('ent'), token: crypto.randomBytes(24).toString('hex'),
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

export function publicPaymentView(db: { entitlements: Entitlement[] }, payment: Payment) {
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
