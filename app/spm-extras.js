// Adds packages that are not Capacitor plugins to CapApp-SPM/Package.swift.
// `npx cap sync ios` rewrites that file, so run this right after every sync.
// Currently: Liftoff Monetize (Vungle) adapter for AdMob mediation.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'ios/App/CapApp-SPM/Package.swift');
const EXTRAS = [
  {
    pkg: '.package(url: "https://github.com/googleads/googleads-mobile-ios-mediation-liftoffmonetize.git", exact: "7.7.800")',
    product: '.product(name: "LiftoffMonetizeAdapterTarget", package: "googleads-mobile-ios-mediation-liftoffmonetize")',
  },
];

let src = fs.readFileSync(FILE, 'utf8');
for (const e of EXTRAS) {
  if (src.includes(e.pkg)) continue;
  // last entry of the package dependencies list
  src = src.replace(/(dependencies: \[\n(?:\s+\.package\([^\n]*\n)*?\s+\.package\([^\n]*\))(\n\s+\],\n\s+targets:)/,
    (m, list, tail) => `${list},\n        ${e.pkg}${tail}`);
  // last entry of the target dependencies list
  src = src.replace(/(\.product\([^\n]*\))(\n\s+\]\n\s+\)\n\s+\]\n\)\s*$)/,
    (m, last, tail) => `${last},\n                ${e.product}${tail}`);
  if (!src.includes(e.pkg) || !src.includes(e.product)) {
    console.error('spm-extras: Package.swift layout changed, could not add ' + e.product);
    process.exit(1);
  }
}
fs.writeFileSync(FILE, src);
console.log('spm-extras: OK');
