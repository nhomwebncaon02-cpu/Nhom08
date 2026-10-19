import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const footerPreviewRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(footerPreviewRoot, '..');
const reactBootstrapEsm = resolve(footerPreviewRoot, 'node_modules/react-bootstrap/esm');

export default defineConfig({
  root: workspaceRoot,
  resolve: {
    alias: [
      {
        find: 'react-bootstrap/Container',
        replacement: resolve(reactBootstrapEsm, 'Container.js'),
      },
      {
        find: 'react-bootstrap/Nav',
        replacement: resolve(reactBootstrapEsm, 'Nav.js'),
      },
      {
        find: 'react-bootstrap/Navbar',
        replacement: resolve(reactBootstrapEsm, 'Navbar.js'),
      },
    ],
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    react({
      include: /\.[jt]sx?$/,
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
        ],
      },
    }),
  ],
  build: {
    outDir: resolve(footerPreviewRoot, 'dist'),
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    fs: {
      allow: ['..'],
    },
  },
});