import { readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const tests = (await readdir(new URL('../tests/unit/', import.meta.url)))
  .filter((name) => name.endsWith('.test.mjs'))
  .map((name) => `tests/unit/${name}`);
execFileSync(process.execPath, ['--test', 'StringLights.test.mjs', ...tests], { stdio: 'inherit' });
