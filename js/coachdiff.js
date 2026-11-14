// ---------- Teknik Direktör zorluk seviyeleri: Kolay / Orta / Zor ----------
// Orta, önceki (mevcut) dengenin aynısıdır; eski kayıtlar Orta olarak devam eder.
// Etkiler: maçta takımımızın etkin gücü, yönetimin sabrı (güven kaybı ve kovulma eşiği), kulübe gelişte bütçe.
// Meydan okumalar (Diamond senaryoları) kendi dengesiyle oynanır; zorluktan etkilenmez.
const CM_DIFF = {
  easy: { l: 'Kolay', d: 'Kolay: takımın sahada biraz daha güçlü, yönetim daha sabırlı, bütçe daha yüksek.', str: 5.5, loss: 0.6, sackConf: 6, slack: 4, money: 1.35 },
  normal: { l: 'Orta', d: 'Orta: dengeli, standart deneyim.', str: 0, loss: 1, sackConf: 12, slack: 2, money: 1 },
  hard: { l: 'Zor', d: 'Zor: rakipler daha zorlu, yönetim sabırsız, bütçe kısıtlı.', str: -2.5, loss: 1.15, sackConf: 12, slack: 1, money: 0.75 },
};
(() => {
  if (typeof Coach === 'undefined' || typeof Live === 'undefined') return;
  const key = () => (Coach.s && CM_DIFF[Coach.s.diff] ? Coach.s.diff : Coach._diff && CM_DIFF[Coach._diff] ? Coach._diff : 'normal');
  Coach.diff = () => CM_DIFF[key()];
  const inChallenge = () => !!(Coach.s && Coach.s.scn);

  // maç: takımımızın hücum ve savunma gücüne zorluk farkı (diğer takımların maçları etkilenmez)
  const lam0 = Live.lambdas.bind(Live);
  Live.lambdas = () => {
    const r = lam0();
    const d = inChallenge() ? 0 : Coach.diff().str;
    if (!d) return r;
    const k = Math.exp(d / 28);
    return [r[0] * k, r[1] / k, r[2]];
  };

  // yönetim: güven kaybı zorluğa göre yumuşar ya da sertleşir
  const am0 = Coach.afterMatch.bind(Coach);
  Coach.afterMatch = (m, res) => {
    const s = Coach.s, c0 = s ? s.conf : null;
    const out = am0(m, res);
    if (s && Coach.s === s && c0 != null && !inChallenge()) {
      const dl = s.conf - c0, k = Coach.diff().loss;
      if (dl < 0 && k !== 1) s.conf = U.clamp(c0 + dl * k, 0, 100);
    }
    return out;
  };

  // kovulma eşiği: Kolay daha geç, Zor daha erken
  const ck0 = Coach.checkSack.bind(Coach);
  Coach.checkSack = () => {
    const s = Coach.s;
    if (!s || inChallenge()) return ck0();
    const D = Coach.diff();
    if (D === CM_DIFF.normal) return ck0();
    if (s.conf > D.sackConf || s.round < 6 || s.phase === 'end' || s.jobless || Coach.myPos() <= s.target + D.slack) return false;
    // asıl kovulma akışını çalıştır (kendi eşiğini geçecek şekilde geçici değerlerle)
    const conf = s.conf, tgt = s.target;
    s.conf = Math.min(conf, 12);
    s.target = Math.min(tgt, Coach.myPos() - 3);
    let r;
    try { r = ck0(); } finally { if (Coach.s === s) { if (!r) s.conf = conf; s.target = tgt; } }
    return r;
  };

  // kulübe geliş: bütçe ve kasa zorluğa göre
  const jc0 = Coach.joinClub.bind(Coach);
  Coach.joinClub = (id, fresh) => {
    const out = jc0(id, fresh);
    const s = Coach.s, k = Coach.diff().money;
    if (s && k !== 1) {
      s.money = Math.round((s.money * k) / 1e5) * 1e5;
      s.budget = Math.round((s.budget * k) / 1e5) * 1e5;
    }
    return out;
  };

  // yeni kariyer: oluşturma ekranında zorluk seçimi
  const sel = (cur) => `<div class="seg cm-diff">${Object.entries(CM_DIFF).map(([k, v]) => `<button type="button" data-cmdiff="${k}" class="${k === cur ? 'on' : ''}">${v.l}</button>`).join('')}</div>`;
  const cr0 = Coach.create.bind(Coach);
  Coach.create = () => {
    Coach._diff = 'normal';
    cr0();
    const m = document.getElementById('modal');
    const last = m && U.$$('.cr-f', m).pop();
    if (!last) return;
    const row = U.el(`<div class="cr-f cm-diff-row"><span>Zorluk</span>${sel('normal')}<small class="muted" data-cmdiffd>${CM_DIFF.normal.d}</small></div>`);
    last.parentNode.insertBefore(row, last.nextSibling);
    if (typeof UI !== 'undefined' && UI.strip) UI.strip(row);
    U.$$('[data-cmdiff]', row).forEach((b) => (b.onclick = () => {
      Coach._diff = b.dataset.cmdiff;
      U.$$('[data-cmdiff]', row).forEach((x) => x.classList.toggle('on', x === b));
      const dd = row.querySelector('[data-cmdiffd]'); if (dd) dd.textContent = CM_DIFF[Coach._diff].d;
    }));
  };
  // oyuncu kariyerinden geçişte Orta ile başlar (Ayarlar'dan değiştirilebilir)
  const fp0 = Coach.fromPlayer.bind(Coach);
  Coach.fromPlayer = (p, legend) => { Coach._diff = 'normal'; return fp0(p, legend); };
  const st0 = Coach.start.bind(Coach);
  Coach.start = (o, clubId) => {
    const d = CM_DIFF[Coach._diff] ? Coach._diff : 'normal';
    Coach._diff = d;
    const out = st0(o, clubId);
    if (Coach.s) { Coach.s.diff = d; Coach.save(); }
    try { if (typeof Premium !== 'undefined' && Premium.track) Premium.track('td_diff', { d, at: 'new' }); } catch (e) { /* yok */ }
    return out;
  };

  // Ayarlar: zorluğu kariyer sırasında değiştirme
  const set0 = Coach.settings;
  Coach.settings = () => {
    set0();
    if (!Coach.s || inChallenge()) return;
    const m = document.getElementById('modal');
    const host = m && m.querySelector('.set-row');
    if (!host) return;
    const cur = key();
    const row = U.el(`<div class="set-row cm-diff-set"><span><b>Zorluk</b><small data-cmdiffd>${CM_DIFF[cur].d}</small></span>${sel(cur)}</div>`);
    host.parentNode.insertBefore(row, host);
    if (typeof UI !== 'undefined' && UI.strip) UI.strip(row);
    U.$$('[data-cmdiff]', row).forEach((b) => (b.onclick = () => {
      const d = b.dataset.cmdiff;
      if (Coach.s.diff === d) return;
      Coach.s.diff = d; Coach.save();
      U.$$('[data-cmdiff]', row).forEach((x) => x.classList.toggle('on', x === b));
      const dd = row.querySelector('[data-cmdiffd]'); if (dd) dd.textContent = CM_DIFF[d].d;
      Game.toast(`Zorluk: ${CM_DIFF[d].l}`, 'good');
      try { if (typeof Premium !== 'undefined' && Premium.track) Premium.track('td_diff', { d, at: 'settings' }); } catch (e) { /* yok */ }
    }));
  };
})();
