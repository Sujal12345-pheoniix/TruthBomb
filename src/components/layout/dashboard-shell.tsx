"use client";

import { Sidebar } from "./sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border/70 bg-[#f7fbff]/70 px-6 backdrop-blur">
          <div className="text-sm text-muted-foreground">
            <kbd className="rounded border border-border bg-white/80 px-1.5 py-0.5 font-mono text-[11px] shadow-sm">
              ⌘K
            </kbd>
            <span className="ml-2 hidden sm:inline">Quick search</span>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <span className="hidden sm:inline">Research workspace</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 ambient-ring" title="Systems operational" />
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
