import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom Plugin: Entfernt Code-Blöcke zwischen <!-- DEV_ONLY_START --> und <!-- DEV_ONLY_END -->
// Dies passiert NUR beim Befehl 'vite build', nicht bei 'vite dev'.
const removeDevScripts = () => {
  return {
    name: 'remove-dev-scripts',
    apply: 'build' as const, // FIX: 'as const' zwingt TS dazu, dies als Literal 'build' zu erkennen
    transformIndexHtml(html: string) {
      return html.replace(
        /<!--\s*DEV_ONLY_START\s*-->[\s\S]*?<!--\s*DEV_ONLY_END\s*-->/g,
        '<!-- Tailwind CDN removed for production build -->'
      );
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    removeDevScripts() // Plugin registrieren
  ],
  build: {
    // Erhöht das Limit für die Warnung auf 1000 kB (1 MB)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor';
            if (id.includes('lucide-react')) return 'icons';
          }
        }
      }
    }
  }
});