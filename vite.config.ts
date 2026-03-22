import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import process from 'node:process'; // Thêm dòng này để fix lỗi process
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // Tải các biến môi trường từ file .env
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Bơm biến API Key vào môi trường client-side
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        // Cấu hình alias '@' trỏ về thư mục gốc
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR (Hot Module Replacement) được kiểm soát qua biến môi trường DISABLE_HMR
      // Điều này thường được dùng trong các môi trường như AI Studio để tránh giật lag khi sửa code
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
