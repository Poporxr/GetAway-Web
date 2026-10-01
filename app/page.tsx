const PRINCIPLES = [
  {
    title: "Decisions, not directories",
    body: "Getaway recommends a small number of realistic things you can actually do — not an endless list of places.",
  },
  {
    title: "Time is inventory",
    body: "30 minutes, 2 hours, tonight, the weekend. Your free time is the first input, not an afterthought.",
  },
  {
    title: "Useful even when it's free",
    body: "Sunsets, walks, quests and public spaces count. No booking required to have a good time.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-sm font-extrabold tracking-[0.3em] text-olive">
          GETAWAY
        </span>
        <a
          href="#waitlist"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper"
        >
          Join the waitlist
        </a>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 text-center">
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight md:text-7xl">
          What should you do with your free time?
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink/70">
          Tell Getaway how you feel and how much time you have. Get a decision —
          a walk, a plan, a quest, a night out — grounded in what's actually
          open, nearby and worth it.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a
            href="#waitlist"
            className="rounded-full bg-ink px-8 py-4 font-semibold text-paper"
          >
            Get early access
          </a>
          <a
            href="#how"
            className="rounded-full bg-sage px-8 py-4 font-semibold text-ink"
          >
            How it works
          </a>
        </div>
      </section>

      <section id="how" className="bg-ink py-20 text-paper">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-3xl bg-white/5 p-8">
              <h2 className="text-xl font-bold">{p.title}</h2>
              <p className="mt-3 text-paper/70">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="waitlist" className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold">Be first to escape the routine.</h2>
        <p className="mt-4 text-ink/70">
          Launching soon in select cities across Nigeria, the US and the UK.
        </p>
        <form
          className="mx-auto mt-8 flex max-w-md gap-2"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            required
            placeholder="you@example.com"
            className="flex-1 rounded-full border border-ink/15 bg-white px-5 py-3 outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-olive px-6 py-3 font-semibold text-white"
          >
            Notify me
          </button>
        </form>
      </section>

      <footer className="border-t border-ink/10 py-8 text-center text-sm text-ink/50">
        Getaway — a free-time decision engine. © 2026
      </footer>
    </main>
  );
}
