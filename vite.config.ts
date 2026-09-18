import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Cast process to 'any' to avoid TS errors if @types/node is missing.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Vercel injects env vars into process.env during build.
  // We check both 'env' (Vite's loader) and 'process.env' (Node's actual process)
  const apiKey = env.API_KEY || (process as any).env?.API_KEY;

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
    },
    define: {
      // Critical: explicitly replace process.env.API_KEY with the string value.
      'process.env.API_KEY': JSON.stringify(apiKey),
      // Polyfill remaining process.env calls to avoid 'process is not defined' browser errors
      'process.env': {},
    }
  }
})