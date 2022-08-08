/* eslint-disable no-undef */
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import dotenv from 'dotenv';
import { normalizePath } from 'vite';
import path from 'node:path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const _dirname =
  typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url));

const ENV = dotenv.config({ path: normalizePath(path.resolve(_dirname, 'src/.env')) }).parsed;

export default defineConfig({
  root: './src',
  build: {
    // Relative to the root
    outDir: '../dist',
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(path.resolve(_dirname, `dist/index.html`)),
          dest: normalizePath(path.resolve(_dirname, `../back/front${ENV.VITE_CLIENT_PATH}`)),
        },
        {
          src: normalizePath(path.resolve(_dirname, `dist/assets`)),
          dest: normalizePath(path.resolve(_dirname, `../back/front`)),
        },
      ],
      flatten: true,
    }),
  ],
});
