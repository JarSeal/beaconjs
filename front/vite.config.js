import { defineConfig } from 'vite';
import 'dotenv/config';

export default defineConfig({
  root: './src',
  build: {
    // Relative to the root
    outDir: './dist',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
