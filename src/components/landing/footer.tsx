import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-[#f7fbff]/85">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <p className="text-[15px] font-bold text-[#0d1f32]">Truth<span className="text-[#e8460a]">Bomb</span></p>
            <p className="mt-2 max-w-xs text-[14px] text-[#5f7c98]">
              AI-powered fact verification and GEO intelligence for modern brands.
            </p>
          </div>
          <div className="flex gap-16 text-[13px]">
            <div>
              <p className="font-medium text-[#2f5377]">Product</p>
              <ul className="mt-3 space-y-2 text-[#5f7c98]">
                <li><Link href="/fact-check" className="hover:text-[#1d476d]">Fact Check</Link></li>
                <li><Link href="/geo" className="hover:text-[#1d476d]">GEO Analytics</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#1d476d]">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#2f5377]">Company</p>
              <ul className="mt-3 space-y-2 text-[#5f7c98]">
                <li><Link href="#" className="hover:text-[#1d476d]">About</Link></li>
                <li><Link href="#" className="hover:text-[#1d476d]">Privacy</Link></li>
                <li><Link href="#" className="hover:text-[#1d476d]">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-12 text-[12px] text-[#7d95ad]">
          © {new Date().getFullYear()} TruthBomb. Powered by OpenAI, Tavily, and Neon PostgreSQL.
        </p>
      </div>
    </footer>
  );
}
