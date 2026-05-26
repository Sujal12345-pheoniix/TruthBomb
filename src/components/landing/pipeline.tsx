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

        {/* Mobile View: Vertical Timeline Layout (hidden sm) */}
        <div className="relative mt-12 flex flex-col gap-6 pl-6 sm:hidden">
          {/* Vertical connecting line */}
          <div className="absolute bottom-6 left-2.5 top-2 w-[1.5px] bg-gradient-to-b from-[#113a60] to-[#ccd9ec]" />
          
          {steps.map((step, i) => (
            <div key={step.label} className="relative flex items-start gap-4">
              {/* Timeline marker */}
              <div className="absolute -left-[21px] flex h-[11px] w-[11px] items-center justify-center rounded-full bg-white border-2 border-[#113a60]">
                <div className="h-1.5 w-1.5 rounded-full bg-[#e8460a]" />
              </div>
              <div className="flex-1 rounded-lg border border-border bg-white/90 p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-bold text-[#113a60]">{step.label}</p>
                  <span className="font-mono text-[10px] font-bold text-[#a0b8d4]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] text-[#63809d]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Horizontal Flow (visible sm+) */}
        <div className="mt-14 hidden flex-wrap gap-3 sm:flex">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="min-w-[145px] rounded-lg border border-border bg-white/90 px-4 py-3.5 shadow-sm transition-all hover:border-[#8fb6df] hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-[#113a60]">{step.label}</p>
                  <span className="font-mono text-[9px] text-[#89a4be]">{(i + 1).toString().padStart(2, "0")}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#63809d] leading-snug">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <span className="text-[#9bb5cf] select-none font-bold">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
