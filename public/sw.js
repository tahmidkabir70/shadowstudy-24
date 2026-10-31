const CACHE = 'shadow-study-v3';
const CORE = ['/', '/index.html', '/manifest.json', '/icons/icon.svg'];

async function precache() {
  const cache = await caches.open(CACHE);
  await Promise.all(CORE.map((u) => cache.add(u).catch(() => {})));
  
  // index.html পড়ে অ্যাপের আসল JS/CSS ফাইলগুলো খুঁজে ক্যাশে রাখা
  try {
    const res = await fetch('/index.html', { cache: 'no-store' });
    const html = await res.text();
    const found = new Set();
    const re = /(?:src|href)=["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(html))) {
      const u = new URL(m[1], self.location.origin + '/');
      if (u.origin === self.location.origin && u.pathname.startsWith('/assets/')) {
        found.add(u.pathname);
      }
    }
    await Promise.all([...found].map((u) => cache.add(u).catch(() => {})));
  } catch (e) {}
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
    .keys()
    .then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  
  // পেজ খোলার সময়: আগে নেট, না থাকলে ক্যাশ
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('/index.html', copy));
        return res;
      })
      .catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  // বাকি ফাইল: আগে ক্যাশ, না থাকলে নেট থেকে এনে ক্যাশে রাখা
  event.respondWith(
    caches.match(req).then(
      (cached) =>
      cached ||
      fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
    )
  );
});