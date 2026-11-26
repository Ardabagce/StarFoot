// Eski Android WebView'ler (Chrome 73 öncesi) için eksik fonksiyonlar. Bu dosya bilerek ES5 yazılır
// ve her şeyden önce yüklenir; yeni tarayıcılarda hiçbir şeyi değiştirmez.
(function () {
  if (!Object.fromEntries) {
    Object.fromEntries = function (it) {
      var o = {};
      Array.from(it, function (kv) { o[kv[0]] = kv[1]; });
      return o;
    };
  }
  function def(proto, name, fn) {
    if (!proto[name]) Object.defineProperty(proto, name, { value: fn, writable: true, configurable: true });
  }
  def(Array.prototype, 'flat', function (d) {
    d = d === undefined ? 1 : Math.floor(d) || 0;
    var out = [];
    (function go(a, k) {
      for (var i = 0; i < a.length; i++) {
        if (!(i in a)) continue;
        if (Array.isArray(a[i]) && k > 0) go(a[i], k - 1); else out.push(a[i]);
      }
    })(this, d);
    return out;
  });
  def(Array.prototype, 'flatMap', function (fn, t) { return Array.prototype.map.call(this, fn, t).flat(1); });
  def(Array.prototype, 'at', function (n) { n = Math.trunc(n) || 0; if (n < 0) n += this.length; return this[n]; });
  def(String.prototype, 'at', function (n) { n = Math.trunc(n) || 0; if (n < 0) n += this.length; return this[n]; });
  def(String.prototype, 'replaceAll', function (a, b) {
    if (a instanceof RegExp) return this.replace(a, b);
    return this.split(String(a)).join(typeof b === 'function' ? b(a) : b);
  });
  def(String.prototype, 'matchAll', function (re) {
    var r = new RegExp(re.source, re.flags.indexOf('g') < 0 ? re.flags + 'g' : re.flags), s = String(this), out = [], m;
    while ((m = r.exec(s)) !== null) { out.push(m); if (m[0] === '') r.lastIndex++; }
    return out[Symbol.iterator]();
  });
  def(String.prototype, 'trimStart', String.prototype.trimLeft);
  def(String.prototype, 'trimEnd', String.prototype.trimRight);
})();
// a ?? b yerine (eski motorlar ?? yazımını tanımaz)
function NZ(v, d) { return v === null || v === undefined ? d : v; }
// Emoji temizleme deseni: yeni motorlarda Unicode özelliği, eskilerde vekil çiftleri
var EMOJI_RE = {};
function emojiRe(extra, flags) {
  var k = (extra || '') + '|' + (flags || '');
  if (!EMOJI_RE[k]) EMOJI_RE[k] = emojiRe0(extra, flags);
  return EMOJI_RE[k];
}
function emojiRe0(extra, flags) {
  try { return new RegExp('[\\p{Extended_Pictographic}\\u{1F1E6}-\\u{1F1FF}' + (extra || '') + ']', 'u' + (flags || '')); } catch (e) {
    return new RegExp('(?:[\\uD83C-\\uDBFF][\\uDC00-\\uDFFF]|[\\u2600-\\u27BF\\u2B00-\\u2BFF\\u2300-\\u23FF\\uFE0F\\u200D\\u20E3])', flags || '');
  }
}
