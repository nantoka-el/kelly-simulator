import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/kelly-simulator/',
  plugins: [react()],
});
