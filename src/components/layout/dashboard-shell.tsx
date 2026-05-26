"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer (Visible on < lg) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/15 backdrop-blur-xs lg:hidden"
            />
            {/* Slide-in sidebar container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[240px] shadow-2xl lg:hidden flex flex-col bg-[#f5f9ff] border-r border-border/80"
            >
              <Sidebar
                className="flex w-full h-full border-r-0 bg-transparent"
                onClose={() => setMobileSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-border/70 bg-[#f7fbff]/70 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Trigger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border/80 bg-white text-[#526e8a] hover:bg-[#f5f9ff] transition-all lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div className="text-sm text-muted-foreground flex items-center">
              <kbd className="rounded border border-border bg-white/80 px-1.5 py-0.5 font-mono text-[11px] shadow-sm">
                ⌘K
              </kbd>
              <span className="ml-2 hidden sm:inline">Quick search</span>
            </div>
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
