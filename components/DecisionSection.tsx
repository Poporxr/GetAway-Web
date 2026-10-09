"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Dices } from "lucide-react";
import { DURATIONS, PLANS, decisionLine, type Plan } from "@/lib/data";
import { ArrowIcon } from "./icons";
import { VerifiedBadge } from "./PlanCards";

const MOODS = ["Chill", "Adventure", "Foodie", "Nightlife"] as const;

function pickForMood(mood: string, excludeId?: string): Plan {
  const matches = PLANS.filter(
    (p) => p.vibes.includes(mood) && p.id !== excludeId
  );
  const pool = matches.length > 0 ? matches : PLANS.filter((p) => p.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Dark decision card: named experience + context + mini-plan + time/cost/distance. */
function DecisionCard({ plan }: { plan: Plan }) {
  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link
        href={`/plan/${plan.id}`}
        className="block rounded-[1.75rem] bg-neutral-950 p-6 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)]"
      >
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
        Decided for you
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h3 className="text-[26px] font-extrabold uppercase tracking-tight">
          {plan.name}
        </h3>
        <VerifiedBadge dark />
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-white/70">
        {plan.contextLine}
      </p>
      <p className="mt-3 text-[15px] font-semibold leading-relaxed">
        {plan.steps.join(" → ")}.
      </p>
      <p className="mt-3 text-sm font-medium text-white/50">
        {decisionLine(plan)}
      </p>
      <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-neutral-950">
        See the plan
        <ArrowIcon className="h-4 w-4" />
      </span>
      </Link>
    </motion.div>
  );
}

export default function DecisionSection() {
  const [duration, setDuration] = useState<string>("Tonight");
  const [mood, setMood] = useState<string>("Chill");
  const [hero, setHero] = useState<Plan>(() => pickForMood("Chill"));

  const surprise = () => {
    setHero((prev) => {
      let next = pickForMood(mood, prev.id);
      // avoid repeating the same card twice in a row when possible
      if (next.id === prev.id && PLANS.length > 1) {
        next = PLANS[(PLANS.indexOf(prev) + 1) % PLANS.length];
      }
      return next;
    });
  };

  const chooseMood = (m: string) => {
    setMood(m);
    setHero((prev) => pickForMood(m, prev.id));
  };

  return (
    <section className="mt-7 px-5">
      {/* Contextual prompt */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
          I have{" "}
          <span className="underline decoration-neutral-300 decoration-2 underline-offset-4">
            {duration === "Tonight" || duration === "This weekend"
              ? duration.toLowerCase()
              : duration}
          </span>{" "}
          free
        </h2>
        <motion.button
          onClick={surprise}
          whileTap={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 0.93, 1] }}
          transition={{ duration: 0.45 }}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2 text-sm font-bold text-white"
        >
          <Dices className="h-4 w-4" strokeWidth={2} />
          Surprise me
        </motion.button>
      </div>

      {/* Duration pills */}
      <div className="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              duration === d
                ? "bg-neutral-950 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Mood shortcuts */}
      <div className="mt-3 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => chooseMood(m)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              mood === m
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Decision hero */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={hero.id}
            initial={{ opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <DecisionCard plan={hero} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
