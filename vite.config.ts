import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: {
        disabled: true,
        config: true,
      },
      manifest: {
        name: 'Gourmet Glatt Inventory - Production',
        short_name: 'GourmetGlatt',
        description: 'Inventory Management App for Gourmet Glatt',
        theme_color: '#202312',
        background_color: '#202312',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'images/logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'images/logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'images/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Escaneo de Inventario',
            short_name: 'Escaneo',
            description: 'Acceso directo a la cámara de escaneo',
            url: '/supervisor/scan',
            icons: [{ src: 'images/logo.png', sizes: '192x192' }]
          },
          {
            name: 'Catálogo de Productos',
            short_name: 'Catálogo',
            description: 'Ver inventario completo',
            url: '/supervisor/catalog',
            icons: [{ src: 'images/logo.png', sizes: '192x192' }]
          },
          {
            name: 'Generador de Reportes',
            short_name: 'Reportes',
            description: 'Exportar analíticas y PDFs',
            url: '/supervisor/report',
            icons: [{ src: 'images/logo.png', sizes: '192x192' }]
          }
        ]
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 3000000,
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
