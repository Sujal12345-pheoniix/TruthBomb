"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Zap, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/fact-check", label: "Fact Check" },
  { href: "/geo", label: "GEO Analytics" },
];

export function Header({ minimal = false }: { minimal?: boolean }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-15 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#e8460a] to-[#b83200] shadow-sm group-hover:shadow-md transition-shadow">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-[#0d1f32]">
            Truth<span className="text-[#e8460a]">Bomb</span>
          </span>
        </Link>

        {!minimal && (
          <nav className="hidden items-center gap-0.5 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition-all",
                  pathname.startsWith(item.href)
                    ? "bg-[#f0f5ff] text-[#0e2f54]"
                    : "text-[#526e8a] hover:bg-white/80 hover:text-[#0d1f32]"
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
            className="hidden rounded-md border border-border/80 bg-white px-3 py-1.5 text-[13px] text-[#365676] transition-all hover:border-[#a0b8d4] hover:bg-[#f5f9ff] sm:inline-flex"
          >
            Upload PDF
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-[#0e2f54] px-3 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-[#123860] hover:-translate-y-0.5 shadow-sm"
          >
            Dashboard
          </Link>

          {!minimal && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border/80 bg-white text-[#526e8a] hover:bg-[#f5f9ff] transition-all md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {!minimal && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border/50 bg-white/95 backdrop-blur-lg md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-[14px] font-medium transition-all",
                    pathname.startsWith(item.href)
                      ? "bg-[#f0f5ff] text-[#0e2f54] font-semibold"
                      : "text-[#526e8a] hover:bg-black/[0.03]"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-border/50 pt-3 flex flex-col gap-2">
                <Link
                  href="/fact-check"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center rounded-md border border-border/80 bg-white py-2 text-[13px] text-[#365676] font-medium transition-all hover:bg-[#f5f9ff]"
                >
                  Upload PDF
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
