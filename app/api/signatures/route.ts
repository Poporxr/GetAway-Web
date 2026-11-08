import { NextResponse } from 'next/server';
import { updateDB, id, nowISO, type SignatureRec, type Stroke } from '@/lib/store';
import { signatureBox, withinBounds, findCollision, MAX_SIGNATURES_PER_SHIRT } from '@/lib/signatures';

export const dynamic = 'force-dynamic';

// Consumes a signing entitlement and persists the signature. All entitlement,
// bounds and collision rules are re-validated here — the client is never trusted.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = updateDB((db) => {
    const ent = db.entitlements.find((e) => e.token === body.token);
    if (!ent) return { error: 'Signing pass not found.', status: 404 };
    if (ent.usedAt) return { error: 'This signing pass has already been used.', status: 409 };
    if (new Date(ent.expiresAt).getTime() < Date.now()) return { error: 'This signing pass has expired.', status: 410 };
    const shirt = db.shirts.find((s) => s.id === ent.shirtId);
    const payment = db.payments.find((p) => p.id === ent.paymentId);
    if (!shirt || !payment || payment.status !== 'success') return { error: 'Payment for this pass is not settled.', status: 400 };
    if (body.surface !== 'front' && body.surface !== 'back') return { error: 'Choose the front or the back.', status: 400 };

    const existing = db.signatures.filter((s) => s.shirtId === shirt.id);
    if (existing.length >= MAX_SIGNATURES_PER_SHIRT) return { error: 'This shirt is full.', status: 409 };

    // sanitize the signature asset
    const aspect = Math.max(0.8, Math.min(6, Number(body.aspect) || 2.5));
    const color = /^#[0-9a-fA-F]{6}$/.test(String(body.color)) ? String(body.color) : '#1f2430';
    let strokes: Stroke[] | undefined;
    let text: string | undefined;
    if (body.mode === 'draw') {
      if (!Array.isArray(body.strokes) || !body.strokes.length) return { error: 'Your signature looks empty.', status: 400 };
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
      if (totalPoints > 20000 || !strokes.length) return { error: 'Signature drawing is too large.', status: 400 };
    } else if (body.mode === 'type') {
      text = String(body.text || '').trim().slice(0, 24);
      if (!text) return { error: 'Type a signature first.', status: 400 };
    } else {
      return { error: 'Invalid signature mode.', status: 400 };
    }

    const x = Number(body.x), y = Number(body.y);
    const rotation = Math.max(-30, Math.min(30, Number(body.rotation) || 0));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { error: 'Invalid placement.', status: 400 };
    const box = signatureBox(shirt.type, body.surface, ent.size, aspect, x, y);
    if (!withinBounds(box)) return { error: 'Your signature crosses the edge of the signing area.', status: 400 };
    if (findCollision(shirt.type, body.surface, box, existing)) {
      return { error: 'That spot overlaps another signature. Pick a free space.', status: 409 };
    }

    const sig: SignatureRec = {
      id: id('sig'), shirtId: shirt.id, paymentId: payment.id,
      contributorName: payment.contributorName,
      surface: body.surface, x, y, w: box.w, h: box.h, rotation,
      color, mode: body.mode, strokes, text, aspect, size: ent.size,
      createdAt: nowISO(),
    };
    db.signatures.push(sig);
    ent.usedAt = nowISO();
    return { signature: sig };
  });
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, signature: result.signature });
}
