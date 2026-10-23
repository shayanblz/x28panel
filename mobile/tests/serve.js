#!/usr/bin/env node
/**
 * Zero-dependency static server for the web build.
 *   node tests/serve.js [port] [host]
 * Useful for previewing the UI in a desktop/mobile browser before building
 * the APK. Defaults to 0.0.0.0:8080 so it is reachable from a phone on the LAN.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const WEB = path.join(__dirname, '..', 'web');
const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const HOST = process.argv[3] || process.env.HOST || '0.0.0.0';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
  const file = path.resolve(WEB, rel);
  if (!file.startsWith(WEB)) { res.statusCode = 403; res.end('forbidden'); return; }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('not found: ' + rel);
      return;
    }
    res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, HOST, () => {
  console.log(`X28 Mobile preview → http://${HOST}:${PORT}/`);
  console.log('Open it on your phone with your computer LAN IP.');
});
