import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server:{
      host:true,
      proxy: {
        '/auth': {
          target: 'https://192.168.1.8:3000',
          secure: false,
          bypass: (req) => {
            // Browser navigations (Accept: text/html) should get the SPA, not the proxy
            if (req.headers.accept?.includes('text/html')) return '/index.html'
          }
        },
        '/events': {
          target: 'https://192.168.1.8:3000',
          secure: false,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) return '/index.html'
          }
        },
        '/admin': {
          target: 'https://192.168.1.8:3000',
          secure: false,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) return '/index.html'
          }
        },
        '/chat': {
          target: 'https://192.168.1.8:3000',
          secure: false,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) return '/index.html'
          }
        },
        '/faker': {
          target: 'https://192.168.1.8:3000',
          secure: false,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) return '/index.html'
          }
        },
        '/stats': {
          target: 'https://192.168.1.8:3000',
          secure: false,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) return '/index.html'
          }
        },
        '/ws': {
          target: 'wss://192.168.1.8:3000',
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
