import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const react = await build({
  entryPoints: [fileURLToPath(new URL('tests/fixtures/react.tsx', root))],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'browser',
});
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/react.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(react.outputFiles[0].text);
      return;
    }
    if (path === '/core.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(await readFile(new URL('packages/string-lights-core/dist/index.js', root)));
      return;
    }
    response.setHeader('Content-Type', 'text/html');
    response.end(
      '<!doctype html><meta name="viewport" content="width=device-width"><style>body{margin:0;background:#111;color:#eee}#host{width:600px;height:400px}button{position:relative;z-index:11}</style><div id="host"><button id="content">Click</button></div><div id="root"></div>',
    );
  } catch {
    response.statusCode = 500;
    response.end('Fixture error');
  }
});
server.listen(8772, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
