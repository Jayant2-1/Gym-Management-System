const http = require('http');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = (() => {
  try {
    return require('http-proxy-middleware');
  } catch {
    return {};
  }
})();

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const dist = path.join(__dirname, 'dist');
const BACKEND = process.env.BACKEND_URL || 'http://localhost:5001';

const server = http.createServer((req, res) => {
  // Proxy API requests to backend
  if (req.url.startsWith('/api')) {
    const proxyReq = http.request(BACKEND + req.url, { method: req.method, headers: req.headers }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend unavailable' }));
    });
    req.pipe(proxyReq);
    return;
  }

  // Serve static files
  let filePath = path.join(dist, req.url === '/' ? 'index.html' : req.url);

  // If file doesn't exist, serve index.html (SPA fallback)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(dist, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mime[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log('Frontend serving at http://localhost:' + PORT);
  console.log('API proxy -> ' + BACKEND);
});
