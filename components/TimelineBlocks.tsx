"use client";

import { useState } from "react";
import type { TimelineBlock } from "@/lib/data";
import { ChevronIcon } from "./icons";

export default function TimelineBlocks({
  blocks,
}: {
  blocks: TimelineBlock[];
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const isOpen = open === i;
        return (
          <div
            key={block.part}
            className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)]"
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center gap-4 p-4 text-left"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-bold text-white">
                {block.part.slice(0, 3)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  {block.part}
                </p>
                <p className="truncate text-[15px] font-bold text-neutral-950">
                  {block.items[0]?.title}
                  {block.items.length > 1
                    ? ` +${block.items.length - 1} more`
                    : ""}
                </p>
              </div>
              <ChevronIcon
                className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="space-y-4 border-t border-neutral-100 px-4 py-4">
                {block.items.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <p className="w-12 shrink-0 pt-0.5 text-xs font-bold text-neutral-400">
                      {item.time}
                    </p>
                    <div>
                      <p className="text-[15px] font-bold text-neutral-950">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-neutral-500">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
