"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/fact-check", label: "Fact Check" },
  { href: "/geo", label: "GEO Analytics" },
];

export function Header({ minimal = false }: { minimal?: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-[#f7fbff]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#0f355b] to-[#1d6bb8] text-[11px] font-semibold tracking-tight text-white shadow-sm">
            FX
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[#102b44]">
            FactCheckX
          </span>
        </Link>

        {!minimal && (
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-white text-[#103558] shadow-sm"
                    : "text-muted-foreground hover:bg-white/75 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <Link
            href="/fact-check"
            className="hidden rounded-md border border-border bg-white/70 px-3 py-1.5 text-[13px] text-[#365676] transition-colors hover:bg-white sm:inline-flex"
          >
            Upload PDF
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-gradient-to-r from-[#123a61] to-[#1f6ab2] px-3 py-1.5 text-[13px] font-medium text-white transition-all hover:-translate-y-0.5"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
