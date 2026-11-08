import { NextResponse } from 'next/server';
import { updateDB, id, nowISO, slugify, type Shirt } from '@/lib/store';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const { type } = await req.json().catch(() => ({}));
  if (type !== 'tee' && type !== 'longsleeve') {
    return NextResponse.json({ error: 'Invalid shirt type.' }, { status: 400 });
  }
  const result = updateDB((db) => {
    if (db.shirts.some((s) => s.ownerId === user.id && s.type === type)) {
      return { error: 'You already have this shirt — each owner gets one of each design.' };
    }
    const shirt: Shirt = {
      id: id('shr'), ownerId: user.id, type,
      slug: slugify(`${user.name.split(' ')[0]}-${type === 'tee' ? 'signs-out' : 'longsleeve'}`),
      createdAt: nowISO(),
    };
    db.shirts.push(shirt);
    return { shirt };
  });
  if ('error' in result) return NextResponse.json(result, { status: 409 });
  return NextResponse.json({ ok: true, shirt: result.shirt });
}
