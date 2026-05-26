const quotes = [
  {
    text: "FactCheckX caught three outdated statistics in our investor deck before we sent it. Saved us from a painful correction cycle.",
    author: "Sarah Chen",
    role: "Head of Research, Meridian Capital",
  },
  {
    text: "The GEO dashboard finally gave us visibility into how ChatGPT and Perplexity talk about our brand versus competitors.",
    author: "James Okonkwo",
    role: "VP Marketing, Lattice AI",
  },
  {
    text: "Cleanest fact-checking UI I've used. Feels like a tool built by people who actually do research.",
    author: "Dr. Elena Vasquez",
    role: "Policy Analyst, Open Data Institute",
  },
];

export function Testimonials() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="editorial-heading text-3xl text-[#0c2d4d]">Trusted by teams</h2>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {quotes.map((q) => (
            <blockquote
              key={q.author}
              className="flex flex-col justify-between rounded-lg border border-border bg-white/92 p-6 shadow-sm"
            >
              <p className="text-[15px] leading-relaxed text-[#3f6382]">&ldquo;{q.text}&rdquo;</p>
              <footer className="mt-6 border-t border-border pt-4">
                <p className="text-sm font-medium text-[#12395f]">{q.author}</p>
                <p className="text-[13px] text-[#6284a7]">{q.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
