import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4300', trace: 'retain-on-failure' },
  webServer: {
    command:
      './node_modules/.bin/ng serve --host 127.0.0.1 --port 4300 --proxy-config proxy.e2e.conf.json --live-reload=false',
    cwd: process.cwd(),
    url: 'http://127.0.0.1:4300',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
