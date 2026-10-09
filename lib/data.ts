export type TimelineItem = {
  time: string;
  title: string;
  detail: string;
};

export type TimelineBlock = {
  part: "Morning" | "Afternoon" | "Evening";
  items: TimelineItem[];
};

export type Currency = "NGN" | "USD" | "GBP";

export type Plan = {
  id: string;
  name: string;
  area: string;
  vibes: string[];
  rating: number;
  reviews: number;
  image: string;
  tagline: string;
  description: string;
  dateLabel: string;
  durationLabel: string;
  currency: Currency;
  /** One-line context that makes the decision feel alive, e.g. "Sunset is in 52 minutes…" */
  contextLine: string;
  /** 2-4 step mini-plan: the decision itself. */
  steps: string[];
  /** "~1h 25m" */
  timeLabel: string;
  /** Cost in the plan's currency, formatted by formatCost(). */
  costAmount: number;
  /** "1.8 mi away" / "3.2 km away" */
  distanceLabel: string;
  timeline: TimelineBlock[];
};

const img = (seed: string, w = 800, h = 1000) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
};

/** Format a plan's cost in its own currency. Never assumes NGN. */
export function formatCost(plan: Pick<Plan, "currency" | "costAmount">): string {
  const symbol = CURRENCY_SYMBOLS[plan.currency];
  const amount = plan.costAmount.toLocaleString("en-US");
  return `~${symbol}${amount}`;
}

/** "~1h 25m · ~$8 · 1.8 mi away" */
export function decisionLine(plan: Plan): string {
  return `${plan.timeLabel} · ${formatCost(plan)} · ${plan.distanceLabel}`;
}

export const VIBES = [
  "Chill",
  "Foodie",
  "Adventure",
  "Nightlife",
  "Culture",
  "Outdoors",
] as const;

export const DURATIONS = [
  "30 min",
  "1 hr",
  "2 hrs",
  "Tonight",
  "This weekend",
] as const;

export const PLANS: Plan[] = [
  {
    id: "lekki-slow-saturday",
    name: "Lekki Slow Saturday",
    area: "Lekki, Lagos",
    vibes: ["Chill", "Foodie"],
    rating: 4.8,
    reviews: 212,
    image: img("getaway-lekki-slow"),
    tagline: "Brunch, beach air, and nowhere to be.",
    description:
      "A slow-burn Saturday built for recharging. Start with a long brunch in Lekki Phase 1, drift toward the water for golden-hour air, and close the day with small chops and live music. No reservations needed, no rushing — just a day that moves at your pace.",
    dateLabel: "Sat, Oct 11",
    durationLabel: "Full day",
    currency: "NGN",
    contextLine: "Saturday is wide open. The beach is calmest before noon.",
    steps: [
      "Brunch in Lekki Phase 1",
      "drift to the beach for golden-hour air",
      "close with small chops and live music",
    ],
    timeLabel: "~6h",
    costAmount: 15000,
    distanceLabel: "3.2 km away",
    timeline: [
      {
        part: "Morning",
        items: [
          {
            time: "10:00",
            title: "Brunch at a garden spot",
            detail: "Long brunch in Lekki Phase 1 — pancakes, fresh juice, shade.",
          },
          {
            time: "12:00",
            title: "Farmers market stroll",
            detail: "Browse the weekend market for snacks, plants and small finds.",
          },
        ],
      },
      {
        part: "Afternoon",
        items: [
          {
            time: "14:00",
            title: "Beachfront wind-down",
            detail: "Mat, book, sea breeze. Swim if the waves are calm.",
          },
          {
            time: "16:30",
            title: "Ice cream + people watching",
            detail: "Grab a cone and walk the strip as the day cools down.",
          },
        ],
      },
      {
        part: "Evening",
        items: [
          {
            time: "19:00",
            title: "Small chops & live music",
            detail: "Low-key lounge with an acoustic set to close the day.",
          },
        ],
      },
    ],
  },
  {
    id: "vi-after-dark",
    name: "VI After Dark",
    area: "Victoria Island, Lagos",
    vibes: ["Nightlife"],
    rating: 4.6,
    reviews: 148,
    image: img("getaway-vi-night"),
    tagline: "Dinner, drinks, and the city at full volume.",
    description:
      "Victoria Island after sunset is a different city. This plan strings together a proper dinner, a rooftop with a view, and a late spot with a DJ — paced so you actually enjoy each stop instead of queue-hopping all night.",
    dateLabel: "Fri, Oct 10",
    durationLabel: "Evening",
    currency: "NGN",
    contextLine: "Friday night. Dinner at 7:30, the city takes it from there.",
    steps: [
      "Dinner in VI",
      "rooftop drinks with a view",
      "late spot with a DJ",
    ],
    timeLabel: "~5h",
    costAmount: 25000,
    distanceLabel: "4.1 km away",
    timeline: [
      {
        part: "Evening",
        items: [
          {
            time: "19:30",
            title: "Dinner in VI",
            detail: "Proper sit-down dinner — grilled fish or continental.",
          },
          {
            time: "21:30",
            title: "Rooftop drinks",
            detail: "Cocktails with a skyline view, golden hour to night.",
          },
          {
            time: "23:30",
            title: "Late spot with a DJ",
            detail: "End the night where the music is loud and the crowd is up.",
          },
        ],
      },
    ],
  },
  {
    id: "yaba-culture-crawl",
    name: "Yaba Culture Crawl",
    area: "Yaba, Lagos",
    vibes: ["Culture"],
    rating: 4.7,
    reviews: 96,
    image: img("getaway-yaba"),
    tagline: "Galleries, bookshops, and old Lagos stories.",
    description:
      "Yaba is Lagos's creative engine room. This crawl links independent galleries, second-hand bookshops and a heritage stop or two, with a proper local lunch in the middle. Built for the curious — bring a tote bag.",
    dateLabel: "Sat, Oct 11",
    durationLabel: "Half day",
    currency: "NGN",
    contextLine: "A free afternoon. Yaba's galleries close at 5.",
    steps: [
      "Gallery hop",
      "local lunch at a canteen",
      "bookshop dig",
    ],
    timeLabel: "~4h",
    costAmount: 8000,
    distanceLabel: "6.5 km away",
    timeline: [
      {
        part: "Morning",
        items: [
          {
            time: "10:30",
            title: "Gallery hop",
            detail: "Two independent galleries within walking distance.",
          },
        ],
      },
      {
        part: "Afternoon",
        items: [
          {
            time: "13:00",
            title: "Local lunch",
            detail: "Amala or rice at a proper Yaba canteen.",
          },
          {
            time: "14:30",
            title: "Bookshop dig",
            detail: "Second-hand bookshops — you will not leave empty-handed.",
          },
        ],
      },
    ],
  },
  {
    id: "ikoyi-art-brunch",
    name: "Ikoyi Art & Brunch",
    area: "Ikoyi, Lagos",
    vibes: ["Culture", "Foodie"],
    rating: 4.9,
    reviews: 187,
    image: img("getaway-ikoyi"),
    tagline: "Quiet galleries, loud flavors.",
    description:
      "Ikoyi does calm luxury well. Start with a contemporary art space, follow it with one of the best brunches on the island, and finish with a slow walk under the old trees. Polished but never stiff.",
    dateLabel: "Sun, Oct 12",
    durationLabel: "Half day",
    currency: "NGN",
    contextLine: "Sunday morning. Brunch spots fill up by 11.",
    steps: [
      "Contemporary art space",
      "island brunch",
      "tree-lined walk",
    ],
    timeLabel: "~4h",
    costAmount: 20000,
    distanceLabel: "5.0 km away",
    timeline: [
      {
        part: "Morning",
        items: [
          {
            time: "10:00",
            title: "Contemporary art space",
            detail: "A quiet hour with new Nigerian art.",
          },
          {
            time: "12:00",
            title: "Island brunch",
            detail: "The kind of brunch people write home about.",
          },
        ],
      },
      {
        part: "Afternoon",
        items: [
          {
            time: "14:00",
            title: "Tree-lined walk",
            detail: "Slow stroll through old Ikoyi's green streets.",
          },
        ],
      },
    ],
  },
  {
    id: "surulere-street-food",
    name: "Surulere Street Food Run",
    area: "Surulere, Lagos",
    vibes: ["Foodie", "Adventure"],
    rating: 4.5,
    reviews: 230,
    image: img("getaway-surulere"),
    tagline: "Five stops. Zero regrets.",
    description:
      "A guided-by-appetite run through Surulere's best street food: suya, akara, roasted corn, and whatever smells good on the corner. Come hungry, bring cash, pace yourself — this is a marathon, not a sprint.",
    dateLabel: "Sat, Oct 11",
    durationLabel: "Evening",
    currency: "NGN",
    contextLine: "Evening hunger. The suya corner lights up at 5.",
    steps: ["Suya stop one", "akara and pap", "roasted corn to close"],
    timeLabel: "~3h",
    costAmount: 5000,
    distanceLabel: "7.8 km away",
    timeline: [
      {
        part: "Evening",
        items: [
          {
            time: "17:00",
            title: "Suya stop one",
            detail: "The famous corner — extra pepper if you dare.",
          },
          {
            time: "18:30",
            title: "Akara & pap",
            detail: "Hot bean cakes from the evening fryer.",
          },
          {
            time: "20:00",
            title: "Roasted corn + gist",
            detail: "Wind down with corn and street-side conversation.",
          },
        ],
      },
    ],
  },
  {
    id: "elegushi-beach-reset",
    name: "Elegushi Beach Reset",
    area: "Lekki, Lagos",
    vibes: ["Outdoors", "Chill"],
    rating: 4.7,
    reviews: 174,
    image: img("getaway-elegushi"),
    tagline: "Salt air fixes most things.",
    description:
      "When the week has been too much, the answer is the ocean. A no-agenda beach reset: swim, walk the shoreline, eat grilled fish with your feet in the sand, and watch the sun do its thing.",
    dateLabel: "Sun, Oct 12",
    durationLabel: "Full day",
    currency: "NGN",
    contextLine: "You need salt air. Low tide is at 10.",
    steps: ["Early swim", "grilled fish lunch", "sunset watch"],
    timeLabel: "~8h",
    costAmount: 12000,
    distanceLabel: "9.3 km away",
    timeline: [
      {
        part: "Morning",
        items: [
          {
            time: "09:30",
            title: "Early swim",
            detail: "Beat the crowd — the water is calmest before noon.",
          },
        ],
      },
      {
        part: "Afternoon",
        items: [
          {
            time: "13:00",
            title: "Grilled fish lunch",
            detail: "Beachside shack, feet in the sand.",
          },
          {
            time: "15:30",
            title: "Shoreline walk",
            detail: "Long slow walk, no destination.",
          },
        ],
      },
      {
        part: "Evening",
        items: [
          {
            time: "18:00",
            title: "Sunset watch",
            detail: "Find a good spot and stay until the sky goes pink.",
          },
        ],
      },
    ],
  },
  {
    id: "brooklyn-golden-hour",
    name: "Sunset Reset",
    area: "Brooklyn, NYC",
    vibes: ["Chill", "Outdoors"],
    rating: 4.8,
    reviews: 321,
    image: img("getaway-brooklyn"),
    tagline: "Golden hour, done right.",
    description:
      "A short, perfect evening: walk to the viewpoint while the light is good, grab something cold nearby, and watch the sun drop behind the skyline. Proof that the best plans are sometimes the simplest.",
    dateLabel: "Today",
    durationLabel: "Evening",
    currency: "USD",
    contextLine:
      "Sunset is in 52 minutes. There's a good viewpoint 14 minutes away.",
    steps: ["Walk over", "grab a drink nearby", "watch sunset"],
    timeLabel: "~1h 25m",
    costAmount: 8,
    distanceLabel: "1.8 mi away",
    timeline: [
      {
        part: "Evening",
        items: [
          {
            time: "18:10",
            title: "Walk to the viewpoint",
            detail: "14 minutes on foot — leave now to catch the light.",
          },
          {
            time: "18:30",
            title: "Grab a drink nearby",
            detail: "Corner bodega or the wine bar on the block.",
          },
          {
            time: "19:02",
            title: "Watch sunset",
            detail: "Sun drops at 7:02. Don't be late.",
          },
        ],
      },
    ],
  },
  {
    id: "notting-hill-sunday",
    name: "Notting Hill Sunday",
    area: "Notting Hill, London",
    vibes: ["Culture", "Foodie", "Chill"],
    rating: 4.7,
    reviews: 189,
    image: img("getaway-notting"),
    tagline: "Market mornings and pub afternoons.",
    description:
      "Sunday in Notting Hill runs on a simple formula: coffee, the market, a bookshop, then a pub with a roast. Unhurried, colorful, and quietly perfect.",
    dateLabel: "Sun, Oct 12",
    durationLabel: "Half day",
    currency: "GBP",
    contextLine: "Portobello is liveliest before noon on Sundays.",
    steps: ["Coffee and market stroll", "bookshop browse", "pub lunch"],
    timeLabel: "~3h",
    costAmount: 25,
    distanceLabel: "0.9 mi away",
    timeline: [
      {
        part: "Morning",
        items: [
          {
            time: "10:00",
            title: "Coffee and market stroll",
            detail: "Portobello Road at its Sunday best.",
          },
          {
            time: "11:30",
            title: "Bookshop browse",
            detail: "The famous blue-door bookshop street.",
          },
        ],
      },
      {
        part: "Afternoon",
        items: [
          {
            time: "13:00",
            title: "Pub lunch",
            detail: "Roast and a pint in a proper local.",
          },
        ],
      },
    ],
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function similarPlans(id: string, count = 4): Plan[] {
  const plan = getPlan(id);
  if (!plan) return PLANS.slice(0, count);
  const scored = PLANS.filter((p) => p.id !== id).map((p) => ({
    plan: p,
    score:
      p.vibes.filter((v) => plan.vibes.includes(v)).length * 2 +
      (p.area === plan.area ? 1 : 0),
  }));
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s) => s.plan);
}

/* ------------------------------ Explore ------------------------------ */

export const EXPLORE_CATEGORIES = [
  "Stay",
  "Do",
  "Eat & Relax",
  "Go Out",
  "Getaways",
] as const;

/* ------------------------------ Planner ------------------------------ */

export type ItineraryStop = {
  time: string;
  title: string;
  detail: string;
  cost: number;
};

export type SampleItinerary = {
  location: string;
  day: string;
  people: number;
  occasion: string;
  budget: number;
  currency: Currency;
  stops: ItineraryStop[];
};

export const SAMPLE_ITINERARY: SampleItinerary = {
  location: "Lagos",
  day: "Saturday",
  people: 2,
  occasion: "Date",
  budget: 100000,
  currency: "NGN",
  stops: [
    {
      time: "12:00",
      title: "Art gallery in Ikoyi",
      detail: "Quiet hour, then coffee next door.",
      cost: 10000,
    },
    {
      time: "14:00",
      title: "Lunch at a waterfront spot",
      detail: "Seafood and a view — the date classic.",
      cost: 45000,
    },
    {
      time: "16:30",
      title: "Beach walk at Elegushi",
      detail: "Golden hour on the sand. Free.",
      cost: 5000,
    },
    {
      time: "19:00",
      title: "Dinner + live music in Lekki",
      detail: "Small chops, cocktails, acoustic set.",
      cost: 35000,
    },
  ],
};

export function formatMoney(currency: Currency, amount: number): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${amount.toLocaleString("en-US")}`;
}

/* ------------------------------ Trips ------------------------------ */

export type Trip = {
  id: string;
  name: string;
  dateLabel: string;
  image: string;
  status: "upcoming" | "past";
};

export const TRIPS: Trip[] = [
  {
    id: "t1",
    name: "Lekki Slow Saturday",
    dateLabel: "Sat, Oct 11",
    image: img("getaway-lekki-slow", 200, 200),
    status: "upcoming",
  },
  {
    id: "t2",
    name: "VI After Dark",
    dateLabel: "Fri, Oct 17",
    image: img("getaway-vi-night", 200, 200),
    status: "upcoming",
  },
  {
    id: "t3",
    name: "Sunset Reset",
    dateLabel: "Sep 28",
    image: img("getaway-brooklyn", 200, 200),
    status: "past",
  },
  {
    id: "t4",
    name: "Yaba Culture Crawl",
    dateLabel: "Sep 20",
    image: img("getaway-yaba", 200, 200),
    status: "past",
  },
  {
    id: "t5",
    name: "Surulere Street Food Run",
    dateLabel: "Sep 6",
    image: img("getaway-surulere", 200, 200),
    status: "past",
  },
];

/* ------------------------------ Profile ------------------------------ */

export type Collection = {
  id: string;
  name: string;
  count: number;
  image: string;
};

export const COLLECTIONS: Collection[] = [
  {
    id: "c1",
    name: "Date ideas",
    count: 8,
    image: img("getaway-coll-date", 400, 300),
  },
  {
    id: "c2",
    name: "December Lagos",
    count: 12,
    image: img("getaway-coll-dec", 400, 300),
  },
  {
    id: "c3",
    name: "Solo resets",
    count: 5,
    image: img("getaway-coll-solo", 400, 300),
  },
];
