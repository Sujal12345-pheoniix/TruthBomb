"use client";

import { Sidebar } from "./sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <div className="text-sm text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              ⌘K
            </kbd>
            <span className="ml-2 hidden sm:inline">Quick search</span>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <span className="hidden sm:inline">Research workspace</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" title="Systems operational" />
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
