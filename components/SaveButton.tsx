"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { HeartIcon } from "./icons";

export default function SaveButton({ label }: { label: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <motion.button
      aria-label={label}
      onClick={() => setSaved(!saved)}
      whileTap={{ scale: 0.82 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-neutral-950 shadow-lg backdrop-blur"
    >
      <motion.span
        key={String(saved)}
        initial={{ scale: 0.3 }}
        animate={{ scale: [0.3, 1.35, 1] }}
        transition={{ type: "spring", stiffness: 600, damping: 15 }}
        className="flex"
      >
        <HeartIcon
          className={`h-5 w-5 ${saved ? "text-rose-500" : ""}`}
          filled={saved}
        />
      </motion.span>
    </motion.button>
  );
}
