import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { planVersion } from '../../scripts/version-plan.mjs';
const require = createRequire(import.meta.url);
const { GenericJson } = require('release-please/build/src/updaters/generic-json.js');
const { Version } = require('release-please/build/src/version.js');

test('Conventional Commits produce semantic patch/minor/major versions, including pre-1.0', () => {
  for (const [messages, expected] of [
    [['fix: repair capture'], '0.1.1'],
    [['perf: skip idle work'], '0.1.1'],
    [['feat: add a bulb'], '0.2.0'],
    [['feat!: change options'], '1.0.0'],
    [['fix: change options\n\nBREAKING CHANGE: renamed API'], '1.0.0'],
    [['fix: repair', 'feat: add bulb'], '0.2.0'],
    [['docs: update examples', 'chore: tools'], '0.1.0'],
  ])
    assert.equal(planVersion('0.1.0', messages).next, expected);
  assert.equal(planVersion('1.2.3', ['feat!: change API']).next, '2.0.0');
  assert.equal(planVersion('1.2.3', []).release, false);
  assert.equal(
    planVersion('0.1.0', ['feat: first release'], { initialRelease: true }).next,
    '0.1.0',
  );
});

test('release-please extra-file updaters synchronize both packages, dependency ranges, and lock entries', async () => {
  const root = new URL('../../', import.meta.url);
  const config = JSON.parse(await readFile(new URL('release-please-config.json', root), 'utf8'));
  const files = new Map();
  for (const file of config.packages['.']['extra-files']) {
    const before = files.get(file.path) ?? (await readFile(new URL(file.path, root), 'utf8'));
    files.set(
      file.path,
      new GenericJson(file.jsonpath, Version.parse('1.2.3')).updateContent(before),
    );
  }
  const core = JSON.parse(files.get('packages/string-lights-core/package.json'));
  const react = JSON.parse(files.get('packages/string-lights-react/package.json'));
  const lock = JSON.parse(files.get('package-lock.json'));
  assert.equal(core.version, '1.2.3');
  assert.equal(react.version, '1.2.3');
  assert.equal(react.dependencies['string-lights'], '^1.2.3');
  assert.equal(lock.packages['packages/string-lights-core'].version, '1.2.3');
  assert.equal(lock.packages['packages/string-lights-react'].version, '1.2.3');
  assert.equal(
    lock.packages['packages/string-lights-react'].dependencies['string-lights'],
    '^1.2.3',
  );
});
