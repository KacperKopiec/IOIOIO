import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Same proxy is applied to both `vite` (dev) and `vite preview` (production
// build) so `/api` and `/storage` reach the backend container in either mode.
const proxy = {
  '/api': {
    target: 'http://crm-backend:8000',
    changeOrigin: true,
  },
  '/storage': {
    target: 'http://crm-backend:8000',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
