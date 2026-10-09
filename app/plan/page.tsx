"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  SAMPLE_ITINERARY,
  VIBES,
  formatMoney,
  type Currency,
} from "@/lib/data";
import BottomNav from "@/components/BottomNav";
import { VerifiedBadge } from "@/components/PlanCards";

const DATES = ["Tonight", "This weekend", "Pick a date"] as const;
const BUDGETS = [25000, 50000, 100000, 200000] as const;
const OCCASIONS = ["Date", "Friends", "Family", "Solo"] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
      {children}
    </p>
  );
}

export default function PlannerPage() {
  const [date, setDate] = useState<string>("This weekend");
  const [budget, setBudget] = useState<number>(100000);
  const [people, setPeople] = useState(2);
  const [occasion, setOccasion] = useState<string>("Date");
  const [vibe, setVibe] = useState<string>("Foodie");

  const currency: Currency = SAMPLE_ITINERARY.currency;
  const total = SAMPLE_ITINERARY.stops.reduce((s, x) => s + x.cost, 0);

  return (
    <main className="pb-32">
      <header className="px-5 pt-8">
        <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-950">
          Plan a getaway
        </h1>
        <p className="mt-0.5 text-sm text-neutral-400">
          Tell us the shape of it. We&apos;ll build the day.
        </p>
      </header>

      {/* Inputs */}
      <div className="mt-6 space-y-6 px-5">
        <section>
          <SectionLabel>When</SectionLabel>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {DATES.map((d) => (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  date === d
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>Budget</SectionLabel>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <button
                key={b}
                onClick={() => setBudget(b)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  budget === b
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {formatMoney(currency, b)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>People</SectionLabel>
          <div className="mt-2.5 flex items-center gap-4">
            <button
              aria-label="Fewer people"
              onClick={() => setPeople(Math.max(1, people - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-xl font-bold text-neutral-950 transition-transform active:scale-95"
            >
              −
            </button>
            <span className="w-20 text-center text-lg font-extrabold text-neutral-950">
              {people} {people === 1 ? "person" : "people"}
            </span>
            <button
              aria-label="More people"
              onClick={() => setPeople(Math.min(12, people + 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-xl font-bold text-neutral-950 transition-transform active:scale-95"
            >
              +
            </button>
          </div>
        </section>

        <section>
          <SectionLabel>Occasion</SectionLabel>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <button
                key={o}
                onClick={() => setOccasion(o)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  occasion === o
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>Vibe</SectionLabel>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <button
                key={v}
                onClick={() => setVibe(v)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  vibe === v
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </section>

        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="w-full rounded-full bg-neutral-950 py-4 text-[15px] font-bold text-white shadow-xl"
        >
          Build my getaway
        </motion.button>
      </div>

      {/* Sample generated itinerary */}
      <section className="mt-9 px-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
            Sample itinerary
          </h2>
          <VerifiedBadge />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            SAMPLE_ITINERARY.location,
            SAMPLE_ITINERARY.day,
            `${SAMPLE_ITINERARY.people} people`,
            SAMPLE_ITINERARY.occasion,
            formatMoney(currency, SAMPLE_ITINERARY.budget),
          ].map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-bold text-neutral-700"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-[1.75rem] bg-neutral-950 p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            Your Saturday, planned
          </p>
          <div className="mt-4 space-y-4">
            {SAMPLE_ITINERARY.stops.map((stop, i) => (
              <div key={stop.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-extrabold">
                    {i + 1}
                  </span>
                  {i < SAMPLE_ITINERARY.stops.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-white/15" />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-xs font-bold text-white/50">{stop.time}</p>
                  <p className="mt-0.5 text-[15px] font-bold">{stop.title}</p>
                  <p className="text-sm text-white/60">{stop.detail}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-white/80">
                  {formatMoney(currency, stop.cost)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-4">
            <p className="text-sm font-semibold text-white/60">Total</p>
            <p className="text-lg font-extrabold">
              {formatMoney(currency, total)}
            </p>
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
