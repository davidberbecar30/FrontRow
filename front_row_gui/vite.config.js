import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server:{
      host:true,
      proxy: {
        '/auth': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/events': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) return '/index.html'
          }
        },
        '/admin': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) return '/index.html'
          }
        },
        '/chat': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) return '/index.html'
          }
        },
        '/faker': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) return '/index.html'
          }
        },
        '/stats': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) return '/index.html'
          }
        },
        '/ws': {
          target: 'ws://localhost:3000',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/tests/setup.js'],
        exclude: ['tests/**', 'node_modules/**'],
    },
})
