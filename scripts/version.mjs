import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { planVersion } from './version-plan.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const git = (args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
let baseline;
try {
  baseline = git(['describe', '--tags', '--match', 'v[0-9]*', '--abbrev=0']);
} catch {
  baseline = null;
}
const messages = git(['log', ...(baseline ? [`${baseline}..HEAD`] : []), '--format=%B%x00'])
  .split('\0')
  .map((message) => message.trim())
  .filter(Boolean);
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
console.log(
  JSON.stringify(
    { baseline, ...planVersion(manifest.version, messages, { initialRelease: baseline === null }) },
    null,
    2,
  ),
);
