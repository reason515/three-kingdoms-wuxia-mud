import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const scope = process.argv.slice(2).find((argument) => argument !== '--');
const suite = `e2e/${scope ?? 'smoke'}.spec.ts`;
if (suite && !existsSync(suite)) {
  console.error(`No E2E suite exists for scope "${scope}". Add ${suite} before enabling that domain.`);
  process.exit(1);
}

const result = spawnSync('pnpm', ['exec', 'playwright', 'test', ...(suite ? [suite] : [])], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(result.status ?? 1);
