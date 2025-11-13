import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    proxy: {

      '/auth': {
        target: 'https://rtc-proyecto-final.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/auth/, '/api/auth'),
      },
      '/posts': {
        target: 'https://rtc-proyecto-final.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/posts/, '/api/posts'),
      },
      '/comments': {
        target: 'https://rtc-proyecto-final.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/comments/, '/api/comments'),
      },
      '/resources': {
        target: 'https://rtc-proyecto-final.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/resources/, '/api/resources'),
      },
      '/users': {
        target: 'https://rtc-proyecto-final.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/users/, '/api/users'),
      },
    },
  },
})
