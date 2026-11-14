import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2023',
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
    chunkSizeWarningLimit: 2000, // Phaser itself is ~1.2 MB minified
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
      },
    },
  },
  preview: { headers: securityHeaders },
  test: { include: ['src/**/*.test.ts'] },
});
