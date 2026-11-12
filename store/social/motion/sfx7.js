// Reels 7 videolarına sentezlenmiş ses tasarımı ekler (telif yok, hazır ses dosyası kullanılmaz).
// Kullanım: node sfx7.js <klasör>   → <ad>.mp4 dosyalarının üzerine sesli halini yazar, sessiz hali <ad>-sessiz.mp4 olarak kalır.
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const dir = path.resolve(process.argv[2] || path.join(__dirname, '../reels7'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sfx7-'));
const SFX = {
  beat: `aevalsrc='0.9*sin(2*PI*55*t)*exp(-t*18)+0.7*sin(2*PI*50*(t-0.18))*exp(-(t-0.18)*18)*gt(t,0.18)':s=44100:d=0.6`,
  boom: `aevalsrc='0.95*sin(2*PI*(42+90*exp(-t*14))*t)*exp(-t*3.2)+0.25*sin(2*PI*84*t)*exp(-t*9)':s=44100:d=1.4`,
  kick: `aevalsrc='0.8*sin(2*PI*(120+300*exp(-t*40))*t)*exp(-t*22)':s=44100:d=0.3`,
  whoosh: `anoisesrc=d=0.45:c=pink:a=0.5:r=44100,bandpass=f=1400:w=1800,afade=in:d=0.22,afade=out:st=0.22:d=0.23`,
  riser: `anoisesrc=d=0.9:c=white:a=0.5:r=44100,highpass=f=900,afade=in:d=0.85:curve=exp,afade=out:st=0.86:d=0.04`,
  crowd: `anoisesrc=d=3.2:c=pink:a=0.45:r=44100,bandpass=f=900:w=1400,afade=in:d=0.25,afade=out:st=1.6:d=1.6`,
  roar: `anoisesrc=d=4.6:c=pink:a=0.7:r=44100,bandpass=f=1000:w=1600,tremolo=f=5:d=0.25,afade=in:d=0.15,afade=out:st=2.2:d=2.4`,
  hum: `anoisesrc=d=4:c=brown:a=0.18:r=44100,lowpass=f=600`,
  amb: `anoisesrc=d=4:c=pink:a=0.12:r=44100,bandpass=f=700:w=900,afade=in:d=0.4,afade=out:st=3:d=1`,
  chime: `aevalsrc='0.22*(sin(2*PI*1047*t)*exp(-t*3)+sin(2*PI*1319*t)*exp(-(t-0.12)*3)*gt(t,0.12)+sin(2*PI*1568*t)*exp(-(t-0.24)*3)*gt(t,0.24)+sin(2*PI*2093*t)*exp(-(t-0.36)*2.5)*gt(t,0.36))':s=44100:d=1.8`,
  tick: `aevalsrc='0.35*sin(2*PI*1800*t)*exp(-t*60)':s=44100:d=0.08`,
  cash: `aevalsrc='0.32*(sin(2*PI*1975*t)+0.7*sin(2*PI*2637*t))*exp(-t*7)*gt(t,0.09)+0.3*(sin(2*PI*1568*t))*exp(-t*12)':s=44100:d=0.9`,
};
for (const [k, f] of Object.entries(SFX)) execSync(`ffmpeg -loglevel error -y -f lavfi -i "${f}" -ac 2 "${tmp}/${k}.wav"`);
const R = (a, b, s) => Array.from({ length: Math.floor((b - a) / s + 1e-6) + 1 }, (_, i) => +(a + i * s).toFixed(2));
const CUES = {
  // sahneler: 0 · 1.9 · 3.7 (sensin) · 5.4 (telefon) · 7.65 (gol) · 9.9 (sevinç) · 11.9 (kapanış)
  r7_penalti: [['hum', 0], ['amb', 0], ...R(0.2, 3.2, 0.6).map((t) => ['beat', t]), ['whoosh', 1.85], ['riser', 2.8], ['boom', 3.7], ['whoosh', 5.35], ['tick', 5.9], ['kick', 6.4], ['boom', 7.65], ['roar', 7.65], ['whoosh', 9.85], ['crowd', 9.9], ['whoosh', 11.85], ['boom', 12.0], ['chime', 12.3]],
  // sahneler: 0 · 1.9 (sensin) · 3.6 (oyun) · 6.0 · 8.1 · 10.2 · 12.3 (kapanış)
  r7_cocuk: [['hum', 0], ['amb', 0], ...R(0.2, 1.4, 0.6).map((t) => ['beat', t]), ['riser', 1.0], ['boom', 1.9], ['whoosh', 3.55], ['kick', 4.6], ['crowd', 5.8], ['whoosh', 5.95], ['cash', 6.25], ['whoosh', 8.05], ['boom', 8.1], ['chime', 8.3], ['whoosh', 10.15], ['tick', 10.4], ['whoosh', 12.25], ['boom', 12.4], ['chime', 12.7]],
  // sahneler: 0 · 1.9 (senin) · 3.6 (gol sevinci) · 5.8 · 7.9 · 10.0 · 12.1 (kapanış)
  r7_stadyum: [['hum', 0], ['amb', 0], ...R(0.2, 1.4, 0.6).map((t) => ['beat', t]), ['riser', 1.0], ['boom', 1.9], ['whoosh', 3.55], ['boom', 3.6], ['roar', 3.6], ['whoosh', 5.75], ['tick', 6.0], ['whoosh', 7.85], ['cash', 8.1], ['whoosh', 9.95], ['chime', 10.2], ['whoosh', 12.05], ['boom', 12.2], ['chime', 12.5]],
};
for (const [id, cues] of Object.entries(CUES)) {
  const out = path.join(dir, id + '.mp4'), silent = path.join(dir, id + '-sessiz.mp4');
  if (!fs.existsSync(silent)) { if (!fs.existsSync(out)) continue; fs.renameSync(out, silent); }
  const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${silent}"`).toString());
  const ins = cues.map(([k]) => `-i "${tmp}/${k}.wav"`).join(' ');
  const mix = cues.map(([, t], i) => `[${i + 1}]adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[a${i}]`).join(';');
  execSync(`ffmpeg -loglevel error -y -i "${silent}" ${ins} -f lavfi -t ${dur} -i anullsrc=r=44100:cl=stereo -filter_complex "${mix};[${cues.length + 1}]${cues.map((_, i) => `[a${i}]`).join('')}amix=inputs=${cues.length + 1}:normalize=0:duration=first,alimiter=limit=0.9[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -movflags +faststart "${out}"`);
  console.log('ses eklendi:', id, dur.toFixed(1) + ' sn');
}
