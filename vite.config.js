import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: 'http://localhost:5000', changeOrigin: true },
      },
    },
    build: {
      outDir:       'dist',
      sourcemap:    false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['chart.js', 'react-chartjs-2'],
            'vendor-ui':     ['react-hot-toast'],
          },
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify('2.0.0'),
    },
  };
});
