'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Check, CheckCircle2, Clock, Expand, Loader2, PenLine, RotateCw, Smile, Type, XCircle,
} from 'lucide-react';
import { getEntitlementView, submitSignature, type SignatureRec, type Stroke } from '@/lib/localstore';
import { PEN_COLORS } from '@/lib/lists';
import { signatureBox, withinBounds, findCollision, SIZE_WIDTH } from '@/lib/signatures';
import { templatePxScale, type Surface } from '@/lib/uv';
import { TEXT_FONTS, SIGN_EMOJIS, MAX_TEXT_LEN, estimateTextAspect, type TextFontKey } from '@/lib/text';
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

type Tab = 'draw' | 'write' | 'emoji';
type Asset = { mode: 'draw' | 'text'; color: string; aspect: number; strokes?: Stroke[]; text?: string; font?: TextFontKey };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function SignFlow({ token }: { token: string }) {
  const [data, setData] = useState<EntitlementData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'create' | 'place' | 'done'>('create');
  const [tab, setTab] = useState<Tab>('draw');
  const [color, setColor] = useState(PEN_COLORS[1].value);
  const [drawAsset, setDrawAsset] = useState<DrawAsset | null>(null);
  const [text, setText] = useState('');
  const [font, setFont] = useState<TextFontKey>('hand');
  const [surface, setSurface] = useState<Surface>('front');
  const [center, setCenter] = useState({ x: 0.5, y: 0.45 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<SignatureRec | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{ kind: 'move' | 'resize' | 'rotate'; startX: number; startScale: number } | null>(null);
  const lastValid = useRef({ x: 0.5, y: 0.45, scale: 1 });

  useEffect(() => {
    // Mockup: the signing pass lives in this browser's local store.
    const result = getEntitlementView(token);
    if (!result.ok) { setError(result.error || 'This signing link is not valid.'); return; }
    setData(result.view);
  }, [token]);

  // ---- asset (what will be signed) ----
  const textAspect = useMemo(() => {
    if (!data || !text.trim()) return 2.5;
    const boxWidthPx = (SIZE_WIDTH[data.size] ?? 0.36) * templatePxScale(data.shirt.type, surface).x;
    return estimateTextAspect(text, font, boxWidthPx);
  }, [data, text, font, surface]);

  const asset: Asset | null = useMemo(() => {
    if (tab === 'draw') return drawAsset ? { mode: 'draw', color, aspect: drawAsset.aspect, strokes: drawAsset.strokes } : null;
    return text.trim() ? { mode: 'text', color, aspect: textAspect, text: text.trim(), font } : null;
  }, [tab, drawAsset, text, color, textAspect, font]);

  // ---- placement geometry ----
  const box = useMemo(() => {
    if (!data || !asset) return null;
    return signatureBox(data.shirt.type, surface, data.size, asset.aspect, center.x, center.y, scale);
  }, [data, asset, surface, center, scale]);

  const colliding = useMemo(() => {
    if (!data || !box) return false;
    return !withinBounds(box) || findCollision(data.shirt.type, surface, box, data.signatures);
  }, [data, box, surface]);

  useEffect(() => {
    if (!colliding && box) lastValid.current = { x: center.x, y: center.y, scale };
  }, [colliding, box, center, scale]);

  const collidesAt = useCallback((cx: number, cy: number, sc: number) => {
    if (!data || !asset) return true;
    const b = signatureBox(data.shirt.type, surface, data.size, asset.aspect, cx, cy, sc);
    return !withinBounds(b) || findCollision(data.shirt.type, surface, b, data.signatures);
  }, [data, asset, surface]);

  // ---- pointer interactions on the placement box ----
  const regionPoint = (e: React.PointerEvent) => {
    const rect = regionRef.current!.getBoundingClientRect();
    return { fx: (e.clientX - rect.left) / rect.width, fy: (e.clientY - rect.top) / rect.height, rect };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!box) return;
    const handle = (e.target as HTMLElement).closest('[data-handle]')?.getAttribute('data-handle');
    const kind = handle === 'resize' ? 'resize' : handle === 'rotate' ? 'rotate' : 'move';
    dragRef.current = { kind, startX: e.clientX, startScale: scale };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (kind === 'move') onPointerMove(e); // tap-to-jump within the box
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !regionRef.current || !box || !data || !asset) return;
    const { fx, fy, rect } = regionPoint(e);
    if (drag.kind === 'move') {
      const b = signatureBox(data.shirt.type, surface, data.size, asset.aspect, fx, fy, scale);
      setCenter({
        x: clamp(fx, b.w / 2, 1 - b.w / 2),
        y: clamp(fy, b.h / 2, 1 - b.h / 2),
      });
    } else if (drag.kind === 'resize') {
      const maxW = SIZE_WIDTH[data.size] ?? 0.36;
      const dxFrac = (e.clientX - drag.startX) / rect.width;
      let target = clamp((maxW * drag.startScale + dxFrac) / maxW, 0.4, 1);
      // accept the largest scale at or below the target that stays valid
      while (target > 0.4 && collidesAt(center.x, center.y, target)) target = Math.max(0.4, target - 0.02);
      if (!collidesAt(center.x, center.y, target)) setScale(target);
    } else {
      const cxPx = rect.left + center.x * rect.width;
      const cyPx = rect.top + center.y * rect.height;
      let deg = (Math.atan2(e.clientY - cyPx, e.clientX - cxPx) * 180) / Math.PI + 90;
      if (deg > 180) deg -= 360;
      setRotation(Math.round(clamp(deg, -30, 30)));
    }
  };

  const onPointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (colliding) {
      // reject the spot: shake and snap back to the last valid position
      setShakeKey((k) => k + 1);
      setCenter({ x: lastValid.current.x, y: lastValid.current.y });
      setScale(lastValid.current.scale);
    }
  };

  // tap anywhere else in the signing region to move the box there
  const onRegionTap = (e: React.PointerEvent) => {
    if (step !== 'place' || !box || !regionRef.current) return;
    const target = e.target as HTMLElement;
    if (!regionRef.current.contains(target) || target.closest('[data-placement-box]')) return;
    const { fx, fy } = regionPoint(e);
    const cx = clamp(fx, box.w / 2, 1 - box.w / 2);
    const cy = clamp(fy, box.h / 2, 1 - box.h / 2);
    if (collidesAt(cx, cy, scale)) { setShakeKey((k) => k + 1); return; }
    setCenter({ x: cx, y: cy });
  };

  const insertEmoji = (em: string) => {
    const ta = taRef.current;
    const start = ta?.selectionStart ?? text.length;
    const end = ta?.selectionEnd ?? text.length;
    const next = (text.slice(0, start) + em + text.slice(end)).slice(0, MAX_TEXT_LEN);
    setText(next);
    requestAnimationFrame(() => {
      ta?.focus();
      const pos = Math.min(next.length, start + em.length);
      ta?.setSelectionRange(pos, pos);
    });
  };

  const submit = async () => {
    if (!data || !asset || !box || colliding) return;
    setSubmitting(true); setSubmitError(null);
    // Mockup: entitlement consumption + signature validation run in the local store.
    const result = submitSignature(token, {
      surface, x: center.x, y: center.y, rotation, scale,
      mode: asset.mode, color: asset.color, aspect: asset.aspect,
      strokes: asset.strokes, text: asset.text, font: asset.font,
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
        <XCircle className="mx-auto text-red-500" size={44} />
        <h1 className="mt-3 text-xl font-bold tracking-tight text-stone-900">This signing link can&apos;t be used</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">{error}</p>
        <p className="mt-4 text-sm leading-relaxed text-stone-500">If you paid and could not sign, ask the shirt owner to check their dashboard — your payment is recorded there.</p>
      </div>
    );
  }
  if (!data) {
    return <div className="flex items-center justify-center gap-2 py-24 text-stone-400"><Loader2 className="animate-spin" /> Loading your signing pass…</div>;
  }

  const previewSig: SignatureRec | null = asset && box ? {
    id: 'preview', shirtId: data.shirt.id, paymentId: '', contributorName: data.contributorName,
    surface, x: center.x, y: center.y, w: box.w, h: box.h, rotation,
    color: asset.color, mode: asset.mode, strokes: asset.strokes, text: asset.text, font: asset.font,
    aspect: asset.aspect, size: data.size, createdAt: '',
  } : null;

  const stepsMeta = [
    { key: 'create', label: 'Create' },
    { key: 'place', label: 'Place' },
    { key: 'done', label: 'Done' },
  ] as const;
  const stepIdx = stepsMeta.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20">
      <div className="pt-8 text-center">
        <p className="eyebrow">Signing pass · {data.size}× signature</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Sign {data.owner.name.split(' ')[0]}&apos;s shirt</h1>
        <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-stone-500">
          <Clock size={14} /> Pass expires {new Date(data.expiresAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          {stepsMeta.map((s, i) => (
            <span key={s.key} className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${i < stepIdx ? 'bg-emerald-50 text-emerald-700' : i === stepIdx ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                {i < stepIdx ? <Check size={13} /> : <span>{i + 1}</span>} {s.label}
              </span>
              {i < 2 && <span className="h-px w-5 bg-stone-200" />}
            </span>
          ))}
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="bg-[#f4f4f2]">
          <ShirtViewer type={data.shirt.type} signatures={data.signatures} height={320} />
        </div>
      </div>

      {step === 'done' ? (
        <div className="card mt-6 p-6 text-center sm:p-8">
          <CheckCircle2 className="mx-auto text-emerald-600" size={46} />
          <h2 className="mt-3 text-xl font-bold tracking-tight text-stone-900">You&apos;re on the shirt</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-stone-500">
            Your {placed?.mode === 'draw' ? 'signature' : 'message'} is saved on the {surface} and now shows on the 3D shirt above, for everyone who opens the link.
          </p>
          <Link href={`/s/${data.shirt.slug}`} className="btn-primary mt-5">
            View the shirt page
          </Link>
        </div>
      ) : step === 'create' ? (
        <div className="card mt-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold tracking-tight text-stone-900">Create your mark</h2>
            <div className="flex rounded-full bg-stone-100 p-1">
              {([['draw', PenLine, 'Draw'], ['write', Type, 'Write'], ['emoji', Smile, 'Emoji']] as const).map(([t, Icon, label]) => (
                <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${tab === t ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">Ink</span>
            {PEN_COLORS.map((c) => (
              <button
                key={c.value} title={c.name} onClick={() => setColor(c.value)} aria-label={c.name}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition ${color === c.value ? 'scale-110 ring-stone-900' : 'ring-transparent hover:scale-105'}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>

          <div className="mt-4">
            {tab === 'draw' ? (
              <SignaturePad color={color} onChange={setDrawAsset} />
            ) : (
              <div>
                <div className="grid grid-cols-3 gap-2">
                  {TEXT_FONTS.map((f) => (
                    <button
                      key={f.key} type="button" onClick={() => setFont(f.key)}
                      className={`rounded-xl px-3 py-2.5 text-left ring-1 transition ${font === f.key ? 'bg-stone-50 ring-2 ring-stone-900' : 'ring-stone-200 hover:ring-stone-300'}`}
                    >
                      <span className="block truncate text-xl leading-tight text-stone-900" style={{ fontFamily: f.stack, fontWeight: f.weight }}>Ag · Sign</span>
                      <span className="mt-0.5 block text-[11px] font-semibold text-stone-500">{f.label}</span>
                    </button>
                  ))}
                </div>
                <textarea
                  ref={taRef}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LEN))}
                  rows={2}
                  placeholder={tab === 'emoji' ? 'Your name, a short note — make it pop 🎉' : 'Your name, or a short note for the graduate'}
                  className="input mt-3 resize-none text-base"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-stone-400">
                  <span>Names, short notes and emojis all work — it prints exactly as written.</span>
                  <span>{text.length}/{MAX_TEXT_LEN}</span>
                </div>
                {tab === 'emoji' && (
                  <div className="mt-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200/80">
                    <p className="text-xs font-semibold text-stone-500">Tap to insert</p>
                    <div className="mt-2 grid grid-cols-8 gap-1 sm:grid-cols-10">
                      {SIGN_EMOJIS.map((em) => (
                        <button
                          key={em} type="button" onClick={() => insertEmoji(em)}
                          className="flex h-10 items-center justify-center rounded-lg text-xl transition hover:bg-white hover:shadow-sm"
                          aria-label={`Insert ${em}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">Preview</p>
                  {text.trim() ? (
                    <div className="mx-auto mt-1" style={{ aspectRatio: String(textAspect), width: textAspect < 1.1 ? 'min(210px, 70%)' : 'min(340px, 100%)' }}>
                      <SignaturePreview sig={{ mode: 'text', text: text.trim(), color, aspect: textAspect, font }} />
                    </div>
                  ) : (
                    <p className="py-3 text-center text-sm text-stone-400">Your words appear here, in your chosen font</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button disabled={!asset} onClick={() => setStep('place')} className="btn-primary mt-5 w-full py-3.5">
            Continue to placement
          </button>
          <p className="mt-2.5 text-center text-xs text-stone-400">Signing as {data.contributorName} · one signature per gift</p>
        </div>
      ) : (
        <div className="card mt-6 p-5 sm:p-6">
          <h2 className="font-semibold tracking-tight text-stone-900">Place it on the shirt</h2>
          <p className="mt-1 text-sm leading-relaxed text-stone-500">
            Drag the box to move it. Use the corner handle to resize (up to your {data.size}× gift size) and the top handle to tilt.
            The box can&apos;t sit on top of someone else&apos;s ink — if a spot is taken, it springs back.
          </p>

          <div className="mt-4 flex justify-center">
            <div className="flex rounded-full bg-stone-100 p-1">
              {(['front', 'back'] as Surface[]).map((s) => (
                <button key={s} onClick={() => setSurface(s)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${surface === s ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-2" onPointerDown={onRegionTap}>
            <ShirtTemplate
              type={data.shirt.type}
              surface={surface}
              signatures={data.signatures.filter((s) => s.surface === surface)}
              regionRef={regionRef}
            >
              {previewSig && box && (
                <div
                  data-placement-box
                  className="absolute touch-none"
                  style={{
                    left: `${center.x * 100}%`, top: `${center.y * 100}%`,
                    width: `${box.w * 100}%`, height: `${box.h * 100}%`,
                    transform: `translate(-50%,-50%) rotate(${rotation}deg)`,
                    cursor: 'grab',
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  {/* rotate handle */}
                  <div data-handle="rotate" className="absolute -top-10 left-1/2 flex -translate-x-1/2 flex-col items-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-600 shadow-md ring-1 ring-stone-300">
                      <RotateCw size={14} />
                    </span>
                    <span className="h-2 w-px bg-stone-400" />
                  </div>
                  <div
                    key={shakeKey}
                    className={`h-full w-full rounded-lg border-2 border-dashed bg-white/60 shadow-sm ${colliding ? 'border-red-500' : 'border-stone-800/70'} ${shakeKey ? 'animate-shake' : ''}`}
                  >
                    <SignaturePreview sig={previewSig} />
                  </div>
                  {/* resize handle */}
                  <div data-handle="resize" className="absolute -bottom-4 -right-4 flex h-10 w-10 items-center justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white shadow-md">
                      <Expand size={12} />
                    </span>
                  </div>
                </div>
              )}
            </ShirtTemplate>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-stone-50 px-3.5 py-2.5 ring-1 ring-stone-200/80">
              <RotateCw size={15} className="shrink-0 text-stone-400" />
              <input type="range" min={-30} max={30} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="flex-1 accent-stone-900" aria-label="Tilt" />
              <span className="w-9 text-right text-xs font-medium text-stone-500">{rotation}°</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-stone-50 px-3.5 py-2.5 ring-1 ring-stone-200/80">
              <Expand size={15} className="shrink-0 text-stone-400" />
              <input
                type="range" min={40} max={100} value={Math.round(scale * 100)}
                onChange={(e) => {
                  const target = Number(e.target.value) / 100;
                  if (!collidesAt(center.x, center.y, target)) setScale(target);
                }}
                className="flex-1 accent-stone-900" aria-label="Size"
              />
              <span className="w-9 text-right text-xs font-medium text-stone-500">{Math.round(scale * 100)}%</span>
            </div>
          </div>

          {colliding && (
            <p className="animate-pop mt-3 flex items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              <AlertTriangle size={15} className="shrink-0" /> That spot is taken — the box springs back to the last free space when you let go.
            </p>
          )}
          {submitError && (
            <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{submitError}</p>
          )}

          <div className="mt-5 flex gap-3">
            <button onClick={() => setStep('create')} className="btn-secondary">
              Back
            </button>
            <button disabled={colliding || submitting} onClick={submit} className="btn-primary flex-1 py-3.5">
              {submitting && <Loader2 className="animate-spin" size={16} />}
              Sign the shirt
            </button>
          </div>
          <p className="mt-2.5 text-center text-xs text-stone-400">
            Box size: {Math.round(scale * 100)}% of your {data.size}× entitlement · {surface} of the shirt
          </p>
        </div>
      )}
    </div>
  );
}
