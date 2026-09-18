import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Lets the debug-only laptop lab import the GLB as a URL without moving it.
  assetsInclude: ['**/*.glb'],
  server: {
    host: '0.0.0.0',
  },
})
