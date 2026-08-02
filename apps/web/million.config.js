/** Million.js Configuration */
const { defineConfig } = require('million/config');

module.exports = defineConfig({
  // Auto-optimize all React components
  auto: true,

  // Server components optimization
  server: true,

  // Enable React Server Components optimization
  rsc: true,

  // Optimization mode
  mode: 'production',

  // Files to include
  include: [
    '**/*.{ts,tsx,js,jsx}',
    '!**/node_modules/**',
    '!**/.next/**',
  ],

  // Performance budget warnings
  budget: {
    warning: 50, // Warn if component render takes >50ms
    error: 100,  // Error if component render takes >100ms
  },
});