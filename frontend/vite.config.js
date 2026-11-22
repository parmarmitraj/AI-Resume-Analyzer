import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      
      '/api/auth': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      
      '/api/jobs': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      '/api/applications': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      
      '/api/student': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        timeout: 300000,
      },
      '/api/recruiter': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        timeout: 300000,
      },
    },
  },
})
