import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/server.js'],
    },
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret-for-unit-tests',
      DB_URL: 'postgresql://test:test@localhost:5432/coreapps_test',
    },
    setupFiles: [],
  },
});
