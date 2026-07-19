import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { __TEST__: JSON.stringify(process.env.NODE_ENV === 'test') },
  server: { port: Number(process.env.WEB_PORT ?? 5180), strictPort: true },
});
