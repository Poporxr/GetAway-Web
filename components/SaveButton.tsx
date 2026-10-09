"use client";

import { useState } from "react";
import { HeartIcon } from "./icons";

export default function SaveButton({ label }: { label: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      aria-label={label}
      onClick={() => setSaved(!saved)}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-neutral-950 shadow-lg backdrop-blur transition-transform active:scale-90"
    >
      <HeartIcon className="h-5 w-5" filled={saved} />
    </button>
  );
}
