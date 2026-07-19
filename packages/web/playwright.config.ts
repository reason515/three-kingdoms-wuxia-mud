import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  testDir: './e2e',
  timeout: 15_000,
  globalSetup: './e2e/global-setup.ts',
  use: { baseURL: 'http://127.0.0.1:5180', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'pnpm --dir packages/server start', cwd: repositoryRoot, env: { ...process.env, DATABASE_URL: './data/e2e.db' }, url: 'http://127.0.0.1:3001/health', reuseExistingServer: !process.env.CI },
    { command: 'pnpm --dir packages/gateway dev', cwd: repositoryRoot, env: { ...process.env, GAME_SERVER_URL: 'http://127.0.0.1:3001' }, url: 'http://127.0.0.1:3002/health', reuseExistingServer: !process.env.CI },
    { command: 'pnpm --dir packages/web dev', cwd: repositoryRoot, env: { ...process.env, NODE_ENV: 'test' }, url: 'http://127.0.0.1:5180', reuseExistingServer: !process.env.CI },
  ],
});
