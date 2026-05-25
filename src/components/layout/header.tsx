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
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-900 text-[11px] font-semibold tracking-tight text-stone-50">
            FX
          </span>
          <span className="text-[15px] font-medium tracking-tight text-stone-900">
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
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
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
            className="hidden rounded-md border border-border px-3 py-1.5 text-[13px] text-stone-600 transition-colors hover:bg-muted sm:inline-flex"
          >
            Upload PDF
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-stone-900 px-3 py-1.5 text-[13px] font-medium text-stone-50 transition-colors hover:bg-stone-800"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
