import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: './', // Required for Electron to load assets correctly
  server: {
    port: 3000,
    open: false // Don't open browser automatically in Electron
  },
  // Ensure .env variables are loaded
  envPrefix: 'VITE_',
  // Optimize dependencies
  optimizeDeps: {
    exclude: [
      '@pdftron/webviewer',
      // Exclude CKEditor from optimization to prevent duplication errors
      '@ckeditor/ckeditor5-react',
      '@ckeditor/ckeditor5-editor-classic',
      '@ckeditor/ckeditor5-essentials',
      '@ckeditor/ckeditor5-basic-styles',
      '@ckeditor/ckeditor5-alignment',
      '@ckeditor/ckeditor5-autoformat',
      '@ckeditor/ckeditor5-block-quote',
      '@ckeditor/ckeditor5-code-block',
      '@ckeditor/ckeditor5-find-and-replace',
      '@ckeditor/ckeditor5-font',
      '@ckeditor/ckeditor5-heading',
      '@ckeditor/ckeditor5-image',
      '@ckeditor/ckeditor5-indent',
      '@ckeditor/ckeditor5-link',
      '@ckeditor/ckeditor5-list',
      '@ckeditor/ckeditor5-paragraph',
      '@ckeditor/ckeditor5-source-editing',
      '@ckeditor/ckeditor5-table',
      '@ckeditor/ckeditor5-typing',
      '@ckeditor/ckeditor5-undo',
      '@ckeditor/ckeditor5-upload',
      '@ckeditor/ckeditor5-widget'
    ]
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  // Copy TinyMCE assets to public directory for self-hosted version
  publicDir: 'public',
});

