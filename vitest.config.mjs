import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      obsidian: path.resolve(__dirname, './__mocks__/obsidian.js'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    server: {
      deps: {
        inline: ['obsidian'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
