import Link from 'next/link';
import { BadgeCheck, Link2, MousePointerClick, PenLine, Shirt, Wallet } from 'lucide-react';
import { loadDB } from '@/lib/store';
import ShirtViewer from '@/components/ShirtViewer';
import { CopyButton } from '@/components/ui';

export const dynamic = 'force-dynamic';

const STEPS = [
  { icon: Shirt, title: 'Create your shirt', text: 'Pick the classic tee or the long-sleeve. You get a personal link in under two minutes.' },
  { icon: Link2, title: 'Share your link', text: 'Drop it in the class group chat, your status, anywhere. No account needed to sign.' },
  { icon: PenLine, title: 'Friends gift & sign', text: 'They pay from ₦2,000, then draw or type a signature right onto your 3D shirt.' },
  { icon: Wallet, title: 'Withdraw your gifts', text: 'Track every gift live. Withdraw to your bank after a quick student verification.' },
];

export default function LandingPage() {
  const db = loadDB();
  const demoShirt = db.shirts.find((s) => s.slug === 'adaeze-signs-out-k7x2') ?? db.shirts[0];
  const demoSigs = demoShirt ? db.signatures.filter((s) => s.shirtId === demoShirt.id) : [];
  const demoOwner = demoShirt ? db.users.find((u) => u.id === demoShirt.ownerId) : null;
  const demoUrl = demoShirt ? `/s/${demoShirt.slug}` : '/signup';

  return (
    <div>
      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-14 pt-10 lg:grid-cols-2 lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
            <MousePointerClick size={13} /> Signing-out day, but make it digital
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl">
            Your signing-out shirt,<br />
            <span className="text-violet-600">signed from anywhere.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-stone-600">
            Final year is busy and half your people can&apos;t make it to campus. Create a virtual shirt,
            share one link, and let friends and family gift you and sign it — for real, in 3D, forever.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="rounded-full bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700">
              Create my shirt — free
            </Link>
            <Link href={demoUrl} className="rounded-full bg-white px-6 py-3.5 text-sm font-bold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50">
              Try the live demo shirt
            </Link>
          </div>
          <ul className="mt-6 space-y-1.5 text-sm text-stone-500">
            <li className="flex items-center gap-2"><BadgeCheck size={15} className="text-emerald-500" /> Two shirt designs included, one link each</li>
            <li className="flex items-center gap-2"><BadgeCheck size={15} className="text-emerald-500" /> Gifts from ₦2,000 · bigger gifts, bigger signatures</li>
            <li className="flex items-center gap-2"><BadgeCheck size={15} className="text-emerald-500" /> Transparent 10% platform fee — shown before anyone pays</li>
          </ul>
        </div>
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-b from-violet-100 via-paper to-amber-100 shadow-sm ring-1 ring-stone-200/70">
          <div className="flex items-center justify-between px-5 pt-4">
            <p className="text-sm font-bold text-stone-700">Live demo — {demoOwner?.name ?? 'Adaeze'}&apos;s shirt</p>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-violet-700 ring-1 ring-violet-200">drag to spin · scroll to zoom</span>
          </div>
          {demoShirt && <ShirtViewer type={demoShirt.type} signatures={demoSigs} height={430} />}
          <div className="flex flex-wrap items-center gap-2 px-5 pb-5">
            <Link href={demoUrl} className="rounded-full bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-700">Gift &amp; sign this shirt</Link>
            <span className="text-xs text-stone-400">…or copy the demo link:</span>
            <CopyButton text={`https://signout.ng${demoUrl}`} label="Copy demo link" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-stone-200/70 bg-white/60 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-extrabold text-stone-900 sm:text-3xl">How it works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><s.icon size={21} /></span>
                  <span className="text-3xl font-extrabold text-stone-200">{i + 1}</span>
                </div>
                <h3 className="mt-3 font-bold text-stone-900">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-500">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-extrabold text-stone-900 sm:text-3xl">Simple, honest pricing</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-stone-500">Creating a shirt is free. Contributors choose a gift; the signature size rides on the gift. The platform keeps 10% of each payment — always disclosed up front, never hidden.</p>
        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Every gift</p>
            <p className="mt-2 text-3xl font-extrabold">₦2,000<span className="text-base font-semibold text-stone-400"> minimum</span></p>
            <ul className="mt-3 space-y-1.5 text-sm text-stone-500">
              <li>· Includes a 1× signature</li>
              <li>· Draw it or type it in a handwriting font</li>
              <li>· Front or back, placed by hand</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-violet-600 p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-200">Gifts of ₦5,000+</p>
            <p className="mt-2 text-3xl font-extrabold">Bigger ink</p>
            <ul className="mt-3 space-y-1.5 text-sm text-violet-100">
              <li>· 2× signature — +₦500</li>
              <li>· 3× signature — +₦700</li>
              <li>· 4× signature — +₦1,000</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link href="/signup" className="inline-block rounded-full bg-stone-900 px-7 py-3.5 text-sm font-bold text-white hover:bg-stone-700">
            Start your signing-out shirt 🎓
          </Link>
          <p className="mt-3 text-xs text-stone-400">Demo account: demo@signout.ng / demo1234 — see a dashboard with real gifts already on it.</p>
        </div>
      </section>
    </div>
  );
}
