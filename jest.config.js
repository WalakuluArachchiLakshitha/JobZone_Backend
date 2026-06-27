/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  transform: {},
  // Use --experimental-vm-modules for ESM support
  testMatch: ["**/tests/**/*.test.js"],
  // Increase timeout for DB operations
  testTimeout: 15000,
  // Run tests sequentially to avoid DB conflicts
  maxWorkers: 1,
  // Setup/teardown
  globalSetup: "./tests/globalSetup.js",
  globalTeardown: "./tests/globalTeardown.js",
  setupFilesAfterFramework: [],
};
