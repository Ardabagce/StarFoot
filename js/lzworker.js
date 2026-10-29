// Kayıt sıkıştırma işçisi: büyük kariyer kayıtları ana iş parçacığını dondurmadan sıkıştırılır
importScripts('lz-string.min.js');
self.onmessage = (e) => {
  const { key, seq, str } = e.data;
  let z = null;
  try { z = LZString.compressToUTF16(str); } catch (err) { z = null; }
  self.postMessage({ key, seq, z });
};
