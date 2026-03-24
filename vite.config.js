import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/oss-work-01/',
  build: {
    sourcemap: false,
    target: 'es2015',
  }
})
