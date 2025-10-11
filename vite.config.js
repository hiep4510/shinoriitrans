import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  root: '.',             // đảm bảo root ở thư mục hiện tại
  build: {
    outDir: 'dist',      // Cloudflare cần thư mục này
  },
})
