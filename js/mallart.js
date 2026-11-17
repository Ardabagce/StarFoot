// Alışveriş ürün görselleri: stüdyo fotoğrafı tarzında, malzemeye göre ışık-gölge (deri, metal, kumaş, cam, plastik)
// Her ürün türü bir çizim fonksiyonu; renk, malzeme, model varyantı ve marka monogramıyla yüzlerce farklı görsel üretir.
// Görseller data URL olarak önbelleğe alınır (aynı ürün bir kez çizilir).
const MallArt = (() => {
  const hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((x) => x + x).join(''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
  const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  // a > 0 açar, a < 0 koyulaştırır (-1..1)
  const sh = (h, a) => { const c = hex(h); return toHex(c.map((v) => (a >= 0 ? v + (255 - v) * a : v * (1 + a)))); };
  const mix = (h1, h2, t) => { const a = hex(h1), b = hex(h2); return toHex(a.map((v, i) => v + (b[i] - v) * t)); };
  const lum = (h) => { const [r, g, b] = hex(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const lin = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('')}</linearGradient>`;
  const rad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}>${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('')}</radialGradient>`;
  // metaller: altın, gümüş, gül altın, siyah krom
  const METAL = { gold: ['#fff4c2', '#e8c35a', '#a8761d', '#f7dd8a'], silver: ['#ffffff', '#c9ced6', '#7d838d', '#e9edf2'], rose: ['#ffe3d6', '#e3a48a', '#9c5b45', '#f4c7b4'], black: ['#7b8088', '#3a3e45', '#121417', '#5a5f67'] };
  const metal = (id, m, vertical = true) => { const c = METAL[m] || METAL.silver; return lin(id, [[0, c[0]], [0.25, c[1]], [0.5, c[2]], [0.72, c[3]], [1, c[1]]], 0, 0, vertical ? 0 : 1, vertical ? 1 : 0); };
  // malzeme gradyanı: ışık sol üstten gelir
  const mat = (id, c, kind) => {
    if (kind === 'gloss') return lin(id, [[0, sh(c, 0.45)], [0.18, sh(c, 0.12)], [0.55, c], [1, sh(c, -0.42)]], 0, 0, 0.3, 1);
    if (kind === 'leather') return lin(id, [[0, sh(c, 0.22)], [0.45, c], [1, sh(c, -0.38)]], 0, 0, 0.4, 1);
    return lin(id, [[0, sh(c, 0.16)], [0.5, c], [1, sh(c, -0.3)]], 0, 0, 0.25, 1);
  };
  const shadow = (cx, cy, rx, ry, op = 0.22) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${op}" filter="url(#blur6)"/>`;
  const gloss = (d, op = 0.35) => `<path d="${d}" fill="#fff" opacity="${op}"/>`;
  const stitch = (d, c, op = 0.55) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.1" stroke-dasharray="3 2.4" opacity="${op}"/>`;

  const D = {};

  // ---------- kol saati ----------
  D.watch = (o) => {
    const c = o.c, m = o.metal || 'silver', st = o.v % 3; // 0: deri kayış, 1: çelik bilezik, 2: kauçuk
    const sc = o.c2 || '#3b2a1e';
    const strapTop = st === 1 ? linkStrap(80, 'top') : `<path d="M96 22 Q120 16 144 22 L140 72 L100 72 Z" fill="url(#strap)"/>${st === 0 ? stitch('M100 28 L103 70 M140 28 L137 70', sh(sc, 0.5)) : ''}`;
    const strapBot = st === 1 ? linkStrap(168, 'bot') : `<path d="M100 168 L140 168 L144 222 Q120 228 96 222 Z" fill="url(#strap)"/>${st === 0 ? stitch('M103 170 L100 216 M137 170 L140 216', sh(sc, 0.5)) : `<g fill="${sh(sc, -0.35)}">${[184, 196, 208].map((y) => `<rect x="110" y="${y}" width="20" height="5" rx="2.5"/>`).join('')}</g>`}`;
    function linkStrap(y0, w) {
      let s = ''; const ys = w === 'top' ? [26, 38, 50, 62] : [170, 182, 194, 206];
      ys.forEach((y) => { s += `<rect x="98" y="${y}" width="44" height="11" rx="2" fill="url(#mt)"/><rect x="112" y="${y}" width="16" height="11" fill="url(#mt2)"/>`; });
      return s;
    }
    const idx = Array.from({ length: 12 }, (_, i) => { const a = (i * 30 * Math.PI) / 180, r1 = 38, r2 = i % 3 === 0 ? 30 : 33; return `<line x1="${120 + Math.sin(a) * r1}" y1="${120 - Math.cos(a) * r1}" x2="${120 + Math.sin(a) * r2}" y2="${120 - Math.cos(a) * r2}" stroke="${lum(c) > 0.55 ? '#1d2129' : '#f4f4f4'}" stroke-width="${i % 3 === 0 ? 3.2 : 1.6}" stroke-linecap="round"/>`; }).join('');
    const ink = lum(c) > 0.55 ? '#14171c' : '#f6f6f6';
    const chrono = o.v % 2 === 1 ? [[106, 132], [134, 132], [120, 108]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="${sh(c, -0.18)}" stroke="${ink}" stroke-opacity=".35"/><line x1="${x}" y1="${y}" x2="${x + 3}" y2="${y - 5}" stroke="${ink}" stroke-width="1"/>`).join('') : '';
    return `<defs>${mat('strap', sc, st === 2 ? 'gloss' : 'leather')}${metal('mt', m)}${metal('mt2', m, false)}${metal('case', m)}${rad('dial', [[0, sh(c, 0.35)], [0.6, c], [1, sh(c, -0.35)]], 0.42, 0.38, 0.62)}${lin('glass', [[0, '#fff', 0.55], [0.5, '#fff', 0.05], [1, '#fff', 0]], 0, 0, 1, 1)}</defs>
      ${shadow(124, 214, 54, 8)}${strapTop}${strapBot}
      <rect x="160" y="112" width="9" height="16" rx="3" fill="url(#mt2)"/>
      <circle cx="120" cy="120" r="54" fill="url(#case)"/><circle cx="120" cy="120" r="49" fill="${sh(METAL[m] ? METAL[m][2] : '#777', -0.2)}"/>
      <circle cx="120" cy="120" r="46" fill="url(#dial)"/>${idx}${chrono}
      <text x="120" y="102" text-anchor="middle" font-family="Georgia,serif" font-size="9" font-weight="700" fill="${ink}" opacity=".85">${o.m || ''}</text>
      <line x1="120" y1="120" x2="132" y2="96" stroke="${ink}" stroke-width="4" stroke-linecap="round"/><line x1="120" y1="120" x2="104" y2="152" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/><line x1="120" y1="128" x2="144" y2="106" stroke="#e5383b" stroke-width="1.2"/>
      <circle cx="120" cy="120" r="3.2" fill="url(#mt)"/><path d="M78 108 A46 46 0 0 1 132 75 A50 50 0 0 0 82 128 Z" fill="url(#glass)"/>`;
  };

  // ---------- spor ayakkabı (yandan, burun sağda) ----------
  D.sneaker = (o) => {
    const c = o.c, a = o.c2 || '#ffffff', dark = o.v % 3 === 2, sole = dark ? '#2a2c31' : '#f6f5f1', hi = o.v % 4 === 3;
    const upper = hi
      ? 'M38 162 L40 70 Q42 56 58 56 L96 58 Q104 60 104 74 L106 92 Q124 94 134 106 Q170 120 198 136 Q216 146 216 162 Z'
      : 'M38 162 L40 112 Q42 96 58 94 Q68 104 86 106 Q98 106 104 94 L112 90 Q126 92 132 104 Q168 118 196 134 Q216 144 216 162 Z';
    const laces = Array.from({ length: 5 }, (_, i) => { const x = 110 + i * 13, y = (hi ? 98 : 100) + i * 6.2; return `<circle cx="${x - 4}" cy="${y + 4}" r="1.8" fill="${sh(c, -0.55)}"/><path d="M${x - 7} ${y + 1} L${x + 5} ${y + 6}" stroke="${a}" stroke-width="2.6" stroke-linecap="round"/><path d="M${x - 7} ${y + 6} L${x + 5} ${y + 1}" stroke="${sh(a, -0.12)}" stroke-width="2.6" stroke-linecap="round"/>`; }).join('');
    return `<defs>${mat('up', c, 'fabric')}${lin('mid', [[0, '#ffffff'], [0.6, sole], [1, sh(sole, -0.18)]])}${lin('acc', [[0, sh(a, 0.25)], [1, sh(a, -0.18)]], 0, 0, 1, 0)}${lin('toe', [[0, sh(c, 0.18)], [1, sh(c, -0.18)]])}</defs>
      ${shadow(126, 194, 96, 7, 0.28)}
      <path d="M30 176 Q28 188 42 190 L206 190 Q222 188 220 174 Z" fill="${dark ? '#141518' : sh('#b9b2a6', -0.15)}"/>
      <path d="M32 158 L182 158 Q208 158 218 166 Q224 176 214 180 L38 182 Q28 178 32 158 Z" fill="url(#mid)"/>
      <path d="M40 170 L210 170" stroke="${sh(sole, -0.22)}" stroke-width="1.2" opacity=".7"/>
      <path d="${upper}" fill="url(#up)"/>
      <path d="M38 162 L40 ${hi ? 76 : 116} Q52 ${hi ? 80 : 122} 62 136 L64 162 Z" fill="${sh(c, -0.22)}"/>
      <path d="M166 162 Q166 134 192 132 Q214 142 216 162 Z" fill="url(#toe)"/>
      <path d="M66 152 Q104 120 172 124 Q124 136 92 158 Q78 158 66 152 Z" fill="url(#acc)"/>
      <path d="${hi ? 'M104 74 L112 56 Q126 56 130 74 L126 96 Z' : 'M104 94 L114 78 Q128 80 130 98 L124 104 Z'}" fill="${sh(c, 0.1)}"/>
      <path d="${hi ? 'M42 62 Q70 54 100 62' : 'M58 96 Q74 108 98 102'}" fill="none" stroke="${sh(c, -0.5)}" stroke-width="5" stroke-linecap="round"/>
      ${laces}
      ${stitch(hi ? 'M44 156 L46 74 Q48 62 60 62' : 'M44 156 L46 116 Q48 102 58 100', sh(c, 0.45), 0.5)}
      ${stitch('M70 158 Q108 128 168 128', sh(a, -0.25), 0.45)}
      ${gloss('M120 108 Q150 116 176 128 Q148 122 124 116 Z', 0.3)}
      <path d="M40 112 Q44 98 56 96" fill="none" stroke="#fff" stroke-width="2" opacity=".25"/>
      <text x="150" y="152" font-family="Arial Black,Arial,sans-serif" font-size="10" font-weight="900" fill="${sh(a, -0.35)}" opacity=".75" transform="rotate(-6 150 152)">${o.m || ''}</text>`;
  };

  // ---------- el çantası ----------
  D.bag = (o) => {
    const c = o.c, m = o.metal || 'gold', v = o.v % 3;
    const body = v === 0 ? 'M54 100 L186 100 L200 196 Q200 204 192 204 L48 204 Q40 204 40 196 Z' : v === 1 ? 'M50 96 Q50 88 58 88 L182 88 Q190 88 190 96 L192 198 Q192 206 184 206 L56 206 Q48 206 48 198 Z' : 'M60 110 Q120 96 180 110 L196 196 Q120 214 44 196 Z';
    return `<defs>${mat('lb', c, 'leather')}${metal('hw', m)}${lin('fl', [[0, sh(c, 0.12)], [1, sh(c, -0.3)]])}</defs>
      ${shadow(120, 212, 86, 8)}
      <path d="M78 104 Q78 40 120 40 Q162 40 162 104" fill="none" stroke="${sh(c, -0.35)}" stroke-width="9" stroke-linecap="round"/>
      <path d="M78 104 Q78 46 120 46 Q162 46 162 104" fill="none" stroke="${sh(c, 0.15)}" stroke-width="3" opacity=".6"/>
      <rect x="70" y="96" width="14" height="14" rx="3" fill="url(#hw)"/><rect x="156" y="96" width="14" height="14" rx="3" fill="url(#hw)"/>
      <path d="${body}" fill="url(#lb)"/>
      ${v === 1 ? `<path d="M50 96 L190 96 L186 150 Q120 162 54 150 Z" fill="url(#fl)"/>${stitch('M56 102 L184 102 L181 146 Q120 156 59 146 Z', sh(c, 0.4))}<rect x="108" y="140" width="24" height="18" rx="4" fill="url(#hw)"/><rect x="114" y="146" width="12" height="6" rx="2" fill="${sh(METAL[m][2], -0.2)}"/>` : `${stitch(body.replace(/^M54 100/, 'M58 106'), sh(c, 0.4))}<rect x="104" y="112" width="32" height="12" rx="3" fill="url(#hw)"/><text x="120" y="121.5" text-anchor="middle" font-family="Georgia,serif" font-size="8" font-weight="700" fill="${sh(METAL[m][2], -0.3)}">${o.m || ''}</text>`}
      ${gloss('M58 112 Q66 106 82 106 L74 180 Q60 172 58 112 Z', 0.16)}`;
  };

  // ---------- güneş gözlüğü ----------
  D.glasses = (o) => {
    const c = o.c, f = o.c2 || '#1a1a1a', v = o.v % 3, met = o.metal;
    const lens = v === 0 ? (x) => `M${x - 38} 104 Q${x - 40} 92 ${x - 26} 90 L${x + 26} 90 Q${x + 40} 92 ${x + 36} 108 Q${x + 30} 140 ${x} 140 Q${x - 32} 140 ${x - 38} 104 Z` : v === 1 ? (x) => `M${x} 86 a30 30 0 1 0 0.1 0 Z` : (x) => `M${x - 40} 96 L${x + 38} 92 Q${x + 42} 92 ${x + 40} 102 L${x + 32} 132 Q${x + 28} 140 ${x + 18} 140 L${x - 22} 140 Q${x - 34} 140 ${x - 38} 128 Z`;
    return `<defs>${lin('ln', [[0, sh(c, 0.25)], [0.55, c], [1, sh(c, -0.45)]], 0, 0, 0.3, 1)}${met ? metal('fr', met) : lin('fr', [[0, sh(f, 0.35)], [1, sh(f, -0.3)]])}</defs>
      ${shadow(120, 176, 92, 7, 0.18)}
      <path d="M30 100 Q14 112 22 150" fill="none" stroke="url(#fr)" stroke-width="6" stroke-linecap="round"/><path d="M210 100 Q226 112 218 150" fill="none" stroke="url(#fr)" stroke-width="6" stroke-linecap="round"/>
      <path d="${lens(76)}" fill="url(#ln)" stroke="url(#fr)" stroke-width="${met ? 3 : 7}"/><path d="${lens(164)}" fill="url(#ln)" stroke="url(#fr)" stroke-width="${met ? 3 : 7}"/>
      <path d="M108 100 Q120 90 132 100" fill="none" stroke="url(#fr)" stroke-width="${met ? 3 : 6}"/>
      ${gloss('M52 98 Q62 94 80 94 Q62 104 56 118 Z', 0.45)}${gloss('M140 98 Q150 94 168 94 Q150 104 144 118 Z', 0.45)}
      <path d="M86 130 Q98 126 104 116" fill="none" stroke="#fff" stroke-width="2" opacity=".25"/><path d="M174 130 Q186 126 192 116" fill="none" stroke="#fff" stroke-width="2" opacity=".25"/>`;
  };

  // ---------- kulaklık ----------
  D.headphones = (o) => {
    const c = o.c, m = o.metal || 'silver', pad = o.c2 || sh(c, -0.45);
    return `<defs>${mat('hb', c, o.v % 2 ? 'gloss' : 'fabric')}${metal('ring', m)}${rad('cup', [[0, sh(c, 0.3)], [0.7, c], [1, sh(c, -0.4)]], 0.4, 0.35, 0.7)}${lin('pd', [[0, sh(pad, 0.15)], [1, sh(pad, -0.3)]])}</defs>
      ${shadow(120, 210, 80, 8)}
      <path d="M50 140 Q44 40 120 36 Q196 40 190 140" fill="none" stroke="url(#hb)" stroke-width="16" stroke-linecap="round"/>
      <path d="M64 120 Q62 62 120 58 Q178 62 176 120" fill="none" stroke="url(#pd)" stroke-width="10" stroke-linecap="round"/>
      <rect x="40" y="118" width="20" height="30" rx="5" fill="url(#ring)"/><rect x="180" y="118" width="20" height="30" rx="5" fill="url(#ring)"/>
      <ellipse cx="56" cy="166" rx="30" ry="40" fill="url(#cup)"/><ellipse cx="184" cy="166" rx="30" ry="40" fill="url(#cup)"/>
      <ellipse cx="56" cy="166" rx="22" ry="31" fill="none" stroke="url(#ring)" stroke-width="3"/><ellipse cx="184" cy="166" rx="22" ry="31" fill="none" stroke="url(#ring)" stroke-width="3"/>
      <text x="56" y="170" text-anchor="middle" font-family="Arial Black,Arial" font-size="10" font-weight="900" fill="url(#ring)">${o.m || ''}</text><text x="184" y="170" text-anchor="middle" font-family="Arial Black,Arial" font-size="10" font-weight="900" fill="url(#ring)">${o.m || ''}</text>
      ${gloss('M38 140 Q44 128 56 126 Q44 140 42 162 Z', 0.3)}${gloss('M166 140 Q172 128 184 126 Q172 140 170 162 Z', 0.3)}`;
  };

  // ---------- dizüstü bilgisayar ----------
  D.laptop = (o) => {
    const c = o.c, w = o.c2 || '#3a7bd5';
    return `<defs>${metal('al', o.metal || 'silver')}${lin('scr', [[0, sh(w, 0.25)], [0.6, w], [1, mix(w, '#120a2c', 0.6)]], 0, 0, 1, 1)}${lin('base', [[0, sh(c, 0.3)], [1, sh(c, -0.25)]])}</defs>
      ${shadow(120, 206, 104, 8, 0.25)}
      <path d="M52 50 Q52 42 60 42 L180 42 Q188 42 188 50 L190 160 L50 160 Z" fill="${sh(c, -0.55)}"/>
      <rect x="58" y="48" width="124" height="104" rx="2" fill="url(#scr)"/>
      <path d="M58 120 Q100 92 182 110 L182 152 L58 152 Z" fill="#fff" opacity=".08"/><circle cx="96" cy="88" r="26" fill="#fff" opacity=".07"/>
      <path d="M58 48 L130 48 L76 152 L58 152 Z" fill="#fff" opacity=".06"/>
      <path d="M36 162 L204 162 L222 190 Q222 196 214 196 L26 196 Q18 196 18 190 Z" fill="url(#base)"/>
      <path d="M36 162 L204 162 L208 168 L32 168 Z" fill="${sh(c, 0.35)}"/>
      <g fill="${sh(c, -0.35)}" opacity=".7">${Array.from({ length: 4 }, (_, r) => Array.from({ length: 12 }, (_, k) => `<rect x="${44 + k * 13 - r * 2.5}" y="${170 + r * 5}" width="10" height="3.4" rx="1"/>`).join('')).join('')}</g>
      <rect x="98" y="190" width="44" height="3" rx="1.5" fill="${sh(c, -0.2)}"/>`;
  };

  // ---------- parfüm ----------
  D.perfume = (o) => {
    const c = o.c, m = o.metal || 'gold', v = o.v % 3;
    const bottle = v === 0 ? '<rect x="74" y="92" width="92" height="112" rx="16"/>' : v === 1 ? '<path d="M120 86 Q176 110 172 160 Q168 206 120 206 Q72 206 68 160 Q64 110 120 86 Z"/>' : '<path d="M86 90 L154 90 L176 204 L64 204 Z"/>';
    return `<defs>${lin('lq', [[0, sh(c, 0.35)], [0.6, c], [1, sh(c, -0.4)]], 0, 0, 0.6, 1)}${metal('cap', m)}${lin('gl', [[0, '#fff', 0.7], [0.3, '#fff', 0.12], [0.75, '#fff', 0.02], [1, '#fff', 0.35]], 0, 0, 1, 0)}<clipPath id="bt">${bottle}</clipPath></defs>
      ${shadow(120, 210, 62, 8)}
      <g clip-path="url(#bt)"><rect x="40" y="80" width="160" height="140" fill="${sh(c, 0.55)}" opacity=".45"/><rect x="40" y="118" width="160" height="100" fill="url(#lq)" opacity=".92"/><rect x="40" y="80" width="160" height="140" fill="url(#gl)"/></g>
      <g fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5">${bottle.replace('/>', ' fill="none"/>')}</g>
      <rect x="100" y="70" width="40" height="22" rx="3" fill="url(#cap)"/><rect x="92" y="36" width="56" height="38" rx="${v === 1 ? 19 : 6}" fill="url(#cap)"/>
      ${gloss('M98 40 L106 40 L104 70 L98 70 Z', 0.45)}
      <rect x="96" y="146" width="48" height="26" rx="3" fill="#fff" opacity=".85"/><text x="120" y="163" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" fill="${sh(c, -0.5)}">${o.m || ''}</text>
      ${gloss('M80 104 L90 104 L88 190 L80 186 Z', 0.4)}`;
  };

  // ---------- ceket (puf mont / bomber / blazer) ----------
  D.jacket = (o) => {
    const c = o.c, a = o.c2 || sh(c, -0.35), v = o.v % 3, m = o.metal || 'silver';
    const torso = 'M62 50 Q88 44 104 38 Q120 50 136 38 Q152 44 178 50 L184 206 L56 206 Z';
    const sl = (dx) => (dx < 0 ? 'M62 50 Q40 56 32 78 L22 194 Q22 204 32 204 L54 204 L60 118 Z' : 'M178 50 Q200 56 208 78 L218 194 Q218 204 208 204 L186 204 L180 118 Z');
    const quilt = v === 0 ? Array.from({ length: 7 }, (_, i) => { const y = 72 + i * 19; return `<path d="M58 ${y} Q120 ${y + 7} 182 ${y}" fill="none" stroke="${sh(c, -0.35)}" stroke-width="2" opacity=".55"/><path d="M58 ${y - 5} Q120 ${y + 2} 182 ${y - 5}" fill="none" stroke="${sh(c, 0.4)}" stroke-width="2.4" opacity=".3"/><path d="M34 ${y + 4} L58 ${y + 2}" stroke="${sh(c, -0.4)}" stroke-width="1.6" opacity=".5"/><path d="M182 ${y + 2} L206 ${y + 4}" stroke="${sh(c, -0.4)}" stroke-width="1.6" opacity=".5"/>`; }).join('') : '';
    const collar = v === 1
      ? `<path d="M86 44 Q120 60 154 44 L148 32 Q120 46 92 32 Z" fill="${a}"/>${[0, 1, 2].map((i) => `<path d="M${90 + i * 0} ${36 + i * 3} Q120 ${50 + i * 3} ${150} ${36 + i * 3}" fill="none" stroke="${sh(a, 0.25)}" stroke-width="1" opacity=".5"/>`).join('')}<rect x="56" y="194" width="128" height="12" fill="${a}"/><rect x="22" y="192" width="32" height="12" rx="3" fill="${a}"/><rect x="186" y="192" width="32" height="12" rx="3" fill="${a}"/>`
      : v === 2
        ? `<path d="M104 38 L120 124 L136 38 L148 42 L126 112 L120 128 L114 112 L92 42 Z" fill="${sh(c, -0.28)}"/><path d="M92 42 L114 112 L104 118 L84 70 Z" fill="${sh(c, 0.1)}"/><path d="M148 42 L126 112 L136 118 L156 70 Z" fill="${sh(c, 0.02)}"/><path d="M106 40 L120 82 L134 40 Q120 46 106 40 Z" fill="${o.c3 || '#f4f4f4'}"/><path d="M114 48 L120 64 L126 48 Z" fill="${o.c4 || sh(c, -0.4)}"/>`
        : '';
    const zip = v === 2 ? [146, 168].map((y) => `<circle cx="121" cy="${y}" r="3.6" fill="url(#zp)"/>`).join('') : `<path d="M120 48 L120 206" stroke="url(#zp)" stroke-width="3"/><rect x="116" y="${v === 1 ? 58 : 52}" width="8" height="15" rx="2" fill="url(#zp)"/>`;
    return `<defs>${mat('jk', c, v === 0 ? 'gloss' : 'fabric')}${lin('sv', [[0, sh(c, 0.05)], [0.5, sh(c, -0.12)], [1, sh(c, -0.38)]], 0, 0, 1, 1)}${metal('zp', m)}</defs>
      ${shadow(120, 214, 100, 7)}
      <path d="${sl(-1)}" fill="url(#sv)"/><path d="${sl(1)}" fill="url(#sv)"/>
      <path d="${torso}" fill="url(#jk)"/>
      <path d="M60 118 L62 50 M180 118 L178 50" stroke="${sh(c, -0.45)}" stroke-width="1.6" opacity=".55"/>
      ${quilt}${collar}${zip}
      ${v !== 2 ? `<path d="M76 150 Q90 148 104 150" stroke="${sh(c, -0.45)}" stroke-width="2.5" fill="none"/><path d="M136 150 Q150 148 164 150" stroke="${sh(c, -0.45)}" stroke-width="2.5" fill="none"/>` : `<path d="M70 162 L98 162" stroke="${sh(c, -0.3)}" stroke-width="2"/><path d="M144 162 L172 162" stroke="${sh(c, -0.3)}" stroke-width="2"/>`}
      ${gloss('M66 60 Q78 52 92 50 L84 130 Q66 118 66 60 Z', v === 0 ? 0.2 : 0.1)}
      <path d="M36 84 Q40 70 52 64" fill="none" stroke="#fff" stroke-width="2.5" opacity=".18"/>
      <text x="150" y="92" font-family="Arial Black,Arial" font-size="8" font-weight="900" fill="${sh(c, lum(c) > 0.5 ? -0.5 : 0.6)}" opacity=".8">${o.m || ''}</text>`;
  };

  // stüdyo çerçevesi (beyaz/açık gri fon, yumuşak ışık)
  function frame(inner, bg) {
    const b = bg || ['#ffffff', '#eceff4'];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><radialGradient id="bgs" cx="50%" cy="38%" r="78%"><stop offset="0" stop-color="${b[0]}"/><stop offset="1" stop-color="${b[1]}"/></radialGradient><filter id="blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs><rect width="240" height="240" fill="url(#bgs)"/>${inner}</svg>`;
  }
  const cache = new Map();
  return {
    types: () => Object.keys(D),
    has: (t) => !!D[t],
    // o: { t: tür, c: ana renk, c2: ikinci renk, metal, v: model varyantı, m: monogram, lux: lüks fon }
    url(o) {
      const k = JSON.stringify(o);
      if (cache.has(k)) return cache.get(k);
      const f = D[o.t] || D.bag;
      let svg;
      try { svg = frame(f(o), o.lux ? ['#fbf7ef', '#e9e1d2'] : null); } catch (e) { svg = frame(''); }
      const u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      if (cache.size > 600) cache.clear();
      cache.set(k, u);
      return u;
    },
    shade: sh,
  };
})();
