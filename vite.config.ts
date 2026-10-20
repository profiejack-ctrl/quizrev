import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'SUPABASE_', 'NEXT_PUBLIC_'],
  server: {
    port: 5173,
    host: true,
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'mammoth'],
  },
});
