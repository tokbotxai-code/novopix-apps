// Prywatny serwer statyczny aplikacji "Mów po angielsku". Odpowiada tylko pod /k/<KAMILKA_SECRET>/ (sekret jest
// w zmiennej środowiskowej na VPS, nie w repo). Każdy inny adres: 404, bez śladu, że aplikacja istnieje.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';

const ROOT = path.resolve(process.env.KAMILKA_ROOT || '/site');
const SECRET = String(process.env.KAMILKA_SECRET || '');
if (SECRET.length < 16) { console.error('KAMILKA_SECRET must have at least 16 characters.'); process.exit(1); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.css': 'text/css; charset=utf-8' };
const PREFIX = '/k/';
const same = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const send = (res, status, body = '', headers = {}) => { res.writeHead(status, { 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(body); };

http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405);
    const url = new URL(req.url, 'http://x'); const pathname = decodeURIComponent(url.pathname);
    if (!pathname.startsWith(PREFIX)) return send(res, 404);
    const rest = pathname.slice(PREFIX.length); const slash = rest.indexOf('/'); const token = slash < 0 ? rest : rest.slice(0, slash);
    if (!same(token, SECRET)) return send(res, 404);
    if (slash < 0) return send(res, 308, '', { Location: `${PREFIX}${token}/` });
    let rel = rest.slice(slash + 1) || 'index.html';
    const file = path.resolve(ROOT, rel);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 404);
    if (rel.startsWith('.') || rel.includes('/.')) return send(res, 404);
    const data = await fs.readFile(file);
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const cache = /sw\.js$|index\.html$|\.webmanifest$/.test(file) ? 'no-cache' : 'public, max-age=3600';
    send(res, 200, req.method === 'HEAD' ? '' : data, { 'Content-Type': type, 'Cache-Control': cache, 'Content-Length': data.length });
  } catch { send(res, 404); }
}).listen(8080, '0.0.0.0', () => console.log('kamilka static server ready'));
