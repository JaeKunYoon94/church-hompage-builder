import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// index.html = landing page (sample picker), editor.html = the React + shadcn/ui editor
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: { rollupOptions: { input: { index: 'index.html', editor: 'editor.html' } } }
});
