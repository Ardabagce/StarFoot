// Hikâye serisi videolarına sentezlenmiş ses tasarımı ekler (telif yok, hazır ses dosyası kullanılmaz).
// Kullanım: node sfx7.js <klasör>   → <ad>.mp4 dosyalarının üzerine sesli halini yazar, sessiz hali <ad>-sessiz.mp4 olarak kalır.
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const dir = path.resolve(process.argv[2] || path.join(__dirname, '../series'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sfxs-'));
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
  alarm: `aevalsrc='0.28*sin(2*PI*880*t)*lt(t,0.12)+0.28*sin(2*PI*660*t)*gt(t,0.16)*lt(t,0.28)':s=44100:d=0.32`,
  rewind: `aevalsrc='0.4*sin(2*PI*(1600*exp(-t*2.2)+120)*t)*(0.6+0.4*sin(2*PI*30*t))':s=44100:d=1.05`,
  cash: `aevalsrc='0.32*(sin(2*PI*1975*t)+0.7*sin(2*PI*2637*t))*exp(-t*7)*gt(t,0.09)+0.3*(sin(2*PI*1568*t))*exp(-t*12)':s=44100:d=0.9`,
};
for (const [k, f] of Object.entries(SFX)) execSync(`ffmpeg -loglevel error -y -f lavfi -i "${f}" -ac 2 "${tmp}/${k}.wav"`);
const R = (a, b, s) => Array.from({ length: Math.floor((b - a) / s + 1e-6) + 1 }, (_, i) => +(a + i * s).toFixed(2));
const CUES = {
  // 0 · 2.6 (AMA) · 4.7 (AMA scout) · 6.8 (BU YÜZDEN serbest vuruş) · 9.3 (scout raporu) · 11.8 (AMA sınav) · 14.0 (soru) · 17.0 (devamı)
  hikaye_b1: [['amb', 0], ...R(0.2, 2.4, 0.6).map((t) => ['beat', t]), ['whoosh', 2.55], ['boom', 2.65], ['whoosh', 4.65], ['boom', 4.75], ['whoosh', 6.75], ['riser', 7.6], ['kick', 8.6], ['crowd', 8.7],
    ['whoosh', 9.25], ['chime', 9.4], ['cash', 9.9], ['whoosh', 11.75], ['boom', 11.85], ['whoosh', 13.95], ...R(14.3, 16.7, 0.55).map((t) => ['beat', t]), ['tick', 16.5], ['whoosh', 16.95], ['boom', 17.05], ['chime', 17.5]],
  // 0 · 2.6 (BU YÜZDEN) · 4.9 (AMA sınav) · 7.2 (AMA penaltı) · 10.2 (atabilecek mi) · 12.6 (devamı)
  hikaye_b2: [['amb', 0], ...R(0.2, 2.4, 0.6).map((t) => ['beat', t]), ['whoosh', 2.55], ['chime', 2.7], ['whoosh', 4.85], ['boom', 4.95], ['whoosh', 7.15], ['boom', 7.25], ['crowd', 7.3], ['whoosh', 10.15], ['riser', 11.6], ...R(10.3, 12.3, 0.45).map((t) => ['beat', t]), ['boom', 12.6], ['chime', 13.1]],
  // 0 · 2.4 (gol!) · 5.0 (BU YÜZDEN) · 7.4 (AMA sınav sonucu) · 10.0 (devamı)
  hikaye_b3: [['amb', 0], ['riser', 1.4], ['kick', 2.25], ['boom', 2.4], ['roar', 2.4], ['whoosh', 4.95], ['chime', 5.1], ['whoosh', 7.35], ['boom', 7.45], ['tick', 8.6], ['tick', 9.1], ['whoosh', 9.95], ['boom', 10.05], ['chime', 10.5]],
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
