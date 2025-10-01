import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    dedupe: ['@codemirror/state', '@codemirror/view', '@codemirror/language', '@codemirror/commands'],
  },
  optimizeDeps: {
    include: [
      '@uiw/react-codemirror',
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/language',
      '@codemirror/commands',
      '@codemirror/lang-javascript',
      '@codemirror/lang-python',
      '@codemirror/lang-cpp',
      '@codemirror/lang-java'
    ],
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
})