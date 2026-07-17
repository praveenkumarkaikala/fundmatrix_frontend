import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// FundMatrix frontend. In dev, /api is proxied to the API gateway on :8090
// (which fronts every microservice under the /api context path), keeping the SPA same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
})
