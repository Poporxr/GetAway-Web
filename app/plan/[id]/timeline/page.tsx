import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlan } from "@/lib/data";
import PlanTabs from "@/components/PlanTabs";
import SaveButton from "@/components/SaveButton";
import { BackIcon } from "@/components/icons";

export default async function PlanTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) notFound();

  return (
    <main className="flex min-h-screen flex-col pb-8">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-8">
        <Link
          href={`/plan/${plan.id}`}
          aria-label="Back to plan"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-950 shadow-lg"
        >
          <BackIcon className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-extrabold tracking-tight text-neutral-950">
            {plan.name}
          </h1>
          <p className="text-xs text-neutral-400">
            {plan.dateLabel} · {plan.durationLabel}
          </p>
        </div>
        <SaveButton label={`Save ${plan.name}`} />
      </header>

      {/* Tabs + content */}
      <div className="flex-1 px-5 pt-5">
        <PlanTabs plan={plan} />
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent px-5 pb-6 pt-8">
        <button className="w-full rounded-full bg-neutral-950 py-4 text-[15px] font-bold text-white shadow-xl transition-transform active:scale-[0.98]">
          Start plan
        </button>
      </div>
    </main>
  );
}
