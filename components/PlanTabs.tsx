"use client";

import { useState } from "react";
import type { Plan } from "@/lib/data";
import ReadMore from "./ReadMore";
import TimelineBlocks from "./TimelineBlocks";

export default function PlanTabs({ plan }: { plan: Plan }) {
  const [tab, setTab] = useState<"timeline" | "details">("timeline");

  return (
    <div>
      <div className="flex gap-2">
        {(["timeline", "details"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? "bg-neutral-950 text-white"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            }`}
          >
            {t === "timeline" ? "Timeline" : "Details"}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "timeline" ? (
          <TimelineBlocks blocks={plan.timeline} />
        ) : (
          <div className="space-y-5">
            <ReadMore text={plan.description} />
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Area", plan.area],
                ["Duration", plan.durationLabel],
                ["Best for", plan.vibes.join(" · ")],
                ["Rating", `${plan.rating} (${plan.reviews} reviews)`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-2xl bg-neutral-50 p-4"
                >
                  <dt className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                    {k}
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-neutral-950">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
