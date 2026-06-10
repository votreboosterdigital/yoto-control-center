import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config, { isServer }) {
    if (isServer) {
      // bufferutil est un addon natif optionnel de ws. Quand webpack le bundle,
      // il retourne {} au lieu de lancer MODULE_NOT_FOUND, cassant le try/catch de ws.
      // On l'externalise pour que ws puisse correctement utiliser le fallback pure-JS.
      const existing = config.externals ?? []
      const arr = Array.isArray(existing) ? existing : [existing]
      config.externals = [...arr, 'bufferutil', 'utf-8-validate']
    }
    return config
  },
};

export default nextConfig;
