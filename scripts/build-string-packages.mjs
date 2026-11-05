import { build } from 'esbuild';
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFile(resolve(root, path), 'utf8');
async function write(path, content) {
  const destination = resolve(root, path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}
const common = {
  absWorkingDir: root,
  format: 'esm',
  target: 'es2022',
  sourcemap: true,
  legalComments: 'inline',
};
await build({
  ...common,
  entryPoints: ['src/core/index.js'],
  bundle: true,
  outfile: 'packages/string-lights-core/dist/index.js',
});
await build({
  ...common,
  entryPoints: ['src/react/StringLights.tsx'],
  bundle: false,
  outfile: 'packages/string-lights-react/dist/index.js',
});
execFileSync(
  process.execPath,
  [resolve(root, 'node_modules/typescript/lib/tsc.js'), '-p', 'tsconfig.build.json'],
  { cwd: root, stdio: 'inherit' },
);
await write(
  'packages/string-lights-react/dist/index.d.ts',
  await read('.recovery/declarations/StringLights.d.ts'),
);
await write(
  'packages/string-lights-core/dist/index.d.ts',
  await read('packages/string-lights-core/index.d.ts'),
);
for (const name of ['string-lights-core', 'string-lights-react']) {
  await copyFile(resolve(root, 'LICENSE'), resolve(root, 'packages', name, 'LICENSE'));
}

// Rewrite imports through the AST instead of substituting component implementation text.
const source = ts.createSourceFile(
  'StringLights.tsx',
  await read('src/react/StringLights.tsx'),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const transformed = ts.transform(source, [
  (context) => (node) => {
    const visit = (current) => {
      if (ts.isImportDeclaration(current) && current.moduleSpecifier.text === 'string-lights') {
        return context.factory.updateImportDeclaration(
          current,
          current.modifiers,
          current.importClause,
          context.factory.createStringLiteral('@/lib/string-lights'),
          current.attributes,
        );
      }
      return ts.visitEachChild(current, visit, context);
    };
    return ts.visitNode(node, visit);
  },
]);
const component = ts
  .createPrinter({ newLine: ts.NewLineKind.LineFeed })
  .printFile(transformed.transformed[0]);
transformed.dispose();
const registryEngine = await build({
  ...common,
  entryPoints: ['src/core/index.js'],
  bundle: true,
  sourcemap: false,
  write: false,
});
const files = [
  { path: 'registry/string-lights/string-lights.tsx', type: 'registry:ui', content: component },
  {
    path: 'registry/string-lights/string-lights.js',
    type: 'registry:lib',
    content: registryEngine.outputFiles[0].text,
  },
  {
    path: 'registry/string-lights/string-lights.d.ts',
    type: 'registry:lib',
    content: await read('packages/string-lights-core/index.d.ts'),
  },
];
for (const file of files) await write(file.path, file.content);
const item = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'string-lights',
  type: 'registry:ui',
  title: 'String Lights',
  description: 'Interactive festival, Christmas, and Diwali string lights.',
  files,
};
await write('registry/public/r/string-lights.json', JSON.stringify(item, null, 2) + '\n');
await write(
  'registry/registry.json',
  JSON.stringify(
    {
      $schema: 'https://ui.shadcn.com/schema/registry.json',
      name: 'string-lights',
      homepage: 'http://localhost:8770',
      items: [{ ...item, files: files.map(({ content: _content, ...file }) => file) }],
    },
    null,
    2,
  ) + '\n',
);
console.log('Built typed ESM packages, source maps, license files, and shadcn source.');
