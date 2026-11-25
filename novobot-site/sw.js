const CACHE='novobot-v36';
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg','./logo.svg','./icon-180.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./privacy.html','./fonts/inter-400.ttf','./fonts/inter-600.ttf','./fonts/pressstart2p.ttf'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(new Request(e.request.url,{cache:'no-cache',credentials:'same-origin'})).then(r=>{if(r&&(r.ok||r.type==='opaque')){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
