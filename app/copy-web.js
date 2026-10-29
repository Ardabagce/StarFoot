// Oyunun web dosyalarını Android uygulamasına (www/) kopyalar: node copy-web.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'www');
// Oyun web'de gizli sayfada (GAME); uygulamada index.html olarak açılır
const GAME = 'oyna-r8k4tq.html';
const items = ['privacy.html', 'manifest.webmanifest', 'css', 'js', 'icons', 'fonts', 'img'];
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(path.join(ROOT, GAME), path.join(OUT, 'index.html'));
for (const it of items) fs.cpSync(path.join(ROOT, it), path.join(OUT, it), { recursive: true });
console.log('www hazır: index.html (' + GAME + '),', items.join(', '));
