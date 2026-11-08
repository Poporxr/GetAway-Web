'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Link2, PenLine, Shirt, Wallet } from 'lucide-react';
import { useClientDB } from '@/lib/hooks';
import ShirtViewer from '@/components/ShirtViewer';
import { CopyButton, LoadingBlock } from '@/components/ui';

const STEPS = [
  { icon: Shirt, title: 'Create your shirt', text: 'Pick the classic tee or the button-down shirt. You get a personal link in under two minutes.' },
  { icon: Link2, title: 'Share your link', text: 'Drop it in the class group chat, your status, anywhere. No account needed to sign.' },
  { icon: PenLine, title: 'Friends gift & sign', text: 'They pay from ₦2,000, then draw, write or emoji their message right onto your 3D shirt.' },
  { icon: Wallet, title: 'Withdraw your gifts', text: 'Track every gift live. Withdraw to your bank after a quick student verification.' },
];

export default function LandingPage() {
  // The demo shirt lives in the visitor's localStorage store; it only exists
  // after mount, so the hero demo fills in once the store is ready.
  const { db } = useClientDB();
  const demoShirt = db?.shirts.find((s) => s.slug === 'adaeze-signs-out-k7x2') ?? db?.shirts[0];
  const demoSigs = demoShirt && db ? db.signatures.filter((s) => s.shirtId === demoShirt.id) : [];
  const demoOwner = demoShirt && db ? db.users.find((u) => u.id === demoShirt.ownerId) : null;
  const demoUrl = demoShirt ? `/s/${demoShirt.slug}` : '/signup';

  return (
    <div>
      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 lg:grid-cols-2 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Signing-out day, made digital
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.06] tracking-tight text-stone-900 sm:text-[3.4rem]">
            Your signing-out shirt, signed from anywhere.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-stone-500">
            Final year is busy and half your people can&apos;t make it to campus. Create a virtual shirt,
            share one link, and let friends and family gift you and sign it in 3D.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn-primary px-6 py-3.5">
              Create my shirt — free <ArrowRight size={16} />
            </Link>
            <Link href={demoUrl} className="btn-secondary px-6 py-3.5">
              Try the live demo shirt
            </Link>
          </div>
          <ul className="mt-8 space-y-2 text-sm text-stone-500">
            <li className="flex items-center gap-2"><BadgeCheck size={16} className="shrink-0 text-emerald-600" /> Two shirt designs included, one link each</li>
            <li className="flex items-center gap-2"><BadgeCheck size={16} className="shrink-0 text-emerald-600" /> Gifts from ₦2,000 · bigger gifts, bigger signatures</li>
            <li className="flex items-center gap-2"><BadgeCheck size={16} className="shrink-0 text-emerald-600" /> Transparent 10% platform fee — shown before anyone pays</li>
          </ul>
        </div>
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
            <p className="text-sm font-semibold text-stone-800">Live demo — {demoOwner?.name ?? 'Adaeze'}&apos;s shirt</p>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-500">drag to spin · scroll to zoom</span>
          </div>
          <div className="bg-[#f4f4f2]">
            {demoShirt ? (
              <ShirtViewer type={demoShirt.type} signatures={demoSigs} height={430} />
            ) : (
              <div style={{ height: 430 }}><LoadingBlock label="Loading the demo shirt…" /></div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2.5 border-t border-stone-100 px-5 py-4">
            <Link href={demoUrl} className="btn-primary px-4 py-2.5">Gift &amp; sign this shirt</Link>
            <span className="text-xs text-stone-400">or copy the demo link:</span>
            <CopyButton text={`https://signout.ng${demoUrl}`} label="Copy demo link" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-stone-200/80 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow text-center">How it works</p>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-stone-900">Four steps to a shirt full of love</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card-flat p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white"><s.icon size={19} /></span>
                  <span className="text-sm font-semibold text-stone-300">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold tracking-tight text-stone-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
        <p className="eyebrow text-center">Pricing</p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-stone-900">Simple, honest pricing</h2>
        <p className="mx-auto mt-3 max-w-xl text-center leading-relaxed text-stone-500">Creating a shirt is free. Contributors choose a gift; the signature size rides on the gift. The platform keeps 10% of each payment — always disclosed up front, never hidden.</p>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="card p-6">
            <p className="eyebrow">Every gift</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-stone-900">₦2,000<span className="text-base font-medium text-stone-400"> minimum</span></p>
            <ul className="mt-4 space-y-2 text-sm text-stone-500">
              <li className="flex gap-2"><BadgeCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" /> Includes a 1× signature</li>
              <li className="flex gap-2"><BadgeCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" /> Draw it, write it, or say it with emojis</li>
              <li className="flex gap-2"><BadgeCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" /> Front or back, placed by hand in its own box</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-stone-900 p-6 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Gifts of ₦5,000+</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">Bigger ink</p>
            <ul className="mt-4 space-y-2 text-sm text-stone-300">
              <li className="flex justify-between"><span>2× signature</span><span className="font-semibold text-white">+₦500</span></li>
              <li className="flex justify-between"><span>3× signature</span><span className="font-semibold text-white">+₦700</span></li>
              <li className="flex justify-between"><span>4× signature</span><span className="font-semibold text-white">+₦1,000</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 text-center">
          <Link href="/signup" className="btn-primary px-7 py-3.5">
            Start your signing-out shirt <ArrowRight size={16} />
          </Link>
          <p className="mt-3.5 text-xs text-stone-400">Demo account: demo@signout.ng / demo1234 — a dashboard with gifts already on it.</p>
        </div>
      </section>
    </div>
  );
}
