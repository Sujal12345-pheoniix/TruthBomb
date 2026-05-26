const steps = [
  { label: "PDF Upload", desc: "Secure validation" },
  { label: "Text Extraction", desc: "pdf-parse" },
  { label: "Claim Extraction", desc: "GPT-4o / Gemini" },
  { label: "Search Queries", desc: "Context-aware" },
  { label: "Live Web Search", desc: "Tavily · Brave · Exa" },
  { label: "Evidence Ranking", desc: "Relevance scoring" },
  { label: "Verification", desc: "AI + sources" },
  { label: "Report", desc: "Executive summary" },
];

export function PipelineSection() {
  return (
    <section className="border-b border-border/70 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#55728e]">
          Verification pipeline
        </p>
        <h2 className="editorial-heading mt-3 max-w-lg text-3xl text-[#0c2d4d]">
          Eight stages from upload to report
        </h2>

        <div className="mt-14 flex flex-wrap gap-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="min-w-[140px] rounded-lg border border-border bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-[13px] font-medium text-[#113a60]">{step.label}</p>
                <p className="mt-0.5 text-[11px] text-[#63809d]">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <span className="hidden text-[#9bb5cf] sm:inline">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
