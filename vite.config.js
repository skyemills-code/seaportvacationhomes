import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Offline-first: base './' so the built app runs from any static path or file://
export default defineConfig({
  base: './',
  plugins: [react()],
})
