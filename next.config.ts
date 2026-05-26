import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent webpack from bundling pdf-parse (it has issues with test file resolution in Next.js)
  serverExternalPackages: ["pdf-parse"],

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  webpack: (config, { isServer }) => {
    // Prevent canvas from being bundled (used by PDF.js but not needed server-side)
    config.resolve.alias.canvas = false;

    // Prevent pdf-parse test files from being loaded
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("pdf-parse");
      }
    }

    return config;
  },
};

export default nextConfig;
