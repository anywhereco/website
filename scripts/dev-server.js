/* Static file server for local development.
 *
 * `python -m http.server` is the simpler option and is what the README
 * suggests, but Python 3.9 resolves os.getcwd() while parsing its own
 * arguments, so it refuses to start when the launcher's working directory
 * isn't readable. This has no such problem and needs no dependencies.
 *
 *   node scripts/dev-server.js [port]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'site');
const PORT = Number(process.argv[2]) || 8765;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8'
};

http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const file = path.join(ROOT, path.normalize(urlPath));
  // path.normalize collapses ".." — re-check so a crafted URL can't escape.
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 ' + urlPath);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      // No caching, so edits show up on reload without a hard refresh.
      'Cache-Control': 'no-store'
    });
    res.end(buf);
  });
}).listen(PORT, () => {
  console.log('Heredita dev server → http://localhost:' + PORT + '/');
});
