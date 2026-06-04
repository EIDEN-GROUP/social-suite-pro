import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier — Social Media Approval Studio" },
      { name: "description", content: "An editorial workspace where agencies present social campaigns and clients approve them." },
      { property: "og:title", content: "Atelier — Social Media Approval Studio" },
      { property: "og:description", content: "An editorial workspace where agencies present social campaigns and clients approve them." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-6 py-20 md:py-28">
        <header className="flex items-center justify-between">
          <div className="font-display text-2xl tracking-tight">Atelier</div>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/auth" className="underline-offset-4 hover:underline">Studio sign in</Link>
          </nav>
        </header>

        <section className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-8">
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Vol. I — Issue 01
            </p>
            <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">
              An editorial proofing room <em>for every</em> social campaign you ship.
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground">
              Present feed posts, reels, stories, and timelines inside true-to-life device
              mockups. Your clients tap, read, react — then approve or comment. You ship faster.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="rounded-sm bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
              >
                Enter the studio
              </Link>
            </div>
          </div>
          <aside className="md:col-span-4">
            <div className="border-l editorial-rule pl-6">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">In this issue</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>— Instagram feed, reels &amp; stories</li>
                <li>— TikTok vertical preview</li>
                <li>— Facebook timeline</li>
                <li>— X &amp; LinkedIn cards</li>
                <li>— One-tap approve / reject</li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="grid gap-8 border-t editorial-rule pt-12 md:grid-cols-3">
          {[
            { n: "I.", t: "Upload", d: "Drop media, write captions, set the post type per platform." },
            { n: "II.", t: "Preview", d: "See exactly what your client will see — pixel-true device frames." },
            { n: "III.", t: "Approve", d: "Client taps approve, or rejects with a comment. You see it instantly." },
          ].map((s) => (
            <article key={s.n}>
              <div className="font-display text-3xl text-muted-foreground">{s.n}</div>
              <h3 className="mt-2 font-display text-2xl">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </article>
          ))}
        </section>

        <footer className="border-t editorial-rule pt-6 text-xs text-muted-foreground">
          © Atelier Studio — Approval workflow for modern agencies.
        </footer>
      </div>
    </main>
  );
}