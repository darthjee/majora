import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Emit a library bundle, not an app with its own index.html.
    lib: {
      entry: 'src/frontend/entry.js',
      formats: ['es'], // Navi loads extension bundles as ESM
      fileName: () => 'hello.js',
      cssFileName: 'hello', // emit hello.css, not <pkg-name>.css
    },
    outDir: 'dist/frontend',
    emptyOutDir: true,
    rollupOptions: {
      // Never bundle React / React-Router — the host SPA already loaded exactly
      // one copy and exposes it through the index.html import map.
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
    },
  },
});
