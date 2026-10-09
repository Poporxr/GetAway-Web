"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Plan } from "@/lib/data";
import { CheckIcon, StarIcon } from "./icons";

const MotionLink = motion.create(Link);

export function RatingPill({ plan }: { plan: Plan }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-950/85 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
      <StarIcon className="h-3.5 w-3.5 text-amber-400" />
      {plan.rating.toFixed(1)}
    </span>
  );
}

/** Subtle trust signal: information confirmed by the venue. */
export function VerifiedBadge({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
        dark ? "text-emerald-300" : "text-emerald-700"
      }`}
    >
      <CheckIcon className="h-3.5 w-3.5" />
      Verified
    </span>
  );
}

/** Small horizontal card used in "Tonight near you" / "More like this" rails. */
export function PlanRailCard({ plan }: { plan: Plan }) {
  return (
    <MotionLink
      href={`/plan/${plan.id}`}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="w-40 shrink-0 snap-start overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plan.image}
          alt={plan.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute left-2.5 top-2.5">
          <RatingPill plan={plan} />
        </div>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-bold text-neutral-950">{plan.name}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{plan.area}</p>
        <div className="mt-1">
          <VerifiedBadge />
        </div>
      </div>
    </MotionLink>
  );
}
