import Link from "next/link";
import { PLANS, formatCost } from "@/lib/data";
import BottomNav from "@/components/BottomNav";
import DecisionSection from "@/components/DecisionSection";
import { PlanRailCard } from "@/components/PlanCards";
import { ArrowIcon, FilterIcon, SearchIcon } from "@/components/icons";

export default function Home() {
  const tonight = PLANS.filter((p) =>
    ["vi-after-dark", "surulere-street-food", "brooklyn-golden-hour"].includes(p.id)
  );
  const weekend = PLANS.filter((p) =>
    ["lekki-slow-saturday", "ikoyi-art-brunch", "notting-hill-sunday"].includes(p.id)
  );

  return (
    <main className="pb-32">
      {/* Greeting */}
      <header className="flex items-center justify-between px-5 pt-8">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-950">
            Hello, Devan
          </h1>
          <p className="mt-0.5 text-sm text-neutral-400">Welcome to Getaway</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://picsum.photos/seed/getaway-devan/96/96"
          alt="Devan"
          className="h-12 w-12 rounded-full object-cover ring-2 ring-neutral-100"
        />
      </header>

      {/* Search */}
      <div className="mt-5 flex items-center gap-3 px-5">
        <label className="flex flex-1 items-center gap-2.5 rounded-full bg-neutral-100 px-4 py-3">
          <SearchIcon className="h-5 w-5 text-neutral-400" />
          <input
            type="search"
            placeholder="Search"
            className="w-full bg-transparent text-[15px] text-neutral-950 outline-none placeholder:text-neutral-400"
          />
        </label>
        <button
          aria-label="Filters"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white"
        >
          <FilterIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Decision-first layer */}
      <DecisionSection />

      {/* Tonight near you — restrained, one row */}
      <section className="mt-9">
        <div className="flex items-baseline justify-between px-5">
          <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
            Tonight near you
          </h2>
          <span className="text-sm font-semibold text-neutral-950 underline underline-offset-2">
            See all
          </span>
        </div>
        <div className="scrollbar-none mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
          {tonight.map((plan) => (
            <PlanRailCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      {/* Weekend escapes — restrained, one list */}
      <section className="mt-8 px-5">
        <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
          Weekend escapes
        </h2>
        <div className="mt-4 space-y-3">
          {weekend.map((plan) => (
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
                <p className="mt-1 text-xs font-bold text-neutral-950">
                  ★ {plan.rating.toFixed(1)}{" "}
                  <span className="font-normal text-neutral-400">
                    ({plan.reviews} reviews)
                  </span>
                </p>
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
