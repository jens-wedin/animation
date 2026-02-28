import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site at /animation/ — set base for production builds
  base: command === 'build' ? '/animation/' : '/',

  test: {
    // Run in Node — no browser APIs needed for the utility layer
    environment: 'node',

    // Only collect coverage from the testable layer
    coverage: {
      provider: 'v8',
      include: ['src/utils/**/*.js'],
      exclude: ['src/utils/**/*.test.js'],
      reporter: ['text', 'html'],
      // Fail the run if coverage drops below these thresholds
      thresholds: {
        lines:     90,
        functions: 90,
        branches:  80,
      },
    },
  },
}));
