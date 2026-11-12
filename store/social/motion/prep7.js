// Reels 7 için görsel hazırlığı: Mixkit (Free License) çekimlerini dikey kırpar, renk düzeltir ve kare dizisine çevirir;
// oyunun gerçek penaltı kaydını ve ekran görüntülerini aynı klasöre toplar.
// Kullanım: node prep7.js <klip klasörü> <oyun kareleri klasörü> <çıktı (assets7)>
//  klipler: https://assets.mixkit.co/videos/<id>/<id>-1080.mp4 (yoksa -720.mp4), <id>_hd.mp4 ya da <id>.mp4 adıyla
//  oyun kareleri: MOMENT=penalty node store/social/clips.js tr <klasör> moment  → <klasör>/moment/f0000.jpg…
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const [, , CLIPS, GAME, OUT = path.join(__dirname, 'assets7')] = process.argv;
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);

// ad: [mixkit kimliği, başlangıç sn, süre sn, hız, yatay odak (0..1), renk]
const NIGHT = 'eq=contrast=1.12:saturation=1.18:brightness=-0.02,colorbalance=bs=0.06:bm=0.03:rh=0.04';
const WARM = 'eq=contrast=1.1:saturation=1.2:brightness=-0.02,colorbalance=rs=0.05:rm=0.04:bh=-0.04';
const SEQ = {
  pen1: ['43494', 0.9, 1.6, 0.7, 0.52, NIGHT], // gece, ışıklar altında topa yürüyen oyuncu
  pen2: ['43495', 0.3, 1.5, 0.7, 0.74, NIGHT], // file arkasından kaleci
  stad: ['30312', 2.0, 2.2, 1, 0.5, NIGHT], // ışıklı stadyum (3B canlandırma)
  kid1: ['6652', 0.2, 1.6, 0.75, 0.4, WARM], // sahada top oynayan çocuklar
  kid2: ['738', 2.2, 1.5, 0.7, 0.45, WARM], // sokakta top
  sun: ['736', 3.2, 1.5, 0.7, 0.5, WARM], // güneşe karşı şut
};
for (const [name, [id, ss, d, sp, fx, grade]] of Object.entries(SEQ)) {
  const src = [path.join(CLIPS, id + '_hd.mp4'), path.join(CLIPS, id + '.mp4')].find((f) => fs.existsSync(f) && fs.statSync(f).size > 10000);
  if (!src) { console.log('eksik klip:', id); continue; }
  const dir = path.join(OUT, 'fr', name);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  ff(['-ss', String(ss), '-t', String(d), '-i', src, '-vf',
    `crop=ih*9/16:ih:(iw-ih*9/16)*${fx}:0,scale=1080:1920:flags=lanczos,${grade},unsharp=5:5:0.8,vignette=PI/5,setpts=PTS/${sp},fps=30`,
    '-q:v', '3', path.join(dir, '%04d.jpg')]);
  console.log(name, fs.readdirSync(dir).length, 'kare');
}
// oyun kaydı
if (GAME && fs.existsSync(GAME)) {
  const dir = path.join(OUT, 'fr', 'game');
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  fs.readdirSync(GAME).filter((f) => /^f\d+\.jpg$/.test(f)).sort().forEach((f, i) => fs.copyFileSync(path.join(GAME, f), path.join(dir, String(i + 1).padStart(4, '0') + '.jpg')));
  console.log('game', fs.readdirSync(dir).length, 'kare');
}
// oyun ekranları (önceki setlerden)
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
[['assets6', ['ceremony', 'cabinet', 'offers', 'wiki', 'career_sum']], ['assets4', ['starfeed', 'mv_val', 'post_trophy']]].forEach(([a, list]) => list.forEach((n) => {
  const s = path.join(__dirname, a, 'shots', n + '.jpg'); if (fs.existsSync(s)) fs.copyFileSync(s, path.join(OUT, 'shots', n + '.jpg'));
}));
