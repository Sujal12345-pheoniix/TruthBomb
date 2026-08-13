"use client";

import Script from "next/script";

interface KenzoWindow extends Window {
  Kenzo?: {
    init: (config: { apiKey: string; apiBaseUrl: string }) => void;
  };
}

export function KenzoLoader() {
  return (
    <Script
      src="https://kenzo-dap.onrender.com/sdk.js"
      data-kenzo-key="kenzo_project_dev_api_key_2026"
      data-api-base="https://kenzo-dap.onrender.com/api/v1"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== "undefined") {
          const win = window as unknown as KenzoWindow;
          if (win.Kenzo) {
            win.Kenzo.init({
              apiKey: "kenzo_project_dev_api_key_2026",
              apiBaseUrl: "https://kenzo-dap.onrender.com/api/v1",
            });
          }
        }
      }}
    />
  );
}
