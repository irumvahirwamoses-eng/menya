import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET ?? 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: (id) => (id.includes('node_modules/recharts') ? 'charts' : undefined),
        },
      },
    },
  }
})
