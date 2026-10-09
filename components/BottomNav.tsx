"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BagIcon,
  ListIcon,
  MapIcon,
  ProfileIcon,
  SparkIcon,
} from "./icons";

const SIDE_TABS_LEFT = [
  { key: "discover", label: "Discover", href: "/", Icon: SparkIcon },
  { key: "explore", label: "Explore", href: "/explore", Icon: MapIcon },
] as const;

const SIDE_TABS_RIGHT = [
  { key: "trips", label: "Trips", href: "/trips", Icon: BagIcon },
  { key: "profile", label: "Profile", href: "/profile", Icon: ProfileIcon },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const isPlanActive =
    pathname === "/plan" || pathname.startsWith("/plan/");
  const activeKey = isPlanActive
    ? "plan"
    : pathname === "/"
      ? "discover"
      : pathname.startsWith("/explore")
        ? "explore"
        : pathname.startsWith("/trips")
          ? "trips"
          : pathname.startsWith("/profile")
            ? "profile"
            : null;

  const renderSideTab = ({
    key,
    label,
    href,
    Icon,
  }: {
    key: string;
    label: string;
    href: string;
    Icon: typeof SparkIcon;
  }) => {
    const isActive = activeKey === key;
    return (
      <Link
        key={key}
        href={href}
        aria-label={label}
        className="flex w-14 flex-col items-center gap-1 py-1"
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            isActive ? "bg-white text-neutral-950" : "text-white/70"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={`text-[10px] font-semibold ${
            isActive ? "text-white" : "text-white/50"
          }`}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-5">
      <div className="pointer-events-auto mx-4 flex w-full max-w-sm items-end justify-between rounded-full bg-neutral-950 px-4 pb-2.5 pt-2 shadow-2xl">
        {SIDE_TABS_LEFT.map(renderSideTab)}

        {/* Elevated center Plan tab — the defining-feature entry point */}
        <Link
          href="/plan"
          aria-label="Plan"
          className="flex w-14 flex-col items-center gap-1"
        >
          <span
            className={`-mt-9 flex h-14 w-14 items-center justify-center rounded-full shadow-xl ring-4 ring-neutral-950 transition-colors ${
              isPlanActive
                ? "bg-emerald-400 text-neutral-950"
                : "bg-white text-neutral-950"
            }`}
          >
            <ListIcon className="h-6 w-6" />
          </span>
          <span
            className={`text-[10px] font-semibold ${
              isPlanActive ? "text-white" : "text-white/50"
            }`}
          >
            Plan
          </span>
        </Link>

        {SIDE_TABS_RIGHT.map(renderSideTab)}
      </div>
    </nav>
  );
}
