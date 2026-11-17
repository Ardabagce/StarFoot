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

  // ======== 1.0.25: giyim ve aksesuar ========
  D.suit = (o) => {
    const c = o.c, sh2 = o.c3 || '#f4f4f4', tie = o.c2 || '#7a1d2a';
    return `<defs>${mat('st', c, 'fabric')}${lin('sv2', [[0, sh(c, 0.05)], [1, sh(c, -0.35)]], 0, 0, 1, 1)}${lin('pt', [[0, sh(c, -0.05)], [1, sh(c, -0.3)]])}</defs>
      ${shadow(120, 220, 70, 6)}
      <path d="M86 150 L154 150 L150 216 L126 216 L120 168 L114 216 L90 216 Z" fill="url(#pt)"/><path d="M120 168 L120 214" stroke="${sh(c, -0.45)}" stroke-width="1.2"/>
      <path d="M78 46 Q58 52 52 72 L46 156 L64 156 L70 92 Z" fill="url(#sv2)"/><path d="M162 46 Q182 52 188 72 L194 156 L176 156 L170 92 Z" fill="url(#sv2)"/>
      <path d="M78 46 Q100 38 108 32 Q120 42 132 32 Q140 38 162 46 L168 158 L72 158 Z" fill="url(#st)"/>
      <path d="M106 34 L120 70 L134 34 Q120 40 106 34 Z" fill="${sh2}"/><path d="M116 44 L124 44 L126 50 L120 104 L114 50 Z" fill="${tie}"/><path d="M116 44 L124 44 L122 50 L118 50 Z" fill="${sh(tie, -0.3)}"/>
      <path d="M108 32 L120 104 L96 72 L92 44 Z" fill="${sh(c, 0.1)}"/><path d="M132 32 L120 104 L144 72 L148 44 Z" fill="${sh(c, 0.03)}"/>
      ${[118, 136].map((y) => `<circle cx="121" cy="${y}" r="3" fill="${sh(c, -0.5)}"/>`).join('')}
      <path d="M140 66 L156 64" stroke="${sh2}" stroke-width="3"/>${gloss('M84 52 Q92 46 100 46 L96 120 Q84 110 84 52 Z', 0.12)}`;
  };
  D.dressshoe = (o) => {
    const c = o.c, v = o.v % 2;
    return `<defs>${mat('ds', c, 'gloss')}</defs>${shadow(124, 184, 92, 6, 0.28)}
      <path d="M30 168 L214 168 Q222 174 214 180 L34 180 Q26 176 30 168 Z" fill="${sh(c, -0.55)}"/>
      <path d="M34 168 L36 120 Q38 106 54 104 Q80 108 104 112 Q150 116 190 132 Q214 142 216 168 Z" fill="url(#ds)"/>
      ${v ? `<path d="M100 112 Q140 112 176 128 Q150 134 124 132 Q108 128 100 112 Z" fill="${sh(c, -0.25)}"/><rect x="118" y="118" width="26" height="6" rx="3" fill="${sh(c, -0.4)}"/>` : `<path d="M96 112 L150 120 Q140 136 112 132 Z" fill="${sh(c, -0.2)}"/>${[0, 1, 2, 3].map((i) => `<path d="M${104 + i * 11} ${116 + i * 2} l8 6" stroke="${sh(c, 0.4)}" stroke-width="1.6"/>`).join('')}`}
      ${stitch('M40 160 L42 122 Q44 112 56 110', sh(c, 0.4), 0.45)}${stitch('M178 136 Q206 146 208 164', sh(c, 0.4), 0.4)}
      ${gloss('M150 124 Q186 132 204 148 Q178 140 150 132 Z', 0.45)}${gloss('M44 120 Q50 110 62 110 Q50 118 48 140 Z', 0.3)}`;
  };
  D.hoodie = (o) => {
    const c = o.c, a = o.c2 || sh(c, -0.3);
    return `<defs>${mat('hd', c, 'fabric')}${lin('hs', [[0, sh(c, 0.02)], [1, sh(c, -0.32)]], 0, 0, 1, 1)}</defs>${shadow(120, 214, 98, 7)}
      <path d="M62 56 Q40 62 32 84 L22 194 Q22 204 32 204 L54 204 L60 120 Z" fill="url(#hs)"/><path d="M178 56 Q200 62 208 84 L218 194 Q218 204 208 204 L186 204 L180 120 Z" fill="url(#hs)"/>
      <path d="M62 56 Q86 46 100 44 Q120 56 140 44 Q154 46 178 56 L184 204 L56 204 Z" fill="url(#hd)"/>
      <path d="M86 50 Q86 18 120 16 Q154 18 154 50 Q140 70 120 70 Q100 70 86 50 Z" fill="${sh(c, -0.12)}"/><path d="M98 50 Q100 30 120 28 Q140 30 142 50 Q132 60 120 60 Q108 60 98 50 Z" fill="${sh(c, -0.45)}"/>
      <path d="M112 62 L110 96 M128 62 L130 96" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M78 140 L162 140 L156 180 L84 180 Z" fill="${sh(c, -0.08)}"/><path d="M78 140 L162 140" stroke="${sh(c, -0.35)}" stroke-width="1.5"/>
      <rect x="56" y="196" width="128" height="8" fill="${sh(c, -0.2)}"/><text x="120" y="122" text-anchor="middle" font-family="Arial Black,Arial" font-size="13" font-weight="900" fill="${a}">${o.m || ''}</text>
      ${gloss('M66 66 Q78 58 92 56 L86 130 Q66 120 66 66 Z', 0.1)}`;
  };
  D.cap = (o) => {
    const c = o.c, a = o.c2 || sh(c, -0.3);
    return `<defs>${rad('cp', [[0, sh(c, 0.35)], [0.7, c], [1, sh(c, -0.35)]], 0.4, 0.3, 0.7)}${lin('br', [[0, sh(a, 0.1)], [1, sh(a, -0.4)]])}</defs>${shadow(120, 190, 86, 7)}
      <path d="M150 150 Q214 150 226 168 Q206 182 150 172 Z" fill="url(#br)"/>
      <path d="M44 156 Q40 76 120 70 Q194 74 190 156 Q120 170 44 156 Z" fill="url(#cp)"/>
      <path d="M120 70 L120 160 M82 80 Q96 120 92 162 M158 80 Q146 120 150 162" stroke="${sh(c, -0.3)}" stroke-width="1.4" fill="none" opacity=".6"/>
      <circle cx="120" cy="72" r="5" fill="${sh(c, -0.2)}"/><text x="104" y="128" text-anchor="middle" font-family="Arial Black,Arial" font-size="18" font-weight="900" fill="${a}">${o.m || ''}</text>
      ${gloss('M60 120 Q66 86 104 78 Q76 96 70 140 Z', 0.25)}`;
  };
  D.ring = (o) => {
    const m = o.metal || 'gold', gem = o.c;
    return `<defs>${metal('rg', m, false)}${rad('gm', [[0, '#ffffff'], [0.3, sh(gem, 0.4)], [0.8, gem], [1, sh(gem, -0.5)]], 0.4, 0.35, 0.6)}</defs>${shadow(120, 196, 60, 6, 0.2)}
      <ellipse cx="120" cy="140" rx="58" ry="50" fill="none" stroke="url(#rg)" stroke-width="14"/><ellipse cx="120" cy="140" rx="50" ry="42" fill="none" stroke="${sh(METAL[m][2], -0.2)}" stroke-width="2" opacity=".5"/>
      <path d="M96 92 L144 92 L136 76 L104 76 Z" fill="url(#rg)"/>
      <path d="M100 76 L120 40 L140 76 Z" fill="url(#gm)"/><path d="M100 76 L110 58 L120 76 Z" fill="#fff" opacity=".35"/><path d="M120 40 L130 58 L140 76 L128 76 Z" fill="${sh(gem, -0.35)}" opacity=".6"/>
      ${[[96, 52], [146, 48], [108, 30]].map(([x, y]) => `<path d="M${x} ${y - 6} L${x + 2} ${y - 1} L${x + 7} ${y} L${x + 2} ${y + 1} L${x} ${y + 6} L${x - 2} ${y + 1} L${x - 7} ${y} L${x - 2} ${y - 1} Z" fill="#fff" opacity=".9"/>`).join('')}`;
  };
  D.necklace = (o) => {
    const m = o.metal || 'gold', gem = o.c;
    const chain = Array.from({ length: 26 }, (_, i) => { const t = i / 25, a = Math.PI * (0.08 + t * 0.84), x = 120 - Math.cos(a) * 86, y = 40 + Math.sin(a) * 110; return `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.6" fill="none" stroke="url(#nc)" stroke-width="1.8" transform="rotate(${(a * 180) / Math.PI - 90} ${x} ${y})"/>`; }).join('');
    return `<defs>${metal('nc', m)}${rad('pd2', [[0, '#fff'], [0.35, sh(gem, 0.35)], [0.85, gem], [1, sh(gem, -0.5)]], 0.4, 0.35, 0.6)}</defs>${shadow(120, 206, 40, 5, 0.18)}
      ${chain}<path d="M120 150 L132 162 L120 200 L108 162 Z" fill="url(#nc)"/><path d="M120 158 L128 166 L120 192 L112 166 Z" fill="url(#pd2)"/>${gloss('M114 166 L118 162 L118 180 Z', 0.6)}`;
  };
  D.wallet = (o) => {
    const c = o.c, m = o.metal || 'silver';
    return `<defs>${mat('wl', c, 'leather')}${metal('wm', m)}</defs>${shadow(120, 186, 84, 7)}
      <rect x="40" y="70" width="160" height="110" rx="10" fill="url(#wl)"/><path d="M40 108 L200 108" stroke="${sh(c, -0.4)}" stroke-width="2"/>
      <rect x="50" y="58" width="74" height="40" rx="4" fill="#f1efe8" transform="rotate(-6 87 78)"/><rect x="58" y="60" width="74" height="40" rx="4" fill="#c9d6e8" transform="rotate(4 95 80)"/>
      <rect x="40" y="96" width="160" height="84" rx="10" fill="url(#wl)"/>${stitch('M48 104 L192 104 L192 172 L48 172 Z', sh(c, 0.4))}
      <rect x="104" y="128" width="32" height="12" rx="3" fill="url(#wm)"/><text x="120" y="137" text-anchor="middle" font-family="Georgia,serif" font-size="8" font-weight="700" fill="${sh(METAL[m][2], -0.3)}">${o.m || ''}</text>
      ${gloss('M48 104 L90 104 L60 170 L48 170 Z', 0.12)}`;
  };
  D.backpack = (o) => {
    const c = o.c, a = o.c2 || sh(c, -0.3), m = o.metal || 'silver';
    return `<defs>${mat('bp', c, 'fabric')}${metal('bz', m)}</defs>${shadow(120, 212, 74, 7)}
      <path d="M96 40 Q96 20 120 20 Q144 20 144 40" fill="none" stroke="${a}" stroke-width="8" stroke-linecap="round"/>
      <path d="M64 70 Q64 36 120 34 Q176 36 176 70 L180 196 Q180 208 168 208 L72 208 Q60 208 60 196 Z" fill="url(#bp)"/>
      <path d="M64 92 Q120 76 176 92" fill="none" stroke="url(#bz)" stroke-width="2.5"/><rect x="146" y="84" width="6" height="14" rx="2" fill="url(#bz)"/>
      <path d="M78 130 L162 130 L160 196 Q160 200 156 200 L84 200 Q80 200 80 196 Z" fill="${sh(c, -0.12)}"/><path d="M78 130 L162 130" stroke="url(#bz)" stroke-width="2.5"/>
      ${stitch('M82 136 L158 136 L156 194 L84 194 Z', sh(c, 0.4))}<rect x="110" y="150" width="20" height="12" rx="3" fill="${a}"/><text x="120" y="159" text-anchor="middle" font-family="Arial Black,Arial" font-size="7" font-weight="900" fill="${sh(c, 0.6)}">${o.m || ''}</text>
      ${gloss('M70 74 Q74 50 96 44 Q80 64 80 120 Q70 110 70 74 Z', 0.16)}`;
  };
  D.suitcase = (o) => {
    const c = o.c, m = o.metal || 'silver';
    return `<defs>${mat('sc', c, 'gloss')}${metal('sm', m)}</defs>${shadow(120, 216, 66, 6)}
      <path d="M104 46 L104 22 L136 22 L136 46" fill="none" stroke="url(#sm)" stroke-width="5"/>
      <rect x="62" y="44" width="116" height="158" rx="14" fill="url(#sc)"/>
      ${[0, 1, 2, 3].map((i) => `<path d="M${80 + i * 27} 52 L${80 + i * 27} 194" stroke="${sh(c, -0.25)}" stroke-width="3" opacity=".6"/><path d="M${82 + i * 27} 52 L${82 + i * 27} 194" stroke="${sh(c, 0.35)}" stroke-width="1.5" opacity=".5"/>`).join('')}
      <rect x="62" y="116" width="116" height="6" fill="url(#sm)"/><circle cx="80" cy="208" r="6" fill="#222"/><circle cx="160" cy="208" r="6" fill="#222"/>
      ${gloss('M70 56 Q72 48 84 48 L80 180 Q70 170 70 56 Z', 0.3)}`;
  };
  D.pen = (o) => {
    const c = o.c, m = o.metal || 'gold';
    return `<defs>${lin('pn', [[0, sh(c, 0.4)], [0.5, c], [1, sh(c, -0.5)]], 0, 0, 0, 1)}${metal('pm', m, true)}</defs>${shadow(120, 168, 96, 5, 0.2)}
      <g transform="rotate(-18 120 120)"><path d="M28 112 L44 104 L44 136 L28 128 Z" fill="url(#pm)"/><rect x="44" y="104" width="118" height="32" rx="6" fill="url(#pn)"/>
      <rect x="150" y="102" width="14" height="36" rx="3" fill="url(#pm)"/><rect x="164" y="106" width="40" height="28" rx="12" fill="url(#pn)"/><path d="M204 112 L222 120 L204 128 Z" fill="url(#pm)"/>
      <rect x="70" y="98" width="62" height="5" rx="2.5" fill="url(#pm)"/>${gloss('M48 108 L160 108 L160 114 L48 114 Z', 0.4)}</g>`;
  };
  // ======== elektronik ========
  D.tv = (o) => {
    const w = o.c2 || '#2563eb', c = o.c;
    return `<defs>${lin('tvs', [[0, sh(w, 0.3)], [0.5, w], [1, mix(w, '#0a0620', 0.7)]], 0, 0, 1, 1)}${metal('tvm', o.metal || 'black')}</defs>${shadow(120, 206, 70, 6)}
      <rect x="20" y="42" width="200" height="124" rx="4" fill="${sh(c, -0.6)}"/><rect x="24" y="46" width="192" height="114" fill="url(#tvs)"/>
      <path d="M24 130 Q80 100 140 120 Q180 132 216 110 L216 160 L24 160 Z" fill="#fff" opacity=".12"/><circle cx="160" cy="80" r="30" fill="#fff" opacity=".1"/><path d="M24 46 L120 46 L60 160 L24 160 Z" fill="#fff" opacity=".07"/>
      <path d="M100 166 L92 196 L148 196 L140 166 Z" fill="url(#tvm)"/><rect x="72" y="194" width="96" height="6" rx="3" fill="url(#tvm)"/>`;
  };
  D.console = (o) => {
    const c = o.c, a = o.c2 || '#1e5bd8';
    return `<defs>${mat('cs', c, 'gloss')}${mat('cn', sh(c, -0.1), 'gloss')}</defs>${shadow(120, 206, 92, 7)}
      <path d="M40 60 Q40 50 50 50 L150 50 Q160 50 160 60 L162 176 L38 176 Z" fill="url(#cs)"/><path d="M98 50 L102 176" stroke="${a}" stroke-width="3" opacity=".8"/>
      <rect x="44" y="160" width="40" height="5" rx="2" fill="${sh(c, -0.35)}"/><circle cx="148" cy="164" r="3" fill="${a}"/>${gloss('M46 58 L94 58 L70 168 L46 168 Z', 0.18)}
      <path d="M128 168 Q122 140 146 136 L206 136 Q228 140 222 168 Q218 196 204 192 Q196 182 190 180 L160 180 Q154 182 146 192 Q132 196 128 168 Z" fill="url(#cn)"/>
      <circle cx="158" cy="158" r="7" fill="${sh(c, -0.4)}"/><circle cx="190" cy="166" r="7" fill="${sh(c, -0.4)}"/>${[[200, 150], [208, 158], [192, 158]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${a}"/>`).join('')}<path d="M146 148 h10 M151 143 v10" stroke="${sh(c, -0.45)}" stroke-width="3"/>`;
  };
  D.camera = (o) => {
    const c = o.c, m = o.metal || 'silver';
    return `<defs>${mat('cb', c, 'leather')}${metal('cm2', m)}${rad('lens', [[0, '#5a7bd8'], [0.3, '#1b2440'], [0.8, '#05070c'], [1, '#22252c']], 0.4, 0.38, 0.6)}</defs>${shadow(120, 200, 86, 7)}
      <rect x="138" y="54" width="44" height="22" rx="4" fill="url(#cm2)"/><rect x="58" y="60" width="32" height="14" rx="3" fill="url(#cm2)"/>
      <rect x="34" y="72" width="172" height="112" rx="14" fill="url(#cm2)"/><rect x="34" y="98" width="172" height="78" fill="url(#cb)"/>
      <circle cx="120" cy="132" r="48" fill="url(#cm2)"/><circle cx="120" cy="132" r="40" fill="#15171c"/><circle cx="120" cy="132" r="30" fill="url(#lens)"/>
      <circle cx="108" cy="120" r="8" fill="#fff" opacity=".4"/><circle cx="132" cy="144" r="3" fill="#fff" opacity=".3"/><circle cx="186" cy="88" r="5" fill="#e5383b"/>
      <text x="62" y="92" font-family="Arial Black,Arial" font-size="9" font-weight="900" fill="${sh(METAL[m][2], -0.3)}">${o.m || ''}</text>`;
  };
  D.drone = (o) => {
    const c = o.c, a = o.c2 || '#e5383b';
    const arm = (x, y) => `<path d="M120 120 L${x} ${y}" stroke="${sh(c, -0.2)}" stroke-width="9" stroke-linecap="round"/><ellipse cx="${x}" cy="${y - 6}" rx="34" ry="5" fill="#9aa3b2" opacity=".45"/><circle cx="${x}" cy="${y}" r="8" fill="${sh(c, -0.35)}"/>`;
    return `<defs>${mat('dr', c, 'gloss')}</defs>${shadow(120, 196, 70, 6, 0.15)}
      ${arm(54, 74)}${arm(186, 74)}${arm(54, 162)}${arm(186, 162)}
      <path d="M92 104 Q120 88 148 104 L152 140 Q120 152 88 140 Z" fill="url(#dr)"/><circle cx="120" cy="150" r="12" fill="#14161b"/><circle cx="120" cy="150" r="7" fill="#3456a0"/><circle cx="117" cy="147" r="2.5" fill="#fff" opacity=".6"/>
      <rect x="106" y="108" width="28" height="5" rx="2.5" fill="${a}"/>${gloss('M98 104 Q120 92 142 104 L140 110 Q120 100 100 110 Z', 0.4)}`;
  };
  D.tablet = (o) => {
    const c = o.c, w = o.c2 || '#8b5cf6';
    return `<defs>${lin('tbs', [[0, sh(w, 0.35)], [0.6, w], [1, mix(w, '#0c0a22', 0.6)]], 0, 0, 1, 1)}${metal('tbm', o.metal || 'silver')}</defs>${shadow(120, 210, 70, 6)}
      <rect x="48" y="26" width="144" height="182" rx="14" fill="url(#tbm)"/><rect x="52" y="30" width="136" height="174" rx="11" fill="#0d0f14"/><rect x="58" y="38" width="124" height="158" rx="4" fill="url(#tbs)"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${68 + (i % 4) * 28}" y="${52 + Math.floor(i / 4) * 30}" width="18" height="18" rx="5" fill="#fff" opacity="${0.18 + (i % 3) * 0.08}"/>`).join('')}
      <path d="M58 38 L130 38 L74 196 L58 196 Z" fill="#fff" opacity=".07"/>`;
  };
  D.smartwatch = (o) => {
    const c = o.c, w = o.c2 || '#ff6f64', m = o.metal || 'black';
    return `<defs>${mat('sw', c, 'gloss')}${metal('swm', m)}</defs>${shadow(120, 214, 44, 6)}
      <path d="M96 24 Q120 18 144 24 L140 76 L100 76 Z" fill="url(#sw)"/><path d="M100 164 L140 164 L144 222 Q120 228 96 222 Z" fill="url(#sw)"/>
      ${[186, 198, 210].map((y) => `<circle cx="120" cy="${y}" r="2.6" fill="${sh(c, -0.4)}"/>`).join('')}
      <rect x="72" y="66" width="96" height="108" rx="26" fill="url(#swm)"/><rect x="78" y="72" width="84" height="96" rx="21" fill="#07080b"/>
      <circle cx="120" cy="120" r="30" fill="none" stroke="${w}" stroke-width="6" stroke-dasharray="140 60" transform="rotate(-90 120 120)"/><circle cx="120" cy="120" r="21" fill="none" stroke="#46e08f" stroke-width="5" stroke-dasharray="90 50" transform="rotate(-90 120 120)"/>
      <text x="120" y="125" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#fff">10:09</text><rect x="168" y="102" width="6" height="18" rx="2" fill="url(#swm)"/>`;
  };
  D.speaker = (o) => {
    const c = o.c, a = o.c2 || '#2bd46a';
    return `<defs>${mat('sp', c, 'fabric')}${rad('cone', [[0, '#4a4f58'], [0.7, '#15171b'], [1, '#2a2d33']], 0.45, 0.4, 0.6)}</defs>${shadow(120, 206, 66, 7)}
      <rect x="70" y="30" width="100" height="172" rx="22" fill="url(#sp)"/>
      ${Array.from({ length: 70 }, (_, i) => `<circle cx="${80 + (i % 10) * 9}" cy="${42 + Math.floor(i / 10) * 9}" r="1.3" fill="${sh(c, -0.35)}"/>`).join('')}
      <circle cx="120" cy="146" r="34" fill="url(#cone)"/><circle cx="120" cy="146" r="12" fill="#22252b"/><circle cx="115" cy="141" r="4" fill="#fff" opacity=".18"/>
      <rect x="100" y="188" width="40" height="4" rx="2" fill="${a}"/>${gloss('M76 40 Q80 34 92 34 L88 190 Q76 180 76 40 Z', 0.12)}`;
  };
  // ======== hobi ========
  D.bike = (o) => {
    const c = o.c, m = o.metal || 'silver';
    const wheel = (x) => `<circle cx="${x}" cy="150" r="42" fill="none" stroke="#17191d" stroke-width="7"/><circle cx="${x}" cy="150" r="36" fill="none" stroke="url(#bm)" stroke-width="2"/>${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<line x1="${x}" y1="150" x2="${x + Math.cos(a) * 36}" y2="${150 + Math.sin(a) * 36}" stroke="#9aa0ab" stroke-width=".8"/>`; }).join('')}<circle cx="${x}" cy="150" r="5" fill="url(#bm)"/>`;
    return `<defs>${lin('bf', [[0, sh(c, 0.35)], [1, sh(c, -0.3)]])}${metal('bm', m)}</defs>${shadow(120, 198, 104, 6)}
      ${wheel(54)}${wheel(186)}
      <path d="M54 150 L100 150 L86 92 M100 150 L150 96 L86 96 M150 96 L186 150 M86 92 L80 80" fill="none" stroke="url(#bf)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M150 96 L144 74" stroke="url(#bm)" stroke-width="5" stroke-linecap="round"/><path d="M136 72 Q148 66 162 74" fill="none" stroke="#17191d" stroke-width="5" stroke-linecap="round"/>
      <path d="M66 78 Q80 72 96 78" fill="none" stroke="#17191d" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="150" r="9" fill="url(#bm)"/>
      <text x="108" y="110" font-family="Arial Black,Arial" font-size="8" font-weight="900" fill="#fff" transform="rotate(-38 120 110)">${o.m || ''}</text>`;
  };
  D.guitar = (o) => {
    const c = o.c, m = o.metal || 'silver', el = o.v % 2;
    const body = el ? 'M120 112 Q96 104 82 124 Q62 140 74 168 Q80 186 74 200 Q100 222 132 214 Q162 214 168 190 Q170 176 160 162 Q178 150 166 130 Q154 110 132 118 Z' : 'M120 104 Q84 100 80 132 Q78 146 90 154 Q66 168 72 196 Q84 222 120 222 Q156 222 168 196 Q174 168 150 154 Q162 146 160 132 Q156 100 120 104 Z';
    return `<defs>${lin('gb', [[0, sh(c, 0.35)], [0.55, c], [1, sh(c, -0.45)]], 0, 0, 1, 1)}${metal('gm2', m)}</defs>${shadow(120, 226, 52, 5)}
      <rect x="114" y="16" width="12" height="100" rx="3" fill="${sh('#6b4423', -0.2)}"/><path d="M110 4 L130 4 L128 24 L112 24 Z" fill="#2a1a10"/>
      ${[8, 14, 20].map((y) => `<circle cx="108" cy="${y}" r="2.5" fill="url(#gm2)"/><circle cx="132" cy="${y}" r="2.5" fill="url(#gm2)"/>`).join('')}
      <path d="${body}" fill="url(#gb)"/>${el ? `<rect x="104" y="150" width="32" height="10" rx="2" fill="url(#gm2)"/><rect x="104" y="172" width="32" height="10" rx="2" fill="url(#gm2)"/>` : `<circle cx="120" cy="160" r="15" fill="#1a120c"/><circle cx="120" cy="160" r="17" fill="none" stroke="${sh(c, 0.4)}" stroke-width="1.5"/>`}
      <rect x="108" y="198" width="24" height="5" rx="2" fill="#2a1a10"/>${[116, 119, 121, 124].map((x) => `<line x1="${x}" y1="20" x2="${x}" y2="200" stroke="#e8e4da" stroke-width=".7"/>`).join('')}
      ${gloss(el ? 'M86 132 Q96 116 112 116 Q96 130 92 160 Z' : 'M88 134 Q94 110 116 108 Q96 124 94 146 Z', 0.3)}`;
  };
  D.chess = (o) => {
    const c = o.c, w = o.c2 || '#f1e6cf';
    let sq = ''; for (let r = 0; r < 4; r++) for (let k = 0; k < 8; k++) { const x = 30 + k * 22.5 - r * 6, y = 140 + r * 16; sq += `<path d="M${x} ${y} l22.5 0 l-6 16 l-22.5 0 Z" fill="${(r + k) % 2 ? c : w}"/>`; }
    const piece = (x, y, col, h) => `<path d="M${x - 9} ${y} Q${x - 9} ${y - 6} ${x - 5} ${y - 8} L${x - 3} ${y - h} Q${x} ${y - h - 10} ${x + 3} ${y - h} L${x + 5} ${y - 8} Q${x + 9} ${y - 6} ${x + 9} ${y} Z" fill="${col}"/><circle cx="${x}" cy="${y - h - 6}" r="6" fill="${col}"/>`;
    return `<defs>${lin('cbx', [[0, sh(c, 0.2)], [1, sh(c, -0.4)]])}</defs>${shadow(120, 214, 110, 6)}
      <path d="M24 136 L216 136 L194 206 L2 206 Z" fill="url(#cbx)"/>${sq}
      ${piece(70, 150, sh(w, -0.05), 30)}${piece(104, 146, sh(w, -0.05), 40)}${piece(150, 166, sh(c, -0.5), 34)}${piece(176, 150, sh(c, -0.5), 26)}`;
  };
  // ======== ev ve dekor ========
  D.sofa = (o) => {
    const c = o.c, wd = o.c2 || '#4a3322';
    return `<defs>${mat('sf', c, 'fabric')}${lin('sfb', [[0, sh(c, -0.1)], [1, sh(c, -0.4)]])}</defs>${shadow(120, 196, 108, 7, 0.28)}
      <rect x="34" y="62" width="172" height="80" rx="18" fill="url(#sfb)"/>
      <rect x="14" y="96" width="40" height="90" rx="16" fill="url(#sf)"/><rect x="186" y="96" width="40" height="90" rx="16" fill="url(#sf)"/>
      <rect x="48" y="122" width="144" height="58" rx="12" fill="url(#sf)"/><path d="M120 124 L120 178" stroke="${sh(c, -0.35)}" stroke-width="2"/>
      <rect x="52" y="74" width="62" height="54" rx="14" fill="${sh(c, 0.06)}"/><rect x="126" y="74" width="62" height="54" rx="14" fill="${sh(c, 0.03)}"/>
      <rect x="28" y="184" width="8" height="12" rx="2" fill="${wd}"/><rect x="204" y="184" width="8" height="12" rx="2" fill="${wd}"/>
      ${gloss('M56 78 Q60 74 74 74 L66 120 Q56 112 56 78 Z', 0.14)}`;
  };
  D.painting = (o) => {
    const m = o.metal || 'gold', a = o.c, b = o.c2 || '#1e5bd8', v = o.v % 3;
    const art = v === 0 ? `<rect x="46" y="46" width="148" height="148" fill="${sh(a, 0.75)}"/><circle cx="96" cy="100" r="34" fill="${a}"/><rect x="118" y="112" width="58" height="62" fill="${b}"/><path d="M56 180 Q120 120 186 150" stroke="#14161b" stroke-width="5" fill="none"/>` : v === 1 ? `<rect x="46" y="46" width="148" height="148" fill="${mix(b, '#ffffff', 0.5)}"/><path d="M46 150 Q90 110 130 140 Q160 160 194 130 L194 194 L46 194 Z" fill="${b}"/><path d="M46 170 Q100 140 150 170 Q170 180 194 168 L194 194 L46 194 Z" fill="${sh(b, -0.3)}"/><circle cx="150" cy="86" r="18" fill="${a}"/>` : `<rect x="46" y="46" width="148" height="148" fill="#efe9de"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${52 + (i % 3) * 47}" y="${52 + Math.floor(i / 3) * 47}" width="${36 + (i % 2) * 6}" height="${36 + (i % 3) * 4}" fill="${[a, b, '#14161b', '#ffcf3f'][i % 4]}" opacity=".9"/>`).join('')}`;
    return `<defs>${metal('pf', m, false)}</defs>${shadow(120, 218, 90, 6, 0.18)}
      <rect x="30" y="30" width="180" height="180" fill="url(#pf)"/><rect x="40" y="40" width="160" height="160" fill="${sh(METAL[m][2], -0.3)}"/>${art}
      <path d="M46 46 L120 46 L46 120 Z" fill="#fff" opacity=".06"/>`;
  };
  D.lamp = (o) => {
    const c = o.c, m = o.metal || 'gold';
    return `<defs>${lin('lp', [[0, sh(c, 0.35)], [1, sh(c, -0.25)]], 0, 0, 1, 0)}${metal('lm', m)}${rad('glow', [[0, '#fff6c8', 0.9], [1, '#fff6c8', 0]], 0.5, 0.5, 0.5)}</defs>${shadow(120, 214, 46, 6)}
      <ellipse cx="120" cy="96" rx="70" ry="56" fill="url(#glow)"/>
      <path d="M84 44 L156 44 L176 116 L64 116 Z" fill="url(#lp)"/><path d="M64 116 L176 116" stroke="${sh(c, -0.3)}" stroke-width="3"/>
      <rect x="116" y="116" width="8" height="80" fill="url(#lm)"/><ellipse cx="120" cy="204" rx="34" ry="8" fill="url(#lm)"/>
      <ellipse cx="120" cy="116" rx="40" ry="5" fill="#fff6c8" opacity=".7"/>`;
  };
  D.coffee = (o) => {
    const c = o.c, m = o.metal || 'silver';
    return `<defs>${mat('cf', c, 'gloss')}${metal('cfm', m)}</defs>${shadow(120, 210, 70, 7)}
      <rect x="56" y="30" width="128" height="40" rx="10" fill="url(#cf)"/><rect x="56" y="64" width="44" height="140" rx="8" fill="url(#cf)"/>
      <rect x="56" y="188" width="128" height="18" rx="6" fill="url(#cfm)"/><rect x="104" y="70" width="70" height="14" rx="4" fill="url(#cfm)"/>
      <rect x="128" y="84" width="22" height="12" rx="3" fill="#14161b"/><path d="M126 146 L152 146 L148 182 L130 182 Z" fill="#f4f1ea"/><path d="M152 154 Q162 156 160 166 Q158 172 150 172" fill="none" stroke="#f4f1ea" stroke-width="3"/>
      <path d="M134 120 Q138 110 134 100 M144 122 Q148 112 144 102" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/>
      <circle cx="78" cy="48" r="7" fill="url(#cfm)"/><circle cx="160" cy="50" r="4" fill="#46e08f"/>${gloss('M60 70 Q64 66 74 66 L70 190 Q60 180 60 70 Z', 0.25)}`;
  };
  D.gamechair = (o) => {
    const c = o.c, a = o.c2 || '#e5383b';
    return `<defs>${mat('gc', c, 'leather')}</defs>${shadow(120, 214, 64, 6)}
      <path d="M84 20 Q120 10 156 20 L162 120 L78 120 Z" fill="url(#gc)"/><path d="M100 30 L140 30 L144 110 L96 110 Z" fill="${a}" opacity=".9"/><rect x="104" y="40" width="32" height="14" rx="4" fill="${sh(c, -0.3)}"/>
      <rect x="70" y="120" width="100" height="30" rx="10" fill="url(#gc)"/><rect x="56" y="106" width="16" height="40" rx="5" fill="${sh(c, -0.3)}"/><rect x="168" y="106" width="16" height="40" rx="5" fill="${sh(c, -0.3)}"/>
      <rect x="114" y="150" width="12" height="32" fill="#8a8f98"/>${[-46, -22, 0, 22, 46].map((d) => `<path d="M120 184 L${120 + d} 200" stroke="#2a2d33" stroke-width="7" stroke-linecap="round"/><circle cx="${120 + d}" cy="204" r="5" fill="#15171b"/>`).join('')}
      ${gloss('M90 26 Q100 18 116 18 L104 108 Q90 96 90 26 Z', 0.15)}`;
  };
  // ======== çocuk ========
  D.toycar = (o) => {
    const c = o.c, a = o.c2 || '#ffcf3f';
    return `<defs>${mat('tc', c, 'gloss')}</defs>${shadow(120, 186, 96, 6)}
      <path d="M30 156 Q28 126 56 118 L84 112 Q100 82 140 82 Q176 84 192 114 L212 122 Q226 128 224 156 Z" fill="url(#tc)"/>
      <path d="M96 114 Q108 92 138 92 Q166 94 178 116 Z" fill="#bfe0f6"/><path d="M136 92 L136 116" stroke="${c}" stroke-width="4"/>
      <path d="M40 140 L216 140" stroke="${a}" stroke-width="5"/><text x="126" y="136" text-anchor="middle" font-family="Arial Black,Arial" font-size="12" font-weight="900" fill="${a}">${(o.v % 9) + 1}</text>
      ${[70, 182].map((x) => `<circle cx="${x}" cy="160" r="22" fill="#15171b"/><circle cx="${x}" cy="160" r="11" fill="#c9ced6"/><circle cx="${x}" cy="160" r="4" fill="#5d6470"/>`).join('')}
      ${gloss('M60 124 Q90 112 120 112 Q90 122 66 134 Z', 0.4)}`;
  };
  D.plush = (o) => {
    const c = o.c, a = o.c2 || sh(c, 0.35);
    return `<defs>${rad('pl', [[0, sh(c, 0.3)], [0.8, c], [1, sh(c, -0.25)]], 0.45, 0.4, 0.6)}</defs>${shadow(120, 210, 64, 7)}
      <circle cx="78" cy="58" r="20" fill="url(#pl)"/><circle cx="162" cy="58" r="20" fill="url(#pl)"/><circle cx="78" cy="58" r="10" fill="${a}"/><circle cx="162" cy="58" r="10" fill="${a}"/>
      <ellipse cx="120" cy="160" rx="58" ry="52" fill="url(#pl)"/><ellipse cx="120" cy="168" rx="32" ry="30" fill="${a}"/>
      <ellipse cx="72" cy="196" rx="22" ry="16" fill="url(#pl)"/><ellipse cx="168" cy="196" rx="22" ry="16" fill="url(#pl)"/><ellipse cx="68" cy="140" rx="16" ry="24" fill="url(#pl)" transform="rotate(25 68 140)"/><ellipse cx="172" cy="140" rx="16" ry="24" fill="url(#pl)" transform="rotate(-25 172 140)"/>
      <circle cx="120" cy="86" r="46" fill="url(#pl)"/><ellipse cx="120" cy="100" rx="20" ry="15" fill="${a}"/><ellipse cx="120" cy="94" rx="7" ry="5" fill="#2a1a10"/>
      <circle cx="102" cy="78" r="5" fill="#14100c"/><circle cx="138" cy="78" r="5" fill="#14100c"/><circle cx="103.5" cy="76.5" r="1.6" fill="#fff"/><circle cx="139.5" cy="76.5" r="1.6" fill="#fff"/>
      <path d="M112 106 Q120 112 128 106" stroke="#2a1a10" stroke-width="2" fill="none"/><path d="M104 132 Q120 140 136 132 L130 146 L120 138 L110 146 Z" fill="${o.c3 || '#e5383b'}"/>`;
  };

  // ======== araçlar (showroom fonu, zeminde yansıma) ========
  // v: 0 hatchback, 1 sedan, 2 SUV, 3 coupe, 4 spor/süper, 5 klasik, 6 cabrio, 7 pickup
  const CAR = [
    { b: 'M26 150 L28 124 Q32 108 52 104 L80 100 Q98 74 128 72 L156 72 Q176 74 190 98 L214 104 Q228 110 228 130 L228 150 Z', g: 'M88 100 Q102 80 128 80 L150 80 Q168 82 180 100 Z', w: [70, 192], r: 21 },
    { b: 'M14 150 L16 128 Q20 114 40 110 L76 104 Q96 78 126 76 L160 76 Q182 78 200 102 L222 108 Q232 114 232 132 L232 150 Z', g: 'M84 104 Q100 84 126 84 L156 84 Q176 86 192 104 Z', w: [64, 196], r: 21 },
    { b: 'M16 154 L16 116 Q18 98 38 94 L66 92 Q82 64 110 62 L170 62 Q192 64 206 92 L224 96 Q236 102 236 124 L236 154 Z', g: 'M74 92 Q88 70 112 70 L166 70 Q184 72 196 92 Z', w: [64, 194], r: 25 },
    { b: 'M16 150 L18 130 Q22 118 44 114 L84 106 Q112 80 146 80 Q176 82 198 104 L222 110 Q234 116 234 134 L234 150 Z', g: 'M94 106 Q118 88 146 88 Q166 90 184 106 Z', w: [64, 196], r: 21 },
    { b: 'M10 146 Q12 128 34 124 L80 116 Q116 86 156 88 Q190 92 212 112 L230 118 Q240 124 238 140 L238 146 Z', g: 'M96 116 Q122 96 156 96 Q178 98 196 114 Z', w: [62, 198], r: 20 },
    { b: 'M14 150 Q12 130 34 126 L64 124 Q82 92 120 90 L164 90 Q190 92 204 120 L226 124 Q238 128 236 150 Z', g: 'M88 124 Q100 98 122 98 L162 98 Q182 100 192 122 Z', w: [62, 196], r: 21 },
    { b: 'M14 150 L16 130 Q20 118 42 114 L86 110 L104 92 L112 110 L208 110 L222 114 Q234 118 234 136 L234 150 Z', g: 'M98 110 L106 96 L110 110 Z', w: [64, 196], r: 21 },
    { b: 'M12 152 L14 116 Q18 100 38 98 L70 96 Q86 70 112 68 L136 68 Q150 70 156 96 L234 98 L236 152 Z', g: 'M78 96 Q92 76 114 76 L132 76 Q144 78 148 96 Z', w: [62, 196], r: 25 },
  ];
  D.car = (o) => {
    const c = o.c, m = o.metal || 'silver', S = CAR[o.v % CAR.length];
    const wheel = (x) => { const y = 150; return `<circle cx="${x}" cy="${y}" r="${S.r + 3}" fill="#0b0c0e"/><circle cx="${x}" cy="${y}" r="${S.r - 4}" fill="url(#rim)"/>${Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5; return `<line x1="${x + Math.cos(a) * 5}" y1="${y + Math.sin(a) * 5}" x2="${x + Math.cos(a) * (S.r - 5)}" y2="${y + Math.sin(a) * (S.r - 5)}" stroke="${sh(METAL[m][2], -0.2)}" stroke-width="2.4"/>`; }).join('')}<circle cx="${x}" cy="${y}" r="5" fill="url(#rim)"/><circle cx="${x}" cy="${y}" r="${S.r - 4}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.5"/>`; };
    return `<g transform="translate(0 28)"><defs>${lin('pnt', [[0, sh(c, 0.55)], [0.22, sh(c, 0.15)], [0.45, c], [0.62, sh(c, -0.25)], [0.66, sh(c, 0.05)], [1, sh(c, -0.55)]])}${lin('gls', [[0, '#cfe3f5'], [0.45, '#5b7fa6'], [1, '#1b2737']], 0, 0, 0.4, 1)}${metal('rim', m)}${lin('refl', [[0, c, 0.35], [1, c, 0]])}</defs>
      <ellipse cx="124" cy="176" rx="118" ry="10" fill="#000" opacity=".55" filter="url(#blur6)"/>
      <g transform="translate(0 344) scale(1 -1)" opacity=".25"><path d="${S.b}" fill="url(#refl)"/></g>
      <path d="${S.b}" fill="url(#pnt)"/>
      ${o.v % CAR.length === 6 ? `<path d="M98 112 Q108 104 120 108" stroke="#111" stroke-width="3" fill="none"/>` : `<path d="${S.g}" fill="url(#gls)"/><path d="${S.g}" fill="none" stroke="${sh(c, -0.5)}" stroke-width="2"/>`}
      <path d="M30 128 L228 128" stroke="${sh(c, 0.6)}" stroke-width="1.6" opacity=".55"/><path d="M28 140 L230 140" stroke="${sh(c, -0.5)}" stroke-width="1.2" opacity=".5"/>
      <rect x="${S.w[0] + 40}" y="114" width="14" height="3" rx="1.5" fill="${sh(c, -0.55)}"/><rect x="${S.w[0] + 82}" y="114" width="14" height="3" rx="1.5" fill="${sh(c, -0.55)}"/>
      <path d="M222 118 Q232 120 232 128 L224 128 Z" fill="#fff8d6"/><path d="M18 120 Q14 126 16 132 L24 132 L24 120 Z" fill="#e5383b"/>
      ${gloss('M60 108 Q120 94 200 104 L200 108 Q120 100 60 112 Z', 0.35)}
      ${wheel(S.w[0])}${wheel(S.w[1])}
      <text x="${(S.w[0] + S.w[1]) / 2}" y="138" text-anchor="middle" font-family="Arial Black,Arial" font-size="7" font-weight="900" fill="${sh(c, 0.6)}" opacity=".6">${o.m || ''}</text></g>`;
  };
  D.moto = (o) => {
    const c = o.c, m = o.metal || 'silver';
    const wh = (x) => `<circle cx="${x}" cy="156" r="30" fill="#0b0c0e"/><circle cx="${x}" cy="156" r="20" fill="url(#mr)"/><circle cx="${x}" cy="156" r="6" fill="#222"/>`;
    return `<defs>${lin('mp', [[0, sh(c, 0.5)], [0.5, c], [1, sh(c, -0.45)]])}${metal('mr', m)}</defs><ellipse cx="120" cy="190" rx="100" ry="8" fill="#000" opacity=".5" filter="url(#blur6)"/>
      ${wh(52)}${wh(190)}<path d="M52 156 L96 120 L160 120 L190 156" fill="none" stroke="url(#mr)" stroke-width="6"/>
      <path d="M88 118 Q100 92 140 94 L170 104 Q160 120 132 126 L96 128 Z" fill="url(#mp)"/><path d="M96 96 L74 92 Q66 92 64 100 L90 108 Z" fill="#17191d"/>
      <rect x="104" y="124" width="40" height="22" rx="6" fill="url(#mr)"/><path d="M170 104 L184 82 L196 84" fill="none" stroke="url(#mr)" stroke-width="5" stroke-linecap="round"/>
      <path d="M40 140 L80 140" stroke="url(#mr)" stroke-width="5"/>${gloss('M100 100 Q120 94 150 98 L146 104 Q120 100 102 106 Z', 0.4)}`;
  };
  D.scooter = (o) => {
    const c = o.c;
    return `<defs>${lin('scp', [[0, sh(c, 0.4)], [1, sh(c, -0.35)]])}</defs><ellipse cx="120" cy="196" rx="80" ry="7" fill="#000" opacity=".45" filter="url(#blur6)"/>
      <circle cx="62" cy="176" r="16" fill="#0b0c0e"/><circle cx="182" cy="176" r="16" fill="#0b0c0e"/><circle cx="62" cy="176" r="7" fill="#9aa0ab"/><circle cx="182" cy="176" r="7" fill="#9aa0ab"/>
      <path d="M62 176 L176 176 L182 170 L70 168 Z" fill="url(#scp)"/><path d="M176 172 L160 50" stroke="url(#scp)" stroke-width="7" stroke-linecap="round"/><path d="M144 50 L178 48" stroke="#17191d" stroke-width="6" stroke-linecap="round"/>`;
  };
  D.yacht = (o) => {
    const c = o.c || '#f4f6f8';
    return `<defs>${lin('sea', [[0, '#2f8fd8'], [1, '#0d3f73']])}${lin('hull', [[0, '#ffffff'], [0.6, '#dfe5ec'], [1, '#9aa6b4']])}${lin('skyY', [[0, '#8fd0ff'], [1, '#e9f6ff']])}</defs>
      <rect width="240" height="150" fill="url(#skyY)"/><rect y="150" width="240" height="90" fill="url(#sea)"/>
      ${[160, 178, 198, 220].map((y, i) => `<path d="M0 ${y} Q60 ${y - 4} 120 ${y} T240 ${y}" stroke="#fff" stroke-opacity="${0.25 - i * 0.04}" stroke-width="2" fill="none"/>`).join('')}
      <path d="M14 150 L34 172 L210 172 Q228 160 232 146 Z" fill="url(#hull)"/><path d="M30 166 L214 166" stroke="${c === '#f4f6f8' ? '#1b2a4a' : c}" stroke-width="5"/>
      <path d="M50 146 L70 122 L190 122 L210 146 Z" fill="#f7f9fb"/><path d="M78 122 L92 102 L168 102 L180 122 Z" fill="#eef2f6"/><path d="M100 102 L110 88 L150 88 L158 102 Z" fill="#e6ebf1"/>
      <path d="M74 140 L198 140" stroke="#1d2b3c" stroke-width="7"/><path d="M90 118 L176 118" stroke="#1d2b3c" stroke-width="6"/><path d="M110 98 L156 98" stroke="#1d2b3c" stroke-width="5"/>
      <path d="M14 182 Q120 196 232 182 L232 188 Q120 202 14 188 Z" fill="#fff" opacity=".18"/>`;
  };
  D.jet = (o) => {
    const c = o.c || '#1b2a4a';
    return `<defs>${lin('skyJ', [[0, '#3f7fd8'], [0.7, '#a9d4ff'], [1, '#f2f8ff']])}${lin('fus', [[0, '#ffffff'], [0.55, '#e3e8ef'], [1, '#9aa5b4']])}</defs>
      <rect width="240" height="240" fill="url(#skyJ)"/><g fill="#fff" opacity=".85"><ellipse cx="50" cy="200" rx="60" ry="16"/><ellipse cx="190" cy="210" rx="70" ry="18"/><ellipse cx="120" cy="222" rx="80" ry="14"/></g>
      <path d="M20 118 Q20 104 40 102 L186 100 Q222 102 230 116 Q222 128 186 130 L40 130 Q20 130 20 118 Z" fill="url(#fus)"/>
      <path d="M96 116 L150 116 L120 168 L100 168 Z" fill="#cfd6df"/><path d="M40 104 L22 74 L36 74 L62 102 Z" fill="${c}"/><path d="M30 112 L12 104 L18 98 L40 106 Z" fill="#cfd6df"/>
      ${Array.from({ length: 8 }, (_, i) => `<rect x="${86 + i * 12}" y="108" width="7" height="6" rx="2" fill="#2a3442"/>`).join('')}<path d="M200 106 Q216 108 220 114 L204 114 Z" fill="#2a3442"/>
      <path d="M40 124 L200 124" stroke="${c}" stroke-width="4"/><rect x="58" y="96" width="30" height="12" rx="6" fill="#d8dee6"/>`;
  };
  // ======== evler (gökyüzü, peyzaj; mimari tarz) ========
  // v: 0 apartman dairesi, 1 çatı katı (gece), 2 modern villa + havuz, 3 klasik malikâne, 4 dağ evi, 5 sahil evi, 6 özel ada, 7 loft
  D.house = (o) => {
    const v = o.v % 8, c = o.c || '#e9e1d4', a = o.c2 || '#2e3a4a';
    const sky = { 1: ['#0a1433', '#36507f'], 3: ['#ffb36b', '#ffe3b5'], 4: ['#7fb7e8', '#e8f4ff'], 6: ['#5ec8ff', '#d6f3ff'] }[v] || ['#7cc0f5', '#e6f4ff'];
    const win = (x, y, w, h, n, m2, lit) => { let s = ''; for (let i = 0; i < n; i++) for (let j = 0; j < m2; j++) s += `<rect x="${x + i * (w + 5)}" y="${y + j * (h + 7)}" width="${w}" height="${h}" rx="1" fill="${lit && (i * 3 + j) % 4 ? '#ffd76a' : 'url(#glh)'}"/>`; return s; };
    const tree = (x, y, s = 1) => `<rect x="${x - 2 * s}" y="${y}" width="${4 * s}" height="${16 * s}" fill="#5a3d26"/><circle cx="${x}" cy="${y - 4 * s}" r="${13 * s}" fill="#2f8a45"/><circle cx="${x - 6 * s}" cy="${y}" r="${9 * s}" fill="#277a3c"/><circle cx="${x + 5 * s}" cy="${y - 10 * s}" r="${7 * s}" fill="#3aa055"/>`;
    const palm = (x, y) => `<path d="M${x} ${y} Q${x + 4} ${y - 30} ${x + 2} ${y - 58}" stroke="#7a5532" stroke-width="5" fill="none"/>${[-60, -20, 20, 60, 100].map((d) => `<path d="M${x + 2} ${y - 58} q${Math.cos((d * Math.PI) / 180) * 24} ${-8 + Math.abs(d) / 6} ${Math.cos((d * Math.PI) / 180) * 34} ${12}" stroke="#2f8a45" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}`;
    let B = '';
    if (v === 0) B = `<rect x="0" y="200" width="240" height="40" fill="#8fbf6a"/><rect x="0" y="200" width="240" height="10" fill="#b9bec7"/><rect x="40" y="60" width="160" height="140" fill="url(#wall)"/><rect x="40" y="56" width="160" height="8" fill="${sh(c, -0.3)}"/>${win(54, 74, 22, 18, 5, 4)}<rect x="108" y="170" width="24" height="30" fill="${a}"/>${[0, 1, 2, 3].map((j) => `<rect x="50" y="${96 + j * 25}" width="140" height="3" fill="${sh(c, -0.25)}"/>`).join('')}${tree(24, 186)}${tree(216, 186)}`;
    else if (v === 1) B = `${Array.from({ length: 34 }, (_, i) => `<circle cx="${(i * 71) % 240}" cy="${(i * 37) % 90}" r="${i % 3 ? 0.8 : 1.3}" fill="#fff" opacity=".8"/>`).join('')}<rect x="8" y="120" width="44" height="100" fill="#1b2a4a"/>${win(12, 126, 6, 7, 4, 9, 1)}<rect x="190" y="100" width="46" height="120" fill="#1b2a4a"/>${win(194, 106, 7, 7, 4, 11, 1)}<rect x="70" y="40" width="100" height="180" fill="#22355e"/>${win(76, 76, 10, 9, 7, 9, 1)}<rect x="64" y="34" width="112" height="34" rx="2" fill="#ffd76a" opacity=".95"/><rect x="76" y="42" width="88" height="18" fill="#fff3c4" opacity=".7"/><rect x="64" y="30" width="112" height="4" fill="#cfd6df"/>`;
    else if (v === 2) B = `<rect x="0" y="176" width="240" height="64" fill="#e9dcc3"/><rect x="26" y="98" width="190" height="78" fill="url(#wall)"/><rect x="26" y="92" width="190" height="8" fill="${sh(c, -0.2)}"/><rect x="104" y="66" width="112" height="32" fill="${sh(c, 0.04)}"/><rect x="104" y="62" width="112" height="6" fill="${sh(c, -0.2)}"/><rect x="36" y="108" width="62" height="52" fill="url(#glh)"/><rect x="112" y="108" width="94" height="52" fill="url(#glh)"/><rect x="116" y="72" width="88" height="20" fill="url(#glh)"/><rect x="44" y="190" width="160" height="30" rx="4" fill="#35b7e6"/><path d="M50 198 Q120 192 196 200" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>${palm(226, 178)}${palm(14, 176)}`;
    else if (v === 3) B = `<rect x="0" y="182" width="240" height="58" fill="#4f9a4c"/><path d="M110 240 L130 240 L124 182 L116 182 Z" fill="#e6d7b8"/><rect x="30" y="100" width="180" height="82" fill="url(#wall)"/><path d="M20 104 L120 50 L220 104 Z" fill="${a}"/>${[48, 78, 108, 138, 168].map((x) => `<rect x="${x}" y="112" width="8" height="70" fill="#f7f2e6"/>`).join('')}${win(40, 116, 16, 22, 1, 2)}${win(184, 116, 16, 22, 1, 2)}<rect x="110" y="150" width="20" height="32" fill="#6b4a2b"/><path d="M96 104 L120 84 L144 104 Z" fill="${sh(c, 0.1)}"/>${tree(14, 182, 1.2)}${tree(226, 182, 1.2)}`;
    else if (v === 4) B = `<path d="M0 130 L50 70 L90 110 L140 50 L200 120 L240 90 L240 200 L0 200 Z" fill="#9fb3c8"/><path d="M40 82 L50 70 L60 82 Z M128 64 L140 50 L152 64 Z" fill="#fff"/><rect x="0" y="180" width="240" height="60" fill="#f4f8fb"/><rect x="58" y="120" width="124" height="66" fill="#8a5a32"/>${Array.from({ length: 6 }, (_, i) => `<rect x="58" y="${124 + i * 11}" width="124" height="2" fill="#6e4524"/>`).join('')}<path d="M44 124 L120 72 L196 124 Z" fill="#5a3a22"/><path d="M44 124 L120 72 L196 124 L190 128 L120 80 L50 128 Z" fill="#fff"/>${win(70, 134, 20, 18, 2, 1, 1)}${win(150, 134, 20, 18, 1, 1, 1)}<rect x="110" y="152" width="20" height="34" fill="#3a2414"/>${tree(24, 184, 1.1)}${tree(216, 184, 1.1)}`;
    else if (v === 5) B = `<rect x="0" y="150" width="240" height="40" fill="#2f8fd8"/><rect x="0" y="186" width="240" height="54" fill="#efd9a8"/><rect x="50" y="110" width="140" height="70" fill="url(#wall)"/><path d="M40 114 L120 82 L200 114 Z" fill="${a}"/><rect x="40" y="176" width="160" height="8" fill="#c79a5b"/>${[56, 96, 136, 176].map((x) => `<rect x="${x}" y="176" width="4" height="22" fill="#a77a43"/>`).join('')}<rect x="62" y="124" width="116" height="40" fill="url(#glh)"/>${palm(26, 196)}${palm(214, 196)}`;
    else if (v === 6) B = `<rect x="0" y="120" width="240" height="120" fill="#1fa2d6"/><path d="M0 140 Q120 125 240 142 V240 H0z" fill="#1891c4"/><ellipse cx="120" cy="166" rx="100" ry="26" fill="#f0dca8"/><ellipse cx="120" cy="158" rx="80" ry="20" fill="#5cb85c"/><rect x="92" y="128" width="62" height="28" fill="#fbf8f2"/><rect x="98" y="134" width="50" height="14" fill="url(#glh)"/><path d="M88 130 L123 116 L158 130 Z" fill="#c9a36b"/>${palm(64, 160)}${palm(176, 158)}<path d="M150 186 L210 186" stroke="#fff" stroke-width="4"/>`;
    else B = `<rect x="0" y="190" width="240" height="50" fill="#5d6470"/><rect x="34" y="60" width="172" height="132" fill="#8a3b2a"/>${Array.from({ length: 22 }, (_, j) => `<rect x="34" y="${62 + j * 6}" width="172" height="1" fill="#6e2c1f"/>`).join('')}${win(46, 74, 30, 34, 4, 2)}<rect x="104" y="156" width="32" height="36" fill="#14161b"/><rect x="34" y="56" width="172" height="6" fill="#3a2a22"/>`;
    return `<defs>${lin('skyH', [[0, sky[0]], [1, sky[1]]])}${lin('wall', [[0, sh(c, 0.12)], [1, sh(c, -0.18)]], 0, 0, 1, 0)}${lin('glh', [[0, '#d7ecff'], [0.5, '#7fb2e0'], [1, '#3c6a99']], 0, 0, 1, 1)}</defs><rect width="240" height="240" fill="url(#skyH)"/>${B}`;
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
      try { svg = frame(f(o), (o.show || ['car', 'moto', 'scooter'].includes(o.t)) ? ['#4a505c', '#14161b'] : o.lux ? ['#fbf7ef', '#e9e1d2'] : null); } catch (e) { svg = frame(''); }
      const u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      if (cache.size > 600) cache.clear();
      cache.set(k, u);
      return u;
    },
    shade: sh,
  };
})();
