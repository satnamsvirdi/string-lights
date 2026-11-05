import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import Ajv from 'ajv';
import { parse } from 'yaml';
const require = createRequire(import.meta.url);
const { configSchema, manifestSchema } = require('release-please');
const root = new URL('../../', import.meta.url);
test('release configuration and manifest match the real release-please schema', async () => {
  const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
  for (const [path, schema] of [
    ['release-please-config.json', configSchema],
    ['.release-please-manifest.json', manifestSchema],
  ]) {
    const data = JSON.parse(await readFile(new URL(path, root), 'utf8'));
    const valid = ajv.validate(schema, data);
    assert.ok(valid, JSON.stringify(ajv.errors));
  }
});
test('CI is read-only and pins action code; release workflow uses the checked config', async () => {
  const ci = parse(await readFile(new URL('.github/workflows/ci.yml', root), 'utf8'));
  assert.deepEqual(ci.permissions, { contents: 'read' });
  assert.deepEqual(ci.jobs.verify.strategy.matrix.node, [22, 24]);
  for (const step of ci.jobs.verify.steps.filter((step) => step.uses))
    assert.match(step.uses, /@[a-f0-9]{40}$/);
  assert.ok(ci.jobs.verify.steps.some((step) => step.run === 'npm run check'));
  const release = parse(await readFile(new URL('.github/workflows/release.yml', root), 'utf8'));
  const action = release.jobs.version.steps[0];
  assert.match(action.uses, /@[a-f0-9]{40}$/);
  assert.equal(action.with['config-file'], 'release-please-config.json');
  assert.deepEqual(release.on.workflow_run.workflows, ['CI']);
  assert.match(release.jobs.version.if, /conclusion == 'success'/);
  assert.match(release.jobs.version.if, /head_repository.full_name == github.repository/);
});
