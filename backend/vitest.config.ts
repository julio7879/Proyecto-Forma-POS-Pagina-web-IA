import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 15000,
    setupFiles: ['./src/setupTests.ts'],
  },
});
