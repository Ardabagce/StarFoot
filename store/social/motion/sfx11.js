// Reels 11 videolarına sentezlenmiş ses (telif yok). Kullanım: node sfx11.js ../reels11
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const dir = path.resolve(process.argv[2] || path.join(__dirname, '../reels11'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sfx11-'));
const SFX = {
  beat: `aevalsrc='0.8*sin(2*PI*55*t)*exp(-t*18)':s=44100:d=0.4`,
  boom: `aevalsrc='0.95*sin(2*PI*(42+90*exp(-t*14))*t)*exp(-t*3.2)+0.25*sin(2*PI*84*t)*exp(-t*9)':s=44100:d=1.4`,
  kick: `aevalsrc='0.8*sin(2*PI*(120+300*exp(-t*40))*t)*exp(-t*22)':s=44100:d=0.3`,
  whoosh: `anoisesrc=d=0.45:c=pink:a=0.5:r=44100,bandpass=f=1400:w=1800,afade=in:d=0.22,afade=out:st=0.22:d=0.23`,
  riser: `anoisesrc=d=0.9:c=white:a=0.45:r=44100,highpass=f=900,afade=in:d=0.85:curve=exp,afade=out:st=0.86:d=0.04`,
  crowd: `anoisesrc=d=3.2:c=pink:a=0.45:r=44100,bandpass=f=900:w=1400,afade=in:d=0.25,afade=out:st=1.6:d=1.6`,
  roar: `anoisesrc=d=3:c=pink:a=0.7:r=44100,bandpass=f=1000:w=1600,tremolo=f=5:d=0.25,afade=in:d=0.15,afade=out:st=1.4:d=1.6`,
  amb: `anoisesrc=d=3:c=pink:a=0.1:r=44100,bandpass=f=700:w=900,afade=in:d=0.4,afade=out:st=2:d=1`,
  chime: `aevalsrc='0.22*(sin(2*PI*1047*t)*exp(-t*3)+sin(2*PI*1319*t)*exp(-(t-0.12)*3)*gt(t,0.12)+sin(2*PI*1568*t)*exp(-(t-0.24)*3)*gt(t,0.24)+sin(2*PI*2093*t)*exp(-(t-0.36)*2.5)*gt(t,0.36))':s=44100:d=1.8`,
  soft: `aevalsrc='0.18*(sin(2*PI*523*t)*exp(-t*2)+sin(2*PI*659*t)*exp(-(t-0.2)*2)*gt(t,0.2)+sin(2*PI*784*t)*exp(-(t-0.4)*2)*gt(t,0.4))':s=44100:d=2`,
  tick: `aevalsrc='0.35*sin(2*PI*1800*t)*exp(-t*60)':s=44100:d=0.08`,
  alarm: `aevalsrc='0.3*sin(2*PI*880*t)*lt(t,0.12)+0.3*sin(2*PI*660*t)*gt(t,0.16)*lt(t,0.28)':s=44100:d=0.32`,
  rewind: `aevalsrc='0.35*sin(2*PI*(1600*exp(-t*2.2)+120)*t)*(0.6+0.4*sin(2*PI*30*t))':s=44100:d=1.05`,
  cash: `aevalsrc='0.32*(sin(2*PI*1975*t)+0.7*sin(2*PI*2637*t))*exp(-t*7)*gt(t,0.09)+0.3*(sin(2*PI*1568*t))*exp(-t*12)':s=44100:d=0.9`,
  pop: `aevalsrc='0.4*sin(2*PI*(600+900*exp(-t*30))*t)*exp(-t*25)':s=44100:d=0.2`,
};
for (const [k, f] of Object.entries(SFX)) execSync(`ffmpeg -loglevel error -y -f lavfi -i "${f}" -ac 2 "${tmp}/${k}.wav"`);
const R = (a, b, s) => Array.from({ length: Math.floor((b - a) / s + 1e-6) + 1 }, (_, i) => +(a + i * s).toFixed(2));
const beats = (a, b, s = 0.5) => R(a, b, s).map((t) => ['beat', t]);
const cuts = (ts) => ts.flatMap((t) => [['whoosh', t - 0.1], ['kick', t + 0.05]]);
const CUES = {
  // sahne başları: 0 · 2.9 · 4.6 · 6.4 · 8.0 · 9.6 · 11.7 (paylaş) · 14.3 · 16.5 (kapanış) = 20.1
  r11_oglum: [['amb', 0], ['boom', 0.05], ['soft', 0.15], ['pop', 1.2], ['rewind', 2.75], ...cuts([2.9, 4.6, 6.4, 8.0, 9.6, 11.7, 14.3, 16.5]),
    ['crowd', 4.7], ['cash', 6.6], ['roar', 8.05], ['chime', 9.8], ['pop', 11.85], ['soft', 14.4], ['boom', 16.6], ['chime', 16.9], ...beats(3.0, 16.3, 0.5)],
  // 0 · 2.9 · 4.9 · 7.2 · 9.3 · 11.4 (paylaş) · 13.9 · 15.7 (kapanış) = 19.3
  r11_td: [['boom', 0.02], ['alarm', 0.0], ['alarm', 0.32], ['alarm', 0.64], ['riser', 1.9], ...cuts([2.9, 4.9, 7.2, 9.3, 11.4, 13.9, 15.7]),
    ...R(5.15, 6.4, 0.18).map((t) => ['tick', t]), ['pop', 6.45], ['chime', 7.4], ['cash', 9.5], ['pop', 11.55], ['roar', 13.95], ['crowd', 14.2], ['boom', 15.8], ['chime', 16.1], ...beats(2.95, 15.5, 0.45)],
  // 0 · 1.6 · 3.1 · 4.8 · 6.6 · 8.3 · 10.1 (paylaş) · 12.6 · 14.6 (kapanış) = 18.2
  r11_sen: [['amb', 0], ['riser', 0.7], ['boom', 1.62], ['chime', 1.7], ...cuts([3.1, 4.8, 6.6, 8.3, 10.1, 12.6, 14.6]),
    ['crowd', 6.65], ['roar', 8.35], ['pop', 10.25], ['soft', 12.7], ['boom', 14.7], ['chime', 15.0], ...beats(3.1, 14.4, 0.5)],
};
for (const [id, cues] of Object.entries(CUES)) {
  const out = path.join(dir, id + '.mp4'), silent = path.join(dir, id + '-sessiz.mp4');
  if (!fs.existsSync(silent)) { if (!fs.existsSync(out)) continue; fs.renameSync(out, silent); }
  const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${silent}"`).toString());
  const ins = cues.map(([k]) => `-i "${tmp}/${k}.wav"`).join(' ');
  const mix = cues.map(([, t], i) => `[${i + 1}]adelay=${Math.max(0, Math.round(t * 1000))}|${Math.max(0, Math.round(t * 1000))}[a${i}]`).join(';');
  execSync(`ffmpeg -loglevel error -y -i "${silent}" ${ins} -f lavfi -t ${dur} -i anullsrc=r=44100:cl=stereo -filter_complex "${mix};[${cues.length + 1}]${cues.map((_, i) => `[a${i}]`).join('')}amix=inputs=${cues.length + 1}:normalize=0:duration=first,alimiter=limit=0.9[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -movflags +faststart "${out}"`);
  console.log('ses eklendi:', id, dur.toFixed(1) + ' sn');
}
