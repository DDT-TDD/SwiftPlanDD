import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-konva': ['konva', 'react-konva'],
          'vendor-rough': ['roughjs/bin/rough'],
          'vendor-zustand': ['zustand'],
        },
      },
    },
  },
  base: './',
})
