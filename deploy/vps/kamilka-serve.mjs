// Prywatny serwer statyczny aplikacji "Mów po angielsku" pod /angielski/ z hasłem (KAMILKA_PASSWORD z .env na VPS, nie z repo).
// Bez poprawnego hasła widać tylko ekran logowania. Po zalogowaniu ciasteczko HttpOnly ważne 30 dni.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const ROOT = path.resolve(process.env.KAMILKA_ROOT || '/site');
const PASSWORD = String(process.env.KAMILKA_PASSWORD || '');
const KEY = String(process.env.KAMILKA_COOKIE_KEY || '');
if (PASSWORD.length < 6 || KEY.length < 16) { console.error('KAMILKA_PASSWORD (min. 6 znaków) and KAMILKA_COOKIE_KEY (min. 16 znaków) are required.'); process.exit(1); }
const PREFIX = '/angielski/';
const COOKIE = 'kam_session'; const DAYS = 30;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.css': 'text/css; charset=utf-8' };
const PUBLIC_FILES = new Set(['manifest.webmanifest', 'icon-192.png', 'icon-512.png']); // przeglądarka pobiera je bez ciasteczka
const sha = value => createHash('sha256').update(String(value)).digest();
const sameSecret = (a, b) => timingSafeEqual(sha(a), sha(b));
const sign = expires => `${expires}.${createHmac('sha256', KEY).update(String(expires)).digest('hex')}`;
const validCookie = value => { const [expires, mac] = String(value || '').split('.'); if (!/^\d+$/.test(expires || '') || Number(expires) < Date.now()) return false; return sameSecret(sign(Number(expires)).split('.')[1], mac || ''); };
const getCookie = req => { for (const part of String(req.headers.cookie || '').split(';')) { const [k, ...v] = part.trim().split('='); if (k === COOKIE) return v.join('='); } return ''; };
const failures = new Map();
const clientId = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',').pop().trim();
const tooMany = id => { const now = Date.now(); const list = (failures.get(id) || []).filter(t => now - t < 15 * 60_000); failures.set(id, list); return list.length >= 8; };
const noteFailure = id => { const list = failures.get(id) || []; list.push(Date.now()); failures.set(id, list); if (failures.size > 5000) failures.clear(); };

const send = (res, status, body = '', headers = {}) => { res.writeHead(status, { 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(body); };
const loginPage = (message = '') => `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Mów po angielsku</title>
<style>:root{--bg:#f7f6f2;--card:#fff;--ink:#1d1d1f;--acc:#1f6feb;--line:#e3e1da}@media(prefers-color-scheme:dark){:root{--bg:#16171a;--card:#202227;--ink:#eee;--acc:#58a6ff;--line:#33363d}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif;display:grid;min-height:100vh;place-items:center;padding:16px}
form{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;width:100%;max-width:340px}h1{font-size:1.3rem;margin:0 0 12px}
input,button{font:inherit;width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--line);margin-top:8px;box-sizing:border-box;background:var(--card);color:var(--ink)}
button{background:var(--acc);color:#fff;border:0;cursor:pointer}input:focus-visible,button:focus-visible{outline:3px solid var(--acc);outline-offset:2px}.err{color:#c0392b;margin:8px 0 0}</style></head>
<body><form method="post" action="${PREFIX}login"><h1>Mów po angielsku</h1><label for="p">Hasło</label><input id="p" name="password" type="password" autocomplete="current-password" autofocus required>${message ? `<p class="err" role="alert">${message}</p>` : ''}<button type="submit">Wejdź</button></form></body></html>`;

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x'); const pathname = decodeURIComponent(url.pathname);
    if (pathname === PREFIX.slice(0, -1)) return send(res, 308, '', { Location: PREFIX });
    if (!pathname.startsWith(PREFIX)) return send(res, 404);
    const rel = pathname.slice(PREFIX.length);
    if (rel === 'login' && req.method === 'POST') {
      const id = clientId(req); if (tooMany(id)) return send(res, 429, loginPage('Za dużo prób. Spróbuj za 15 minut.'), { 'Content-Type': 'text/html; charset=utf-8' });
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 2048) return send(res, 413); }
      const given = new URLSearchParams(body).get('password') || '';
      if (!sameSecret(given, PASSWORD)) { noteFailure(id); return send(res, 401, loginPage('Nieprawidłowe hasło.'), { 'Content-Type': 'text/html; charset=utf-8' }); }
      const expires = Date.now() + DAYS * 86_400_000;
      return send(res, 303, '', { Location: PREFIX, 'Set-Cookie': `${COOKIE}=${sign(expires)}; Path=${PREFIX}; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Lax` });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405);
    const name = rel || 'index.html';
    const authed = validCookie(getCookie(req));
    if (!authed && !PUBLIC_FILES.has(name)) return send(res, 401, loginPage(), { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    const file = path.resolve(ROOT, name);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 404);
    if (name.startsWith('.') || name.includes('/.')) return send(res, 404);
    const data = await fs.readFile(file);
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const cache = /sw\.js$|index\.html$|\.webmanifest$/.test(file) ? 'no-cache' : 'public, max-age=3600';
    send(res, 200, req.method === 'HEAD' ? '' : data, { 'Content-Type': type, 'Cache-Control': authed ? cache : 'no-store', 'Content-Length': data.length });
  } catch { send(res, 404); }
}).listen(8080, '0.0.0.0', () => console.log('kamilka static server ready'));
