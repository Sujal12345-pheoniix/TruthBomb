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
    <aside className="hidden w-[220px] shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-stone-900 text-[10px] font-semibold text-white">
            FX
          </span>
          <span className="text-sm font-medium">FactCheckX</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
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
                  ? "bg-stone-100 text-stone-900 font-medium"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-70" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-stone-500 hover:bg-stone-50 hover:text-stone-800"
        >
          <Settings className="h-4 w-4 opacity-70" />
          Back to site
        </Link>
      </div>
    </aside>
  );
}
