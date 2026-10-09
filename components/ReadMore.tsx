"use client";

import { useState } from "react";

export default function ReadMore({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const preview = text.length > 140 ? text.slice(0, 140).trimEnd() + "…" : text;
  return (
    <div>
      <p className="text-[15px] leading-relaxed text-neutral-600">
        {open ? text : preview}
      </p>
      {text.length > 140 && (
        <button
          onClick={() => setOpen(!open)}
          className="mt-1 text-sm font-semibold text-neutral-950 underline underline-offset-2"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
