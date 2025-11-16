import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Plugin para copiar archivos WASM de MediaPipe
const copyMediaPipeWasm = () => {
  const copyFiles = () => {
    const wasmSource = join(__dirname, 'node_modules/@mediapipe/tasks-vision/wasm')
    const wasmDest = join(__dirname, 'public/wasm')
    
    if (existsSync(wasmSource)) {
      if (!existsSync(wasmDest)) {
        mkdirSync(wasmDest, { recursive: true })
      }
      
      const files = ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 
                     'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']
      
      files.forEach(file => {
        const src = join(wasmSource, file)
        const dest = join(wasmDest, file)
        if (existsSync(src)) {
          try {
            copyFileSync(src, dest)
          } catch (err) {
            // Ignorar errores si el archivo ya existe
          }
        }
      })
    }
  }

  return {
    name: 'copy-mediapipe-wasm',
    buildStart() {
      copyFiles()
    },
    configureServer() {
      copyFiles()
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyMediaPipeWasm()],
  server: {
    port: 3000,
    open: true,
    historyApiFallback: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  define: {
    'process.env': {}
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision']
  }
})