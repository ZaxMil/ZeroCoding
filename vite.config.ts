import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';

// Sitemap generation plugin
const SitemapPostBuild = () => ({
  name: 'sitemap-postbuild',
  closeBundle() {
    if (process.env.NODE_ENV === 'production') {
      try {
        console.log('Generating sitemap...');
        execSync('node scripts/generate-sitemap.cjs', { stdio: 'inherit' });
        console.log('✅ Sitemap generated successfully');
      } catch (error) {
        console.error('❌ Sitemap generation failed:', error);
        throw error; // Fail the build
      }
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    SitemapPostBuild(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['kodelex-favicon.png', 'robots.txt'],
      manifest: {
        name: 'KODELEX Manga Reader',
        short_name: 'Manga Reader',
        description: 'Premium manga reading experience by KODELEX',
        theme_color: '#d4a574',
        background_color: '#1a1a1a',
        display: 'standalone',
        icons: [
          {
            src: 'kodelex-favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'kodelex-favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
        ignoreURLParametersMatching: [/^token$/], // Global token parameter ignore
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/(sign|public)\/.*\.(png|jpg|jpeg|webp|avif)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'sb-pages',
              expiration: {
                maxEntries: 600,
                maxAgeSeconds: 604800 // 7 days
              },
              plugins: [
                {
                  cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
                    const url = new URL(request.url);
                    url.searchParams.delete('token');
                    return url.toString();
                  }
                }
              ]
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-tabs'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}));
