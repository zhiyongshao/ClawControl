import { defineConfig } from '@playwright/test'
import path from 'path'

const rootDir = path.resolve(__dirname, '..')

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['html', { open: 'never' }]],

  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  webServer: {
    command: 'npx vite --config vite.config.mobile.ts --port 5174',
    port: 5174,
    cwd: rootDir,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
