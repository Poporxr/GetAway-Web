import { TRIPS, type Trip } from "@/lib/data";
import BottomNav from "@/components/BottomNav";
import { ChevronIcon } from "@/components/icons";

function TripRow({ trip }: { trip: Trip }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white p-3 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={trip.image}
        alt={trip.name}
        loading="lazy"
        className="h-16 w-16 shrink-0 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-neutral-950">
          {trip.name}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">{trip.dateLabel}</p>
      </div>
      <ChevronIcon className="h-5 w-5 shrink-0 -rotate-90 text-neutral-300" />
    </div>
  );
}

export default function TripsPage() {
  const upcoming = TRIPS.filter((t) => t.status === "upcoming");
  const past = TRIPS.filter((t) => t.status === "past");

  return (
    <main className="pb-32">
      <header className="px-5 pt-8">
        <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-950">
          Trips
        </h1>
        <p className="mt-0.5 text-sm text-neutral-400">
          Planned getaways and past escapes
        </p>
      </header>

      <section className="mt-6 px-5">
        <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
          Upcoming
        </h2>
        <div className="mt-3 space-y-3">
          {upcoming.map((trip) => (
            <TripRow key={trip.id} trip={trip} />
          ))}
        </div>
      </section>

      <section className="mt-8 px-5">
        <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
          Past
        </h2>
        <div className="mt-3 space-y-3 opacity-80">
          {past.map((trip) => (
            <TripRow key={trip.id} trip={trip} />
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
