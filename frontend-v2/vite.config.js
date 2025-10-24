import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    historyApiFallback: true,
    // Ensure proper SPA routing in development
    middlewareMode: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize for SPA deployment
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Ensure proper asset handling
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    // Ensure proper base path for deployment
    assetsDir: 'assets',
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  define: {
    'process.env': {}
  },
  // Ensure proper base path
  base: './',
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})