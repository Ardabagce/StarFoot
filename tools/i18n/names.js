const fs = require('fs'); const vm = require('vm');
const ctx = { console, Math, U: { pick: (a) => a[0], randi: () => 0, rand: () => 0 } }; vm.createContext(ctx);
for (const f of ['util', 'data', 'legends']) { try { vm.runInContext(fs.readFileSync(require('path').join(__dirname, '../../js/' + f + '.js'), 'utf8').replace(/^const /gm, 'var '), ctx); } catch (e) { console.error(f, e.message); } }
const names = new Set();
Object.values(ctx.NAME_POOLS).forEach((p) => { p.f.forEach((x) => names.add(x)); p.l.forEach((x) => names.add(x)); });
(ctx.LEGENDS || []).forEach((L) => names.add(L[0]));
Object.values(ctx.STARS || {}).forEach((arr) => arr.forEach((x) => names.add(x[0])));
(ctx.NATIONS || []).forEach((n) => (n.stars || []).forEach((x) => names.add(x)));
const clubs = ctx.CLUB_LIST.map((c) => c[1]);
const shorts = ctx.CLUB_LIST.map((c) => c[2]).concat(ctx.CLUB_LIST.map((c) => c[0]));
fs.writeFileSync(require('path').join(__dirname, 'names.json'), JSON.stringify({ names: [...names], clubs, shorts }));
console.log(names.size, clubs.length);
