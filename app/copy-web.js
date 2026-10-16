// Oyunun web dosyalarını Android uygulamasına (www/) kopyalar: node copy-web.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'www');
const items = ['index.html', 'privacy.html', 'manifest.webmanifest', 'css', 'js', 'icons', 'fonts'];
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const it of items) fs.cpSync(path.join(ROOT, it), path.join(OUT, it), { recursive: true });
console.log('www hazır:', items.join(', '));
