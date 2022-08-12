/* eslint-disable no-undef */
import { defineConfig } from 'vite';
import dotenv from 'dotenv';
import { normalizePath } from 'vite';
import path from 'node:path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const _dirname =
  typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url));

const ENV = dotenv.config({ path: normalizePath(path.resolve(_dirname, 'src/.env')) }).parsed;
let CLIENT_PATH;
if (!ENV) {
  CLIENT_PATH = process.env.VITE_CLIENT_PATH;
  console.log(
    'THIS IS WHAT IT OUTPUTS (process envs)',
    CLIENT_PATH,
    process.env.VITE_CLIENT_URL,
    process.env.VITE_CLIENT_PORT
  );
} else {
  CLIENT_PATH = ENV.VITE_CLIENT_PATH;
  console.log(
    'THIS IS WHAT IT OUTPUTS (.env file envs)',
    CLIENT_PATH,
    ENV.VITE_CLIENT_URL,
    ENV.VITE_CLIENT_PORT
  );
}

export default defineConfig({
  root: './src',
  base: './',
  build: {
    // Relative to the root (where this file is)
    outDir: `../../back/front${CLIENT_PATH}`,
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
