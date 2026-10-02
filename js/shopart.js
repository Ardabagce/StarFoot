// Mağaza ürün çizimleri (64x64, dolgulu basit illüstrasyonlar)

const SHOP_ART = {
  boot: (c) => `<path d="M8 40c0-6 4-9 9-9h7l5-17h10l2 18 13 5c4 1 4 5 4 7v4H8z" fill="${c}"/><path d="M8 48h50v4H8z" fill="#1d2433"/><path d="M14 52v4M22 52v4M30 52v4M38 52v4M46 52v4M54 52v4" stroke="#1d2433" stroke-width="3"/><path d="M27 22l8 2M26 27l9 2" stroke="#fff" stroke-width="2.5"/>`,
  ball: () => `<circle cx="32" cy="32" r="22" fill="#f4f4f4" stroke="#1d2433" stroke-width="2"/><path d="M32 21l9 6-3 10h-12l-3-10z" fill="#1d2433"/><path d="M32 10v11M41 27l11-3M38 37l7 11M26 37l-7 11M23 27l-11-3" stroke="#1d2433" stroke-width="2"/>`,
  goal: (c) => `<path d="M8 50V16h48v34" fill="none" stroke="#f4f4f4" stroke-width="4"/><path d="M12 20h40v30H12z" fill="${c}" opacity=".25"/><path d="M12 26h40M12 34h40M12 42h40M20 20v30M28 20v30M36 20v30M44 20v30" stroke="#fff" stroke-width="1" opacity=".6"/><circle cx="46" cy="50" r="6" fill="#f4f4f4" stroke="#1d2433" stroke-width="1.5"/>`,
  cones: (c) => `<path d="M14 50l7-24h4l7 24z" fill="${c}"/><path d="M34 50l7-24h4l7 24z" fill="${c}"/><path d="M17 40h12M37 40h12" stroke="#fff" stroke-width="3"/><path d="M8 50h50v4H8z" fill="#1d2433"/>`,
  rope: (c) => `<path d="M14 14c-6 20 8 40 18 40s24-20 18-40" fill="none" stroke="${c}" stroke-width="3"/><rect x="10" y="6" width="8" height="14" rx="3" fill="#1d2433"/><rect x="46" y="6" width="8" height="14" rx="3" fill="#1d2433"/>`,
  dumbbell: (c) => `<rect x="20" y="29" width="24" height="6" fill="#8a96a8"/><rect x="8" y="20" width="8" height="24" rx="2" fill="${c}"/><rect x="15" y="23" width="6" height="18" rx="2" fill="${c}"/><rect x="48" y="20" width="8" height="24" rx="2" fill="${c}"/><rect x="43" y="23" width="6" height="18" rx="2" fill="${c}"/>`,
  gym: (c) => `<path d="M8 52h48" stroke="#1d2433" stroke-width="4"/><path d="M14 52V22h36v30" fill="none" stroke="#8a96a8" stroke-width="4"/><rect x="18" y="16" width="28" height="6" fill="${c}"/><rect x="26" y="34" width="12" height="14" fill="${c}"/><path d="M20 30h24" stroke="#8a96a8" stroke-width="3"/>`,
  center: (c) => `<path d="M6 54h52V26L32 10 6 26z" fill="${c}"/><path d="M14 54V32h12v22M38 34h12v10H38z" fill="#0a1530" opacity=".6"/><path d="M28 22h8" stroke="#fff" stroke-width="3"/>`,
  book: (c) => `<path d="M10 14h20c2 0 2 2 2 2v36s0-2-2-2H10z" fill="${c}"/><path d="M54 14H34c-2 0-2 2-2 2v36s0-2 2-2h20z" fill="${c}" opacity=".8"/><path d="M15 22h12M15 28h12M37 22h12M37 28h12" stroke="#fff" stroke-width="2"/>`,
  blender: (c) => `<path d="M20 8h24l-4 32H24z" fill="#cfe8ff" opacity=".8"/><path d="M22 22h20l-2 18H24z" fill="${c}"/><rect x="18" y="40" width="28" height="16" rx="3" fill="#1d2433"/><circle cx="32" cy="48" r="3" fill="#ffcf3f"/>`,
  vitamins: (c) => `<rect x="18" y="16" width="28" height="40" rx="4" fill="${c}"/><rect x="20" y="8" width="24" height="10" rx="2" fill="#1d2433"/><rect x="22" y="28" width="20" height="16" fill="#fff"/><path d="M28 36h8M32 32v8" stroke="${c}" stroke-width="3"/>`,
  apple: (c) => `<path d="M32 20c-8-6-22-2-20 14s12 22 20 18c8 4 18-2 20-18S40 14 32 20z" fill="${c}"/><path d="M32 20c0-6 2-10 6-12" stroke="#5a3a1a" stroke-width="3" fill="none"/><path d="M34 14c6-4 12-2 12-2s-4 6-12 2z" fill="#46e08f"/>`,
  chef: (c) => `<path d="M16 32c-8-2-8-16 2-16 2-8 12-10 16-4 4-6 14-4 14 4 10 0 10 14 2 16v14H16z" fill="#f4f4f4"/><rect x="16" y="40" width="34" height="10" fill="${c}"/>`,
  cards: (c) => `<rect x="10" y="12" width="26" height="36" rx="3" fill="${c}" transform="rotate(-10 23 30)"/><rect x="26" y="14" width="26" height="36" rx="3" fill="#f4f4f4" stroke="${c}" stroke-width="2" transform="rotate(8 39 32)"/><circle cx="39" cy="28" r="6" fill="${c}" transform="rotate(8 39 32)"/>`,
  jersey: (c) => `<path d="M20 10l-12 8 6 10 6-3v29h24V25l6 3 6-10-12-8c-2 4-6 6-12 6s-10-2-12-6z" fill="${c}"/><text x="32" y="44" text-anchor="middle" font-size="14" font-weight="800" fill="#fff" font-family="sans-serif">10</text>`,
  bike: (c) => `<circle cx="16" cy="42" r="10" fill="none" stroke="#1d2433" stroke-width="4"/><circle cx="48" cy="42" r="10" fill="none" stroke="#1d2433" stroke-width="4"/><path d="M16 42l10-18h16l6 18M26 24l8 18h-18M40 18h6" fill="none" stroke="${c}" stroke-width="4"/>`,
  skate: (c) => `<path d="M6 34c0-4 4-6 8-6h36c4 0 8 2 8 6z" fill="${c}"/><circle cx="18" cy="42" r="5" fill="#1d2433"/><circle cx="46" cy="42" r="5" fill="#1d2433"/>`,
  console: (c) => `<path d="M12 22h40c6 0 10 6 10 14s-4 14-10 10l-8-6H20l-8 6C6 50 2 44 2 36s4-14 10-14z" fill="${c}"/><path d="M16 30v10M11 35h10" stroke="#fff" stroke-width="3"/><circle cx="44" cy="32" r="3" fill="#fff"/><circle cx="50" cy="38" r="3" fill="#fff"/>`,
  headphones: (c) => `<path d="M12 40V32a20 20 0 0 1 40 0v8" fill="none" stroke="#1d2433" stroke-width="5"/><rect x="8" y="36" width="12" height="18" rx="4" fill="${c}"/><rect x="44" y="36" width="12" height="18" rx="4" fill="${c}"/>`,
  phone: (c) => `<rect x="18" y="6" width="28" height="52" rx="5" fill="#1d2433"/><rect x="21" y="12" width="22" height="38" fill="${c}"/><circle cx="32" cy="54" r="2" fill="#8a96a8"/>`,
  scooter: (c) => `<path d="M44 10l-6 32H14" fill="none" stroke="${c}" stroke-width="5"/><path d="M38 10h12" stroke="#1d2433" stroke-width="4"/><circle cx="14" cy="46" r="7" fill="#1d2433"/><circle cx="40" cy="46" r="7" fill="#1d2433"/>`,
  watch: (c) => `<rect x="24" y="4" width="16" height="56" rx="4" fill="#1d2433"/><circle cx="32" cy="32" r="15" fill="${c}"/><circle cx="32" cy="32" r="11" fill="#0a1530"/><path d="M32 24v8l6 4" stroke="#fff" stroke-width="2.5"/>`,
  car: (c) => `<path d="M4 40l6-12c2-4 6-6 10-6h20c6 0 10 4 14 10l6 2c2 1 2 3 2 6v4H4z" fill="${c}"/><path d="M18 26h10v8H14zM32 26h8l6 8H32z" fill="#cfe8ff" opacity=".85"/><circle cx="16" cy="46" r="7" fill="#1d2433"/><circle cx="48" cy="46" r="7" fill="#1d2433"/>`,
  villa: (c) => `<path d="M4 56h56" stroke="#2f8c45" stroke-width="4"/><path d="M8 54V28l18-12 18 12v26z" fill="#f4f4f4"/><path d="M4 30l22-16 22 16" fill="none" stroke="${c}" stroke-width="5"/><rect x="40" y="36" width="20" height="18" fill="#e8e1d0"/><rect x="20" y="38" width="10" height="16" fill="${c}"/><rect x="44" y="40" width="10" height="6" fill="#4fb3ff"/>`,
  yacht: (c) => `<path d="M4 40h56l-8 12H12z" fill="#f4f4f4"/><path d="M16 40V28h24l8 12" fill="${c}"/><path d="M22 32h6M32 32h6" stroke="#cfe8ff" stroke-width="3"/><path d="M0 56c8 4 16-4 24 0s16 4 24 0 12-4 16 0" stroke="#4fb3ff" stroke-width="3" fill="none"/>`,
  guitar: (c) => `<path d="M40 8l8 8-14 14" stroke="#5a3a1a" stroke-width="4"/><path d="M30 26c-6-2-14 0-16 6-4 0-8 4-6 10s8 10 14 8c6 2 12-2 12-8 6-2 8-10 4-14z" fill="${c}"/><circle cx="22" cy="40" r="4" fill="#1d2433"/>`,
  drone: (c) => `<rect x="24" y="26" width="16" height="12" rx="3" fill="${c}"/><path d="M24 28L12 18M40 28l12-10M24 36l-12 10M40 36l12 10" stroke="#1d2433" stroke-width="3"/><ellipse cx="12" cy="16" rx="8" ry="2.5" fill="#8a96a8"/><ellipse cx="52" cy="16" rx="8" ry="2.5" fill="#8a96a8"/><ellipse cx="12" cy="48" rx="8" ry="2.5" fill="#8a96a8"/><ellipse cx="52" cy="48" rx="8" ry="2.5" fill="#8a96a8"/>`,
  glasses: (c) => `<path d="M6 26h52" stroke="#1d2433" stroke-width="3"/><path d="M8 26h20l-2 12c-1 4-4 6-8 6s-8-2-9-6zM36 26h20l-1 12c-1 4-5 6-9 6s-7-2-8-6z" fill="${c}"/>`,
  moto: (c) => `<circle cx="14" cy="44" r="9" fill="none" stroke="#1d2433" stroke-width="4"/><circle cx="50" cy="44" r="9" fill="none" stroke="#1d2433" stroke-width="4"/><path d="M14 44l12-14h14l10 14M24 30l-4-8h-6M40 30l6-10h6" fill="none" stroke="${c}" stroke-width="5"/>`,
  jet: (c) => `<path d="M4 34l40-4 14-10 2 4-8 10 8 2-2 4-12-2-12 10h-6l6-10-30-2z" fill="#f4f4f4"/><path d="M30 31h14" stroke="${c}" stroke-width="3"/><path d="M48 20l6 0" stroke="${c}" stroke-width="3"/>`,
  drink: (c) => `<rect x="22" y="12" width="20" height="44" rx="4" fill="${c}"/><rect x="24" y="6" width="16" height="8" rx="2" fill="#8a96a8"/><path d="M34 22l-6 12h6l-4 12 10-16h-6l4-8z" fill="#fff"/>`,
  massage: (c) => `<rect x="6" y="38" width="52" height="8" rx="2" fill="${c}"/><path d="M10 46v10M54 46v10" stroke="#1d2433" stroke-width="4"/><circle cx="16" cy="32" r="6" fill="#e0b48a"/><path d="M22 34h30" stroke="#e0b48a" stroke-width="7"/>`,
  physio: (c) => `<rect x="10" y="10" width="44" height="44" rx="8" fill="#f4f4f4"/><path d="M26 18h12v8h8v12h-8v8H26v-8h-8V26h8z" fill="${c}"/>`,
  camp: (c) => `<path d="M4 54L32 10l28 44z" fill="${c}"/><path d="M32 10v44M24 54l8-14 8 14z" fill="#0a1530" opacity=".55"/><path d="M28 10l4-6 4 6" stroke="#1d2433" stroke-width="3" fill="none"/>`,
  clinic: (c) => `<path d="M32 4l7 15 16 2-12 11 3 16-14-8-14 8 3-16L9 21l16-2z" fill="${c}"/><circle cx="32" cy="28" r="6" fill="#fff"/>`,
  sleep: (c) => `<path d="M40 10a20 20 0 1 0 14 34A16 16 0 0 1 40 10z" fill="${c}"/><path d="M14 12h8l-8 8h8M44 6h6l-6 6h6" stroke="#fff" stroke-width="2.5" fill="none"/>`,
  brain: (c) => `<path d="M22 12c-8 0-12 8-10 14-6 4-4 14 2 16 0 6 6 10 12 8 2 4 10 4 12 0 6 2 12-2 12-8 6-2 8-12 2-16 2-6-2-14-10-14-2-4-12-4-14 0z" fill="${c}"/><path d="M32 12v40M22 26c4 0 6 2 6 6M42 26c-4 0-6 2-6 6" stroke="#0a1530" stroke-width="2.5" fill="none" opacity=".5"/>`,
  video: (c) => `<rect x="6" y="14" width="40" height="30" rx="4" fill="${c}"/><path d="M46 24l12-8v28l-12-8z" fill="${c}" opacity=".8"/><path d="M22 22l12 7-12 7z" fill="#fff"/><path d="M14 52h28" stroke="#1d2433" stroke-width="4"/>`,
  fans: (c) => `<circle cx="16" cy="28" r="7" fill="${c}"/><circle cx="32" cy="24" r="8" fill="${c}"/><circle cx="48" cy="28" r="7" fill="${c}"/><path d="M4 56c0-9 5-14 12-14s12 5 12 14zM20 56c0-10 5-16 12-16s12 6 12 16zM36 56c0-9 5-14 12-14s12 5 12 14z" fill="${c}" opacity=".75"/>`,
};

const ShopArt = {
  tierColor(price) {
    if (price >= 1e6) return '#ffcf3f';
    if (price >= 50000) return '#4fb3ff';
    if (price >= 3000) return '#46e08f';
    return '#ff6f64';
  },
  svg(art, color) {
    const f = SHOP_ART[art] || SHOP_ART.ball;
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${f(color)}</svg>`;
  },
};
