"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function KenzoLoader() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const API_KEY = "kz_live_tb_8f93a102";
    const API_BASE = "https://kenzo-dap.onrender.com/api/v1";

    function initKenzo() {
      if ((window as any).Kenzo) {
        try {
          (window as any).Kenzo.init({
            apiKey: API_KEY,
            apiBaseUrl: API_BASE,
            debug: true,
            darkMode: true,
          });
        } catch (e) {
          console.debug("[Kenzo Loader] Initialization notice:", e);
        }
      }
    }

    const existing = document.querySelector('script[src*="sdk.js"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://kenzo-dap.onrender.com/sdk.js";
      script.dataset.kenzoKey = API_KEY;
      script.dataset.apiBase = API_BASE;
      script.async = true;
      script.onload = () => {
        initKenzo();
      };
      document.body.appendChild(script);
    } else {
      initKenzo();
    }
  }, []);

  // Trigger route-matching flow updates on Next.js SPA page navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      if ((window as any).Kenzo && typeof (window as any).Kenzo.reload === "function") {
        (window as any).Kenzo.reload().catch(() => {});
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
