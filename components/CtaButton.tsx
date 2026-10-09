"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";

const MotionLink = motion.create(Link);

/** Primary dark CTA with a soft springy press. */
export default function CtaButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={`w-full rounded-full bg-neutral-950 py-4 text-[15px] font-bold text-white shadow-xl ${className}`}
    >
      {children}
    </motion.button>
  );
}

/** Same CTA look as a link, for server components. */
export function CtaLink({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <MotionLink
      href={href}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={`flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 py-4 text-[15px] font-bold text-white shadow-xl ${className}`}
    >
      {children}
    </MotionLink>
  );
}
