import Link from "next/link";
import { notFound } from "next/navigation";
import { decisionLine, formatCost, getPlan, similarPlans } from "@/lib/data";
import BottomNav from "@/components/BottomNav";
import ReadMore from "@/components/ReadMore";
import SaveButton from "@/components/SaveButton";
import { CtaLink } from "@/components/CtaButton";
import { PlanRailCard, VerifiedBadge } from "@/components/PlanCards";
import { ArrowIcon, BackIcon, PinIcon, StarIcon } from "@/components/icons";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) notFound();

  const similar = similarPlans(id);

  return (
    <main className="pb-32">
      {/* Hero */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plan.image}
          alt={plan.name}
          className="h-[340px] w-full rounded-b-[2rem] object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 pt-8">
          <Link
            href="/"
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-neutral-950 shadow-lg backdrop-blur"
          >
            <BackIcon className="h-5 w-5" />
          </Link>
          <SaveButton label={`Save ${plan.name}`} />
        </div>
      </div>

      {/* Title block */}
      <section className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-950">
            {plan.name}
          </h1>
          <span className="mt-1.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-950">
            <StarIcon className="h-3.5 w-3.5 text-amber-500" />
            {plan.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-500">
          <PinIcon className="h-4 w-4 text-emerald-600" />
          {plan.area}
          <span className="mx-1 text-neutral-300">·</span>
          <span className="font-semibold text-neutral-950 underline underline-offset-2">
            {plan.reviews} reviews
          </span>
          <span className="mx-1 text-neutral-300">·</span>
          <VerifiedBadge />
        </p>
        <p className="mt-2 text-[15px] text-neutral-500">{plan.contextLine}</p>
      </section>

      {/* The plan — hero content */}
      <section className="px-5 pt-6">
        <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
          The plan
        </h2>
        <ol className="mt-3 space-y-2.5">
          {plan.steps.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-4 rounded-2xl bg-neutral-950 p-4 text-white"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-extrabold">
                {i + 1}
              </span>
              <p className="text-[15px] font-semibold capitalize">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          {[plan.timeLabel, formatCost(plan), plan.distanceLabel].map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-bold text-neutral-700"
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="px-5 pt-6">
        <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
          About
        </h2>
        <div className="mt-2">
          <ReadMore text={plan.description} />
        </div>
      </section>

      {/* More like this — restrained */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between px-5">
          <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
            More like this
          </h2>
          <span className="text-sm font-semibold text-neutral-950 underline underline-offset-2">
            See all
          </span>
        </div>
        <div className="scrollbar-none mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
          {similar.map((p) => (
            <PlanRailCard key={p.id} plan={p} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="px-5 pt-8">
        <CtaLink href={`/plan/${plan.id}/timeline`}>
          View timeline
          <ArrowIcon className="h-5 w-5" />
        </CtaLink>
        <p className="mt-3 text-center text-xs text-neutral-400">
          {decisionLine(plan)}
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
