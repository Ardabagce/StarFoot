// Oyuncu: statlar, genel güç, antrenman ve gelişim

const STATS = [
  { k: 'pace', l: 'Hız', d: 'Top sürme anlarında ve baskı altında zaman kazandırır.' },
  { k: 'shooting', l: 'Şut', d: 'Şutun maksimum gücünü ve isabetini belirler.' },
  { k: 'passing', l: 'Pas', d: 'Pasların isabeti ve gücü.' },
  { k: 'dribbling', l: 'Top Sürme', d: 'Rakibi geçme anlarındaki başarı.' },
  { k: 'technique', l: 'Teknik', d: 'Falso kontrolü ve vuruş hassasiyeti.' },
  { k: 'heading', l: 'Kafa', d: 'Kafa vuruşları ve hava topları.' },
  { k: 'defending', l: 'Savunma', d: 'Top kapma ve müdahaleler.' },
  { k: 'physical', l: 'Güç', d: 'İkili mücadeleler, sakatlık direnci.' },
  { k: 'stamina', l: 'Dayanıklılık', d: 'Maçta harcanan enerji ve kondisyon.' },
];

const POSITIONS = {
  FW: { l: 'Forvet', short: 'FV', w: { shooting: 0.28, pace: 0.17, dribbling: 0.16, technique: 0.13, heading: 0.1, physical: 0.08, passing: 0.05, stamina: 0.03 } },
  MF: { l: 'Orta Saha', short: 'OS', w: { passing: 0.26, technique: 0.18, dribbling: 0.14, stamina: 0.12, shooting: 0.1, defending: 0.1, pace: 0.06, physical: 0.04 } },
  DF: { l: 'Defans', short: 'DF', w: { defending: 0.32, physical: 0.18, heading: 0.14, pace: 0.12, passing: 0.1, stamina: 0.08, technique: 0.06 } },
  // Kaleci (Premium+): hız = refleks, teknik = top tutma, kafa = hava topu, güç = uçuş
  GK: { l: 'Kaleci', short: 'KL', w: { pace: 0.22, technique: 0.2, physical: 0.16, heading: 0.14, passing: 0.12, defending: 0.1, stamina: 0.06 } },
};

// Bir yaştaki ortalama oyuncu gücü (altyapı rakiplerinin ölçeği)
function expectedAtAge(age) {
  return U.clamp(14 + (age - 8) * 4.6, 14, 70);
}

function ageGroupName(age) {
  if (age <= 9) return 'U10';
  if (age <= 11) return 'U12';
  if (age <= 13) return 'U14';
  if (age <= 15) return 'U16';
  return 'U19';
}

const Player = {
  // 38 haftalık sezona göre antrenman katsayısı
  TRAIN_K: 0.3,
  create(opts) {
    const stats = {};
    const age = opts.age || 8;
    // Büyük yaşta başlayan oyuncu yaşıtları seviyesinde başlar
    const base = Math.max(12, Math.round(expectedAtAge(age) - 6));
    STATS.forEach((s) => (stats[s.k] = base + (opts.alloc[s.k] || 0)));
    return {
      name: opts.name,
      surname: opts.surname,
      nation: opts.nation,
      parents: { f: opts.nation, m: opts.mother || opts.nation },
      position: opts.position,
      foot: opts.foot,
      age,
      stats,
      potential: U.randi(80, 96),
      energy: 100,
      morale: 70,
      money: 200 + (age - 8) * 150,
      fame: 0,
      injuryWeeks: 0,
      rel: { coach: 50, team: 50, fans: 30 },
      items: [],
      totals: { apps: 0, goals: 0, assists: 0, ratingSum: 0, motm: 0 },
      intl: { caps: 0, goals: 0 },
      trophies: [],
      history: [],
      yellow: 0,
      shirt: U.randi(7, 11),
    };
  },

  fullName(p) { return `${p.name} ${p.surname}`; },

  overall(p, withItems = false) {
    const w = POSITIONS[p.position].w;
    const st = withItems ? Player.effStats(p) : p.stats;
    let o = 0;
    for (const k in w) o += w[k] * st[k];
    return Math.round(U.clamp(o, 1, 99));
  },

  effStats(p) {
    const st = Object.assign({}, p.stats);
    const boot = Player.activeBoot(p);
    for (const id of p.items) {
      const it = ITEMS.find((i) => i.id === id);
      if (!it || !it.bonus || (it.cat === 'boots' && it !== boot)) continue;
      for (const k in it.bonus) st[k] = Math.min(99, st[k] + it.bonus[k]);
    }
    return st;
  },

  // Aynı anda tek krampon giyilir: elindekilerin en iyisi
  activeBoot(p) {
    let best = null;
    for (const id of p.items) {
      const it = ITEMS.find((i) => i.id === id);
      if (it && it.cat === 'boots' && (!best || it.price > best.price)) best = it;
    }
    return best;
  },

  // Krampon ömrü (maç sayısı); eski kayıtlarda ilk okumada belirlenir
  bootLife(p, id) {
    p.wear = p.wear || {};
    if (p.wear[id] == null) p.wear[id] = U.randi(30, 40);
    return p.wear[id];
  },

  // Oynanan maç sonrası giyilen krampon aşınır; biterse çantadan çıkar
  wearBoot(p) {
    const b = Player.activeBoot(p);
    if (!b) return null;
    const left = Player.bootLife(p, b.id) - 1;
    if (left > 0) { p.wear[b.id] = left; return left === 5 ? { warn: b } : null; }
    p.items = p.items.filter((x) => x !== b.id);
    delete p.wear[b.id];
    return { gone: b };
  },

  bestItem(p, cat, field) {
    let best = null;
    for (const id of p.items) {
      const it = ITEMS.find((i) => i.id === id);
      if (it && it.cat === cat && (!best || it[field] > best[field])) best = it;
    }
    return best;
  },

  trainMult(p) {
    const g = Player.bestItem(p, 'gear', 'mult');
    return g ? g.mult : 1;
  },

  energyRegen(p) {
    const f = Player.bestItem(p, 'food', 'regen');
    return 22 + (f ? f.regen : 0);
  },

  ageMult(age) {
    if (age <= 12) return 1.3;
    if (age <= 17) return 1.45;
    if (age <= 21) return 1.15;
    if (age <= 25) return 0.8;
    if (age <= 29) return 0.5;
    if (age <= 32) return 0.3;
    return 0.15;
  },

  // Yaşa göre yumuşak tavan: çocuk ne kadar çalışırsa çalışsın yaşının çok ötesine geçemez
  growthFactor(p, val) {
    const soft = Math.min(p.potential + 4, expectedAtAge(p.age) + 16 + (p.potential - 80) * 0.6);
    const softF = U.clamp((soft - val) / 18, 0.03, 1);
    const capF = U.clamp((p.potential + 4 - val) / 40, 0.02, 1);
    return Math.min(softF, capF);
  },

  // Bir stata antrenman uygular, kazanılan miktarı döner
  train(p, statKey, intensity, facility) {
    const val = p.stats[statKey];
    const moraleF = 0.75 + 0.5 * (p.morale / 100);
    const gain = Player.TRAIN_K * intensity * Player.ageMult(p.age) * Player.growthFactor(p, val) * moraleF * facility * Player.trainMult(p) * U.rand(0.7, 1.3);
    p.stats[statKey] = U.clamp(val + gain, 1, 99);
    return gain;
  },

  // Maçta kullanılan statlara küçük deneyim
  matchXp(p, keys) {
    for (const k of keys) {
      const val = p.stats[k];
      p.stats[k] = U.clamp(val + 0.065 * Player.ageMult(p.age) * Player.growthFactor(p, val), 1, 99);
    }
  },

  // Sezon sonu doğal gelişim / yaşlanma
  ageUp(p) {
    p.age += 1;
    const a = p.age;
    const changes = {};
    const add = (k, v) => {
      const before = p.stats[k];
      const capV = v > 0 ? Math.min(v, Math.max(0, p.potential + 4 - before)) : v;
      p.stats[k] = U.clamp(before + capV, 1, 99);
      changes[k] = (changes[k] || 0) + (p.stats[k] - before);
    };
    if (a <= 18) {
      // büyüme
      ['physical', 'pace', 'stamina'].forEach((k) => add(k, U.rand(1.5, 4)));
      STATS.forEach((s) => add(s.k, U.rand(0.5, 1.8)));
    } else if (a <= 23) {
      ['physical', 'stamina'].forEach((k) => add(k, U.rand(0, 1.5)));
    } else if (a >= 31) {
      const d = a >= 34 ? 2.2 : 1;
      ['pace', 'stamina', 'physical'].forEach((k) => add(k, -U.rand(1, 3) * d));
      if (a >= 33) STATS.forEach((s) => add(s.k, -U.rand(0.3, 1.5) * d));
    }
    return changes;
  },

  // Yüksek ilişkiye ulaşmak giderek zorlaşır
  addRel(p, key, v) {
    if (v > 0) v *= U.clamp((100 - p.rel[key]) / 45, 0.12, 1);
    p.rel[key] = U.clamp(p.rel[key] + v, 0, 100);
  },
  addMorale(p, v) { p.morale = U.clamp(p.morale + v, 0, 100); },
  addEnergy(p, v) { p.energy = U.clamp(p.energy + v, 0, 100); },
  addFame(p, v) { p.fame = U.clamp(p.fame + v, 0, 100); },

  // Sakatlık direnci
  injuryChance(p, base) {
    const fatigue = (100 - p.energy) / 100;
    return base * (1 + fatigue * 2.5) * (1.3 - p.stats.physical / 140);
  },

  // Belirli bir an türü için ilgili statların ağırlıklı ortalaması
  skillFor(p, type) {
    const s = Player.effStats(p);
    switch (type) {
      case 'shot': return s.shooting * 0.55 + s.technique * 0.3 + s.pace * 0.15;
      case 'pass': return s.passing * 0.6 + s.technique * 0.3 + s.pace * 0.1;
      case 'dribble': return s.dribbling * 0.55 + s.pace * 0.3 + s.technique * 0.15;
      case 'tackle': return s.defending * 0.6 + s.physical * 0.25 + s.pace * 0.15;
      case 'header': return s.heading * 0.65 + s.physical * 0.35;
      case 'freekick': return s.shooting * 0.45 + s.technique * 0.55;
      case 'penalty': return s.shooting * 0.6 + s.technique * 0.4;
      case 'save': return s.pace * 0.4 + s.technique * 0.3 + s.physical * 0.15 + s.heading * 0.15;
      default: return Player.overall(p, true);
    }
  },
};
