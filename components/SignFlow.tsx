'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, Loader2, PenLine, Type, XCircle } from 'lucide-react';
import { getEntitlementView, submitSignature, type SignatureRec, type Stroke } from '@/lib/localstore';
import { PEN_COLORS } from '@/lib/lists';
import { signatureBox, withinBounds, findCollision } from '@/lib/signatures';
import type { Surface } from '@/lib/uv';
import ShirtViewer from './ShirtViewer';
import ShirtTemplate from './ShirtTemplate';
import SignaturePad, { type DrawAsset } from './SignaturePad';
import SignaturePreview from './SignaturePreview';

interface EntitlementData {
  shirt: { id: string; type: 'tee' | 'longsleeve'; slug: string };
  owner: { name: string; school: string; department: string };
  contributorName: string;
  size: number;
  expiresAt: string;
  signatures: SignatureRec[];
}

type Asset = { mode: 'draw' | 'type'; color: string; aspect: number; strokes?: Stroke[]; text?: string };

export default function SignFlow({ token }: { token: string }) {
  const [data, setData] = useState<EntitlementData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'create' | 'place' | 'done'>('create');
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [color, setColor] = useState(PEN_COLORS[1].value);
  const [drawAsset, setDrawAsset] = useState<DrawAsset | null>(null);
  const [typed, setTyped] = useState('');
  const [surface, setSurface] = useState<Surface>('front');
  const [center, setCenter] = useState({ x: 0.5, y: 0.45 });
  const [rotation, setRotation] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<SignatureRec | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    // Mockup: the signing pass lives in this browser's local store.
    const result = getEntitlementView(token);
    if (!result.ok) { setError(result.error || 'This signing link is not valid.'); return; }
    setData(result.view);
  }, [token]);

  const typeAspect = useMemo(() => {
    if (!typed.trim()) return 2.5;
    const len = typed.trim().length;
    return Math.max(1.2, Math.min(6, 0.9 + len * 0.34));
  }, [typed]);

  const asset: Asset | null = useMemo(() => {
    if (mode === 'draw') return drawAsset ? { mode, color, aspect: drawAsset.aspect, strokes: drawAsset.strokes } : null;
    return typed.trim() ? { mode, color, aspect: typeAspect, text: typed.trim() } : null;
  }, [mode, drawAsset, typed, color, typeAspect]);

  const box = useMemo(() => {
    if (!data || !asset) return null;
    return signatureBox(data.shirt.type, surface, data.size, asset.aspect, center.x, center.y);
  }, [data, asset, surface, center]);

  const collision = useMemo(() => {
    if (!data || !box) return false;
    return !withinBounds(box) || findCollision(data.shirt.type, surface, box, data.signatures);
  }, [data, box, surface]);

  const onDrag = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !regionRef.current || !box) return;
    const rect = regionRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setCenter({
      x: Math.min(1 - box.w / 2, Math.max(box.w / 2, nx)),
      y: Math.min(1 - box.h / 2, Math.max(box.h / 2, ny)),
    });
  }, [box]);

  const submit = async () => {
    if (!data || !asset || !box || collision) return;
    setSubmitting(true); setSubmitError(null);
    // Mockup: entitlement consumption + signature validation run in the local store.
    const result = submitSignature(token, {
      surface, x: center.x, y: center.y, rotation,
      mode: asset.mode, color: asset.color, aspect: asset.aspect,
      strokes: asset.strokes, text: asset.text,
    });
    if (!result.ok) {
      setSubmitError(result.error || 'Could not save your signature.');
      setSubmitting(false);
      return;
    }
    setPlaced(result.signature);
    setData({ ...data, signatures: [...data.signatures, result.signature] });
    setStep('done');
    setSubmitting(false);
  };

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <XCircle className="mx-auto text-red-400" size={44} />
        <h1 className="mt-3 text-xl font-bold text-stone-800">This signing link can&apos;t be used</h1>
        <p className="mt-2 text-sm text-stone-500">{error}</p>
        <p className="mt-4 text-sm text-stone-500">If you paid and could not sign, ask the shirt owner to check their dashboard — your payment is recorded there.</p>
      </div>
    );
  }
  if (!data) {
    return <div className="flex items-center justify-center gap-2 py-24 text-stone-400"><Loader2 className="animate-spin" /> Loading your signing pass…</div>;
  }

  const previewSig: SignatureRec | null = asset && box ? {
    id: 'preview', shirtId: data.shirt.id, paymentId: '', contributorName: data.contributorName,
    surface, x: center.x, y: center.y, w: box.w, h: box.h, rotation,
    color: asset.color, mode: asset.mode, strokes: asset.strokes, text: asset.text,
    aspect: asset.aspect, size: data.size, createdAt: '',
  } : null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20">
      <div className="pt-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Signing pass · {data.size}× signature</p>
        <h1 className="mt-1 text-2xl font-extrabold text-stone-900">Sign {data.owner.name.split(' ')[0]}&apos;s shirt</h1>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-stone-500">
          <Clock size={14} /> Pass expires {new Date(data.expiresAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-b from-violet-50 to-amber-50 ring-1 ring-stone-200/70">
        <ShirtViewer type={data.shirt.type} signatures={step === 'done' && placed ? data.signatures : data.signatures} height={320} />
      </div>

      {step === 'done' ? (
        <div className="mt-6 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200/70">
          <CheckCircle2 className="mx-auto text-emerald-500" size={46} />
          <h2 className="mt-2 text-xl font-bold text-stone-900">You&apos;re on the shirt! 🎉</h2>
          <p className="mt-1 text-sm text-stone-500">Your signature is saved on the {surface} and now shows on the 3D shirt above, for everyone who opens the link.</p>
          <Link href={`/s/${data.shirt.slug}`} className="mt-4 inline-block rounded-full bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:bg-violet-700">
            View the shirt page
          </Link>
        </div>
      ) : step === 'create' ? (
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-stone-900">1 · Create your signature</h2>
            <div className="flex rounded-full bg-stone-100 p-1">
              {([['draw', PenLine, 'Draw'], ['type', Type, 'Type']] as const).map(([m, Icon, label]) => (
                <button key={m} onClick={() => setMode(m)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${mode === m ? 'bg-white text-violet-700 shadow' : 'text-stone-500'}`}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">Pen:</span>
            {PEN_COLORS.map((c) => (
              <button
                key={c.value} title={c.name} onClick={() => setColor(c.value)}
                className={`h-7 w-7 rounded-full ring-2 ring-offset-2 transition ${color === c.value ? 'ring-violet-500 scale-110' : 'ring-transparent hover:scale-105'}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>

          <div className="mt-4">
            {mode === 'draw' ? (
              <SignaturePad color={color} onChange={setDrawAsset} />
            ) : (
              <div>
                <input
                  value={typed} onChange={(e) => setTyped(e.target.value.slice(0, 24))}
                  placeholder="Type your name or a short shout-out"
                  className="w-full rounded-2xl border-2 border-dashed border-stone-300 bg-white px-4 py-3 text-lg outline-none focus:border-violet-400"
                />
                <div className="mt-3 flex min-h-[64px] items-center justify-center rounded-2xl bg-stone-50 px-4">
                  {typed.trim() ? (
                    <span style={{ fontFamily: 'Caveat, cursive', color, fontWeight: 600 }} className="text-5xl leading-none">{typed.trim()}</span>
                  ) : (
                    <span className="text-sm text-stone-400">Your signature preview appears here</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            disabled={!asset}
            onClick={() => setStep('place')}
            className="mt-5 w-full rounded-full bg-violet-600 py-3.5 text-sm font-bold text-white transition enabled:hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to placement →
          </button>
          <p className="mt-2 text-center text-xs text-stone-400">Signing as {data.contributorName} · one signature per gift</p>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 sm:p-6">
          <h2 className="font-bold text-stone-900">2 · Place it on the shirt</h2>
          <p className="mt-1 text-sm text-stone-500">Drag your signature inside the dashed area. Your size is fixed by your gift ({data.size}×).</p>

          <div className="mt-4 flex justify-center gap-2">
            {(['front', 'back'] as Surface[]).map((s) => (
              <button key={s} onClick={() => setSurface(s)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${surface === s ? 'bg-violet-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="relative mt-2">
            <ShirtTemplate
              type={data.shirt.type}
              surface={surface}
              signatures={data.signatures.filter((s) => s.surface === surface)}
              regionRef={regionRef}
            >
              {previewSig && (
                <div
                  className={`absolute cursor-grab touch-none active:cursor-grabbing ${collision ? 'opacity-70' : ''}`}
                  style={{
                    left: `${center.x * 100}%`, top: `${center.y * 100}%`, width: `${previewSig.w * 100}%`,
                    transform: `translate(-50%,-50%) rotate(${rotation}deg)`,
                    filter: collision ? 'drop-shadow(0 0 6px rgba(220,38,38,.8))' : undefined,
                  }}
                  onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
                  onPointerMove={onDrag}
                  onPointerUp={() => { dragging.current = false; }}
                  onPointerCancel={() => { dragging.current = false; }}
                >
                  <SignaturePreview sig={previewSig} regionWidthPct={previewSig.w * 100} />
                </div>
              )}
            </ShirtTemplate>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-500">Tilt</span>
            <input type="range" min={-25} max={25} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="flex-1 accent-violet-600" />
            <span className="w-10 text-right text-xs text-stone-500">{rotation}°</span>
          </div>

          {collision && (
            <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              <AlertTriangle size={15} /> That spot overlaps another signature or crosses the edge — move it a little.
            </p>
          )}
          {submitError && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{submitError}</p>
          )}

          <div className="mt-5 flex gap-3">
            <button onClick={() => setStep('create')} className="rounded-full bg-stone-100 px-5 py-3.5 text-sm font-bold text-stone-600 hover:bg-stone-200">
              ← Redo signature
            </button>
            <button
              disabled={collision || submitting}
              onClick={submit}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-violet-600 py-3.5 text-sm font-bold text-white transition enabled:hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting && <Loader2 className="animate-spin" size={16} />}
              Sign the shirt 🎉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
