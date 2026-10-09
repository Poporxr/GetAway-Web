import BottomNav from "@/components/BottomNav";
import { COLLECTIONS } from "@/lib/data";
import { ChevronIcon, PinIcon } from "@/components/icons";

const SETTINGS = [
  "Notifications",
  "Preferences",
  "Currency",
  "About",
] as const;

const STATS = [
  { value: "12", label: "Getaways" },
  { value: "34", label: "Saved" },
  { value: "8", label: "Reviews" },
] as const;

export default function ProfilePage() {
  return (
    <main className="pb-32">
      {/* Identity */}
      <header className="flex items-center gap-4 px-5 pt-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://picsum.photos/seed/getaway-devan/160/160"
          alt="Devan"
          className="h-20 w-20 rounded-full object-cover ring-2 ring-neutral-100"
        />
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-neutral-950">
            Devan
          </h1>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-neutral-400">
            <PinIcon className="h-3.5 w-3.5" />
            Lagos, Nigeria
          </p>
        </div>
      </header>

      {/* Stats */}
      <section className="mt-6 px-5">
        <div className="grid grid-cols-3 gap-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-3xl bg-neutral-50 p-4 text-center"
            >
              <p className="text-2xl font-extrabold text-neutral-950">
                {s.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-neutral-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Saved collections */}
      <section className="mt-8">
        <h2 className="px-5 text-lg font-extrabold tracking-tight text-neutral-950">
          Saved collections
        </h2>
        <div className="scrollbar-none mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
          {COLLECTIONS.map((c) => (
            <div
              key={c.id}
              className="relative w-44 shrink-0 snap-start overflow-hidden rounded-3xl shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-sm font-bold text-white">{c.name}</p>
                <p className="text-xs text-white/70">{c.count} saved</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Settings */}
      <section className="mt-8 px-5">
        <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
          Settings
        </h2>
        <div className="mt-3 overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)]">
          {SETTINGS.map((s, i) => (
            <button
              key={s}
              className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 ${
                i > 0 ? "border-t border-neutral-100" : ""
              }`}
            >
              <span className="text-[15px] font-semibold text-neutral-950">
                {s}
              </span>
              <ChevronIcon className="h-5 w-5 -rotate-90 text-neutral-300" />
            </button>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
