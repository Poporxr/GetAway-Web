"use client";

import { useState } from "react";
import Link from "next/link";
import { EXPLORE_CATEGORIES, PLANS, formatCost } from "@/lib/data";
import BottomNav from "@/components/BottomNav";
import { VerifiedBadge } from "@/components/PlanCards";
import { ArrowIcon, PinIcon, SearchIcon } from "@/components/icons";

const PINS = [
  { left: "22%", top: "30%" },
  { left: "58%", top: "18%" },
  { left: "70%", top: "55%" },
  { left: "38%", top: "66%" },
  { left: "82%", top: "38%" },
];

export default function ExplorePage() {
  const [category, setCategory] = useState<string>("Do");
  const nearby = PLANS.slice(0, 4);

  return (
    <main className="pb-32">
      <header className="px-5 pt-8">
        <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-950">
          Explore
        </h1>
        <p className="mt-0.5 text-sm text-neutral-400">
          Places and plans around you
        </p>
      </header>

      {/* Search */}
      <div className="mt-5 px-5">
        <label className="flex items-center gap-2.5 rounded-full bg-neutral-100 px-4 py-3">
          <SearchIcon className="h-5 w-5 text-neutral-400" />
          <input
            type="search"
            placeholder="Search places, vibes, areas…"
            className="w-full bg-transparent text-[15px] text-neutral-950 outline-none placeholder:text-neutral-400"
          />
        </label>
      </div>

      {/* Category pills */}
      <div className="scrollbar-none -mx-0 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {EXPLORE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category === c
                ? "bg-neutral-950 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Map placeholder */}
      <section className="mt-5 px-5">
        <div className="relative h-64 overflow-hidden rounded-[1.75rem] bg-neutral-100">
          {/* faux map grid */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
          {/* faux roads */}
          <div className="absolute left-0 top-1/3 h-2 w-full -rotate-6 bg-white/80" />
          <div className="absolute left-1/4 top-0 h-full w-2 rotate-12 bg-white/80" />
          {PINS.map((p, i) => (
            <span
              key={i}
              className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950 text-white shadow-lg"
              style={{ left: p.left, top: p.top }}
            >
              <PinIcon className="h-4 w-4" />
            </span>
          ))}
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-neutral-500 backdrop-blur">
            Interactive map coming soon
          </p>
        </div>
      </section>

      {/* Nearby picks */}
      <section className="mt-7 px-5">
        <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
          Nearby picks
        </h2>
        <div className="mt-4 space-y-3">
          {nearby.map((plan) => (
            <Link
              key={plan.id}
              href={`/plan/${plan.id}`}
              className="flex items-center gap-4 rounded-3xl bg-white p-3 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={plan.image}
                alt={plan.name}
                loading="lazy"
                className="h-20 w-20 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-neutral-950">
                  {plan.name}
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {plan.area} · {formatCost(plan)}
                </p>
                <div className="mt-1">
                  <VerifiedBadge />
                </div>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white">
                <ArrowIcon className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
