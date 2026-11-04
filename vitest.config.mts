import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/domain/**'],
      exclude: ['src/domain/types.ts'],
      reporter: ['text', 'json-summary'],
      reportOnFailure: true,
      // PHASE 13: business logic stays well tested
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 80 },
    },
  },
});
