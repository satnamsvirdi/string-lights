const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = {
  '/': ['string-lights.html', 'text/html'],
  '/string-lights.html': ['string-lights.html', 'text/html'],
  '/string-demo.js': ['string-demo.js', 'text/javascript'],
  '/StringLights.js': ['packages/string-lights-core/dist/index.js', 'text/javascript'],
  '/index.js.map': ['packages/string-lights-core/dist/index.js.map', 'application/json'],
  '/StringLights.md': ['docs/api.md', 'text/plain'],
  '/r/string-lights.json': ['registry/public/r/string-lights.json', 'application/json'],
};
for (const doc of [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'docs/api.md',
  'docs/architecture.md',
  'docs/performance.md',
  'docs/installation.md',
]) {
  files['/' + doc] = [doc, 'text/plain'];
}
http
  .createServer(async (req, res) => {
    const file = files[new URL(req.url, 'http://localhost').pathname];
    if (!file) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    try {
      const content = await fs.promises.readFile(path.join(__dirname, file[0]));
      res.writeHead(200, {
        'Content-Type': file[1] + '; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Preview asset missing. Run npm run build.');
    }
  })
  .listen(8770, '127.0.0.1', () => console.log('String preview: http://127.0.0.1:8770'));
