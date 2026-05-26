"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSearch,
  Globe2,
  History,
  Settings,
  BarChart3,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/fact-check", label: "Fact Check", icon: FileSearch },
  { href: "/geo", label: "GEO Analytics", icon: Globe2 },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/insights", label: "Insights", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[234px] shrink-0 border-r border-border/70 bg-[#f5f9ff]/85 backdrop-blur lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-border/70 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#e8460a] to-[#b83200] shadow-sm">
            <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-bold text-[#0d1f32]">Truth<span className="text-[#e8460a]">Bomb</span></span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                active
                  ? "bg-white text-[#103558] font-medium shadow-sm"
                  : "text-[#54708b] hover:bg-white/80 hover:text-[#1d3e5f]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/70 p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-[#54708b] hover:bg-white/80 hover:text-[#1d3e5f]"
        >
          <Settings className="h-4 w-4 opacity-70" />
          Back to site
        </Link>
      </div>
    </aside>
  );
}
