import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

import fs from 'fs';

const buildTimestamp = Date.now();

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BUILD_TIMESTAMP__: buildTimestamp,
  },
  plugins: [
    react(),
    {
      name: 'version-generator',
      buildStart() {
        try {
          fs.writeFileSync(
            path.resolve(__dirname, 'public/version.json'),
            JSON.stringify({ buildTime: buildTimestamp, version: `1.0.${buildTimestamp}` }, null, 2)
          );
        } catch (e) {
          console.warn('Could not write version.json:', e);
        }
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'receipt-icon.svg'],
      manifest: {
        name: 'SplitBill — Private Restaurant Bill Splitter',
        short_name: 'SplitBill',
        description: 'Split a restaurant bill without the headache. Free, private, offline-first.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/tesseract/**', '**/version.json', '**/export-pdf*', '**/export-image*', '**/html2canvas*', '**/inter-vietnamese*', '**/inter-greek*', '**/inter-cyrillic*'],
        navigateFallbackDenylist: [/^\/version\.json/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/version.json',
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/tesseract/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-assets-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      }
    })
  ],
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  // @ts-ignore vitest config
  test: {
    globals: true,
    environment: 'node',
  }
});
