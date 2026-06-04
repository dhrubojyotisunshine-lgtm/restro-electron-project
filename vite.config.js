import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  optimizeDeps: {
    include: ["react-select"],
  },
  plugins: [react()],
  base: './', // Use relative paths for Electron
});