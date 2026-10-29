import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Khi chạy trên máy: mọi request /api/... được chuyển sang backend ở cổng 3000.
    // Nhờ vậy frontend chỉ cần gọi fetch('/api/products'), không phải ghi địa chỉ backend.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
