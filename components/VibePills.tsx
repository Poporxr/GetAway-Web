"use client";

import { useState } from "react";

export default function VibePills({
  vibes,
  initial = "Chill",
}: {
  vibes: readonly string[];
  initial?: string;
}) {
  const [selected, setSelected] = useState(initial);
  return (
    <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {vibes.map((vibe) => {
        const isActive = vibe === selected;
        return (
          <button
            key={vibe}
            onClick={() => setSelected(vibe)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-neutral-950 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {vibe}
          </button>
        );
      })}
    </div>
  );
}
