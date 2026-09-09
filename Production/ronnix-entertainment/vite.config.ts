/**
 * vite.config.ts — Vite-Build: React, Port-Disziplin, Chunk-Splits, Build-ID.
 *
 * Feature: Dev/Preview immer Port 4174 (`strictPort`), Production ohne
 * Tailwind-CDN (`removeDevScripts`), Vendor-Chunks (firebase/react/utils) für
 * kleinere Diffs, plus `__BUILD_ID__` (Zeitstempel je Build, UTC) als Anker für
 * die Release-scharfe Cache-Invalidierung (`utils/appConfig.ts` BUILD_ID →
 * versionierte localStorage-Keys, alte Generationen werden beim Start gepurgt).
 * Benutzung: `npm run build` / `npm run dev` / `vite preview --port 4174`.
 * Gehört NICHT hierher: SSG-Setup (siehe `docs/PRERENDER.md`, Kette unvollständig),
 * Laufzeit-Config (Env/`utils/appConfig.ts`), Hosting-Header (`firebase.json`).
 */

import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Entfernt Tailwind-CDN DEV_ONLY beim Build (Dev≠Prod vermeiden)
const removeDevScripts = (): Plugin => {
  return {
    name: 'remove-dev-scripts',
    apply: 'build' as const,
    transformIndexHtml(html: string) {
      return html.replace(
        /<!--\s*DEV_ONLY_START\s*-->[\s\S]*?<!--\s*DEV_ONLY_END\s*-->/g,
        '<!-- Tailwind CDN removed for production build -->'
      );
    },
  };
};

// https://vitejs.dev/config/
// Lokales Test-Hosting läuft IMMER auf Port 4174 (dev + preview).
export default defineConfig(({
  plugins: [
    react(),
    removeDevScripts()
  ],
  // Release-scharfe Cache-Invalidierung: jeder Build prägt seine ID ein
  // (kompakt `YYYYMMDDHHmmss`, UTC). Typ-Deklaration in `vite-env.d.ts`.
  define: {
    __BUILD_ID__: JSON.stringify(
      new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
    ),
  },
  server: {
    port: 4174,
    strictPort: true,
  },
  preview: {
    port: 4174,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
            if (id.includes('dompurify')) return 'utils';
          }
        }
      }
    }
  },
  // Prerender: statische Routen für SEO (Hosting bleibt, kein App Hosting nötig)
  // Build: npm run build:ssg  (vite-ssg build). Fallback: normaler vite build.
  // Prerender (Phase 2): vite-ssg-react CLI — statische Routen /, /news, /contact, /impressum, /datenschutz, /agb
  // Hosting bleibt Firebase Hosting (kein App Hosting). Siehe docs/PRERENDER.md.
}));
