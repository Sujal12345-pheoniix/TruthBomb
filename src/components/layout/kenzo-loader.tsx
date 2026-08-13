"use client";

import { useEffect } from "react";

export function KenzoLoader() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const existing = document.querySelector('script[src*="sdk.js"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://kenzo-dap.onrender.com/sdk.js';
        script.dataset.kenzoKey = 'kenzo_project_dev_api_key_2026';
        script.dataset.apiBase = 'https://kenzo-dap.onrender.com/api/v1';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  return null;
}
