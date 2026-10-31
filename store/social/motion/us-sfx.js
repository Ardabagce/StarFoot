// ABD reklamlarına sentezlenmiş ses ekler (telif yok). Kullanım: node us-sfx.js <klasör>
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path');
const dir = process.argv[2] || path.join(__dirname, '../us');
const tmp = fs.mkdtempSync('/tmp/ussfx-');
const SFX = {
  beat: `aevalsrc='0.9*sin(2*PI*55*t)*exp(-t*18)+0.7*sin(2*PI*50*(t-0.18))*exp(-(t-0.18)*18)*gt(t,0.18)':s=44100:d=0.6`,
  boom: `aevalsrc='0.95*sin(2*PI*(42+90*exp(-t*14))*t)*exp(-t*3.2)+0.25*sin(2*PI*84*t)*exp(-t*9)':s=44100:d=1.4`,
  kick: `aevalsrc='0.8*sin(2*PI*(120+300*exp(-t*40))*t)*exp(-t*22)':s=44100:d=0.3`,
  whoosh: `anoisesrc=d=0.45:c=pink:a=0.5:r=44100,bandpass=f=1400:w=1800,afade=in:d=0.22,afade=out:st=0.22:d=0.23`,
  crowd: `anoisesrc=d=3.2:c=pink:a=0.45:r=44100,bandpass=f=900:w=1400,afade=in:d=0.25,afade=out:st=1.6:d=1.6`,
  hum: `anoisesrc=d=4:c=brown:a=0.18:r=44100,lowpass=f=600`,
  chime: `aevalsrc='0.22*(sin(2*PI*1047*t)*exp(-t*3)+sin(2*PI*1319*t)*exp(-(t-0.12)*3)*gt(t,0.12)+sin(2*PI*1568*t)*exp(-(t-0.24)*3)*gt(t,0.24)+sin(2*PI*2093*t)*exp(-(t-0.36)*2.5)*gt(t,0.36))':s=44100:d=1.8`,
  tick: `aevalsrc='0.35*sin(2*PI*1800*t)*exp(-t*60)':s=44100:d=0.08`,
  cash: `aevalsrc='0.32*(sin(2*PI*1975*t)+0.7*sin(2*PI*2637*t))*exp(-t*7)*gt(t,0.09)+0.3*(sin(2*PI*1568*t))*exp(-t*12)':s=44100:d=0.9`,
};
for (const [k, f] of Object.entries(SFX)) execSync(`ffmpeg -loglevel error -y -f lavfi -i "${f}" -ac 2 "${tmp}/${k}.wav"`);
const R = (a, b, s) => Array.from({ length: Math.floor((b - a) / s) + 1 }, (_, i) => a + i * s);
const CUES = {
  us_keeper: [['hum', 0], ...R(0.15, 3.6, 0.59).map((t) => ['beat', t]), ['tick', 3.6], ['kick', 4.3], ['whoosh', 4.4], ['boom', 4.8], ['crowd', 4.8], ['whoosh', 6.25], ...[0, 1, 2, 3].map((i) => ['tick', 6.35 + i * 0.85]), ['boom', 9.9], ['chime', 10.2]],
  us_career: [['hum', 0], ...[2.1, 3.8, 5.5, 7.2].map((t) => ['whoosh', t - 0.1]), ['tick', 3.1], ['tick', 6.55], ['cash', 5.7], ['crowd', 3.8], ['crowd', 7.2], ['boom', 8.9], ['chime', 9.1], ['boom', 10.9], ['chime', 11.2]],
  us_ovr: [['hum', 0], ...[2.4, 4.3, 6.2, 8.1, 9.9].map((t) => ['whoosh', t - 0.1]), ...[2.4, 6.2, 8.1, 9.9].map((t) => ['tick', t + 0.1]), ['kick', 4.5], ['boom', 5.05], ['crowd', 5.05], ['cash', 8.3], ['boom', 9.9], ['chime', 10.1], ['boom', 12.0], ['chime', 12.3]],
};
for (const [id, cues] of Object.entries(CUES)) {
  const src = path.join(dir, id + '.mp4'); if (!fs.existsSync(src)) continue;
  const silent = path.join(tmp, id + '-v.mp4'); fs.copyFileSync(src, silent);
  const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${silent}"`).toString());
  const ins = cues.map(([k]) => `-i "${tmp}/${k}.wav"`).join(' ');
  const mix = cues.map(([, t], i) => `[${i + 1}]adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[a${i}]`).join(';');
  execSync(`ffmpeg -loglevel error -y -i "${silent}" ${ins} -f lavfi -t ${dur} -i anullsrc=r=44100:cl=stereo -filter_complex "${mix};[${cues.length + 1}]${cues.map((_, i) => `[a${i}]`).join('')}amix=inputs=${cues.length + 1}:normalize=0:duration=first,alimiter=limit=0.9[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -t ${dur} -movflags +faststart "${src}"`);
  console.log('ses eklendi:', id);
}
