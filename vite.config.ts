import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin';

// Astryx components ship prebuilt (astryx.css), so the StyleX compiler only
// handles our own `stylex.create()` calls in src/. Plugin order matters:
// stylex before react.
export default defineConfig({
  plugins: [
    stylex.vite({
      dev: process.env.NODE_ENV !== 'production',
      runtimeInjection: false,
    }),
    react(),
  ],
});
