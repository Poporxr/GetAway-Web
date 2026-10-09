import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ClipboardList,
  Compass,
  Heart,
  Home,
  Luggage,
  Map,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserRound,
  type LucideProps,
} from "lucide-react";

type IconProps = { className?: string; filled?: boolean };

function base(props: IconProps, strokeWidth = 1.8): LucideProps {
  return { className: props.className, strokeWidth };
}

export function HomeIcon(props: IconProps) {
  return <Home {...base(props)} />;
}

export function ExploreIcon(props: IconProps) {
  return <Compass {...base(props)} />;
}

export function HeartIcon({ filled = false, ...props }: IconProps) {
  return <Heart {...base(props)} fill={filled ? "currentColor" : "none"} />;
}

export function ProfileIcon(props: IconProps) {
  return <UserRound {...base(props)} />;
}

export function SearchIcon(props: IconProps) {
  return <Search {...base(props, 2)} />;
}

export function FilterIcon(props: IconProps) {
  return <SlidersHorizontal {...base(props, 2)} />;
}

export function BackIcon(props: IconProps) {
  return <ArrowLeft {...base(props, 2)} />;
}

export function ArrowIcon(props: IconProps) {
  return <ArrowRight {...base(props, 2)} />;
}

export function StarIcon(props: IconProps) {
  return <Star {...base(props, 0)} fill="currentColor" />;
}

export function PinIcon(props: IconProps) {
  return <MapPin {...base(props)} />;
}

export function ChevronIcon(props: IconProps) {
  return <ChevronDown {...base(props, 2)} />;
}

export function SparkIcon(props: IconProps) {
  return <Sparkles {...base(props)} />;
}

export function MapIcon(props: IconProps) {
  return <Map {...base(props)} />;
}

export function ListIcon(props: IconProps) {
  return <ClipboardList {...base(props)} />;
}

export function CheckIcon(props: IconProps) {
  return <BadgeCheck {...base(props, 2)} />;
}

export function BagIcon(props: IconProps) {
  return <Luggage {...base(props)} />;
}
