import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const npm = process.env.npm_execpath;
assert.ok(npm, 'Run this check through npm run test:packages.');
const fixture = resolve(root, '.recovery/package-consumer');
const archives = resolve(root, '.recovery/tarballs');
await mkdir(fixture, { recursive: true });
await mkdir(archives, { recursive: true });
const runNpm = (args, cwd = root) =>
  execFileSync(process.execPath, [npm, ...args, '--cache', resolve(root, '.recovery/npm-cache')], {
    cwd,
    encoding: 'utf8',
  });
const tarballs = [];
const rendererRequire = createRequire(resolve(root, 'node_modules/react-dom/package.json'));
const scheduler = dirname(rendererRequire.resolve('scheduler/package.json'));
for (const directory of [
  'packages/string-lights-core',
  'packages/string-lights-react',
  'node_modules/react',
  'node_modules/react-dom',
  scheduler,
]) {
  const [packed] = JSON.parse(
    runNpm([
      'pack',
      resolve(root, directory),
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      archives,
    ]),
  );
  tarballs.push(resolve(archives, packed.filename));
  if (directory.startsWith('packages/')) {
    const files = packed.files.map((file) => file.path);
    for (const required of [
      'dist/index.js',
      'dist/index.js.map',
      'dist/index.d.ts',
      'LICENSE',
      'README.md',
      'package.json',
    ])
      assert.ok(files.includes(required), `${directory} missing ${required}`);
    assert.ok(!files.some((path) => path.startsWith('node_modules/') || path.startsWith('src/')));
    const manifest = JSON.parse(await readFile(resolve(root, directory, 'package.json'), 'utf8'));
    assert.equal(manifest.sideEffects, false);
    assert.equal(manifest.license, 'MIT');
  }
}
await writeFile(
  resolve(fixture, 'package.json'),
  JSON.stringify({ name: 'string-lights-verification', private: true, type: 'module' }),
);
runNpm(
  ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs],
  fixture,
);
const require = createRequire(resolve(fixture, 'package.json'));
const core = await import(pathToFileURL(require.resolve('string-lights')));
const { StringLights } = await import(pathToFileURL(require.resolve('string-lights-react')));
const React = require('react');
const { renderToString } = require('react-dom/server');
const markup = renderToString(
  React.createElement(
    StringLights,
    { options: core.stringLightsPresets.festive.options },
    'Celebrate',
  ),
);
assert.ok(markup.includes('Celebrate'));
assert.ok(!markup.includes('<svg'));
await writeFile(
  resolve(fixture, 'runtime-smoke.mjs'),
  `import assert from 'node:assert/strict';
import {createGeometry}from'string-lights';import{StringLights}from'string-lights-react';
import{createElement}from'react';import{renderToString}from'react-dom/server';
assert.ok(createGeometry(600,300).bulbs.length);
const markup=renderToString(createElement(StringLights,null,'Celebrate'));
assert.ok(markup.includes('Celebrate'));assert.ok(!markup.includes('<svg'));
console.log('Installed-package runtime and SSR passed on',process.version);`,
);
assert.ok(core.createGeometry(600, 300).bulbs.length);
const rawWrapper = await readFile(require.resolve('string-lights-react'), 'utf8');
assert.ok(rawWrapper.startsWith('"use client"'));
assert.ok(!rawWrapper.includes('createElementNS'));
const budget = JSON.parse(await readFile(resolve(root, 'performance-budgets.json'), 'utf8'));
const cases = {
  renderer: "export {createStringLights} from 'string-lights';",
  geometry: "export {createGeometry} from 'string-lights';",
  preview: "export {createBulbPreview} from 'string-lights';",
  reactWrapper: "export {StringLights} from 'string-lights-react';",
  unused: "import{createStringLights}from'string-lights';console.log('empty');",
};
const sizes = {};
for (const [name, contents] of Object.entries(cases)) {
  const result = await build({
    stdin: { contents, resolveDir: fixture },
    bundle: true,
    write: false,
    format: 'esm',
    minify: true,
    external: name === 'reactWrapper' ? ['react', 'string-lights'] : [],
    logLevel: 'silent',
  });
  const code = result.outputFiles[0].text;
  const gzip = gzipSync(code).length;
  sizes[name] = { minified: Buffer.byteLength(code), gzip };
  assert.ok(!code.includes('Diwali rainbow'), 'unused presets survived tree shaking');
  if (name === 'geometry' || name === 'unused') assert.ok(!code.includes('createElementNS'));
  if (name === 'preview') assert.ok(!code.includes('ResizeObserver'));
  if (name === 'unused') assert.ok(code.length <= budget.unusedImportBytes);
  else assert.ok(gzip <= budget[`${name}Gzip`], `${name} exceeds gzip budget (${gzip})`);
}
const item = JSON.parse(
  await readFile(resolve(root, 'registry/public/r/string-lights.json'), 'utf8'),
);
assert.equal(item.files.length, 3);
for (const file of item.files) {
  assert.equal(await readFile(resolve(root, file.path), 'utf8'), file.content, 'registry drift');
  const target = resolve(
    fixture,
    file.type === 'registry:ui' ? 'components/ui' : 'lib',
    file.path.split('/').at(-1),
  );
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, file.content);
}
await writeFile(
  resolve(fixture, 'check.tsx'),
  `import {StringLights} from 'string-lights-react';import{stringLightsPresets,type StringOptions}from'string-lights';import{StringLights as LocalLights}from'./components/ui/string-lights.js';
const options:StringOptions={shape:['rice','flower']};
const npmView=<StringLights options={stringLightsPresets.white.options}>Npm</StringLights>;
const localView=<LocalLights options={options}>Local</LocalLights>;
// @ts-expect-error invalid modes must be rejected
const bad:StringOptions={mode:'unknown'};void npmView;void localView;void bad;`,
);
await writeFile(
  resolve(fixture, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      strict: true,
      noEmit: true,
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      paths: {
        '@/*': ['./*'],
        react: [resolve(root, 'node_modules/@types/react/index.d.ts')],
        'react/jsx-runtime': [resolve(root, 'node_modules/@types/react/jsx-runtime.d.ts')],
      },
    },
    include: ['check.tsx', 'components/**/*.tsx'],
  }),
);
execFileSync(
  process.execPath,
  [resolve(root, 'node_modules/typescript/lib/tsc.js'), '-p', resolve(fixture, 'tsconfig.json')],
  { stdio: 'inherit' },
);
await writeFile(
  resolve(root, 'artifacts/string-bundle-sizes.json'),
  JSON.stringify(sizes, null, 2) + '\n',
);
console.log(
  'Packed installs, SSR, consumer types, registry parity, and bundle budgets passed.',
  sizes,
);
