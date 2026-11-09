import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin';

// Production-only Content Security Policy. No inline/eval scripts are used anywhere, so scripts
// are locked to our own origin. Styles need 'unsafe-inline' because Astryx sets inline style
// attributes; the theme's font CSS comes from Google Fonts. Everything else is closed down.
// (Dev is excluded: Vite's HMR client needs inline scripts and a websocket.)
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
].join('; ');

const securityHeaders = (): Plugin => ({
  name: 'code-club-hub:security-meta',
  apply: 'build',
  transformIndexHtml: () => [
    {tag: 'meta', attrs: {'http-equiv': 'Content-Security-Policy', content: CSP}, injectTo: 'head-prepend'},
    {tag: 'meta', attrs: {name: 'referrer', content: 'strict-origin-when-cross-origin'}, injectTo: 'head-prepend'},
  ],
});

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
    securityHeaders(),
  ],
});
