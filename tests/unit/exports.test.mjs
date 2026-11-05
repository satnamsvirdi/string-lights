import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import * as runtime from '../../src/core/index.js';
test('every core runtime export has a declaration and declarations expose no phantom values', async () => {
  const text = await readFile(
    new URL('../../packages/string-lights-core/index.d.ts', import.meta.url),
    'utf8',
  );
  const source = ts.createSourceFile('index.d.ts', text, ts.ScriptTarget.Latest, true);
  const names = [];
  for (const statement of source.statements) {
    if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
      continue;
    if (ts.isFunctionDeclaration(statement)) names.push(statement.name.text);
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        names.push(declaration.name.text);
  }
  assert.deepEqual(names.sort(), Object.keys(runtime).sort());
});
