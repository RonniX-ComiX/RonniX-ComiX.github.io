import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Entfernt Tailwind-CDN DEV_ONLY beim Build (Dev≠Prod vermeiden)
const removeDevScripts = () => {
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
export default defineConfig(({
  plugins: [
    react(),
    removeDevScripts()
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
            if (id.includes('lucide-react')) return 'icons';
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
} as any));
