import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-stone-50/30">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <p className="text-[15px] font-medium text-stone-900">FactCheckX</p>
            <p className="mt-2 max-w-xs text-[14px] text-stone-500">
              AI-powered fact verification and GEO intelligence for modern brands.
            </p>
          </div>
          <div className="flex gap-16 text-[13px]">
            <div>
              <p className="font-medium text-stone-700">Product</p>
              <ul className="mt-3 space-y-2 text-stone-500">
                <li><Link href="/fact-check" className="hover:text-stone-800">Fact Check</Link></li>
                <li><Link href="/geo" className="hover:text-stone-800">GEO Analytics</Link></li>
                <li><Link href="/dashboard" className="hover:text-stone-800">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-stone-700">Company</p>
              <ul className="mt-3 space-y-2 text-stone-500">
                <li><Link href="#" className="hover:text-stone-800">About</Link></li>
                <li><Link href="#" className="hover:text-stone-800">Privacy</Link></li>
                <li><Link href="#" className="hover:text-stone-800">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-12 text-[12px] text-stone-400">
          © {new Date().getFullYear()} FactCheckX. Built for deployment on Vercel + Neon.
        </p>
      </div>
    </footer>
  );
}
