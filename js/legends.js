// Dönem yıldızları: gerçek futbolculara benzeyen kurgusal isimler.
// [isim, mevki, zirve gücü, ülke, doğum yılı, ilk kulüp]
// Oyun hangi yılda başlarsa o yıl 17-38 yaş arasındaki yıldızlar sahadadır;
// zamanla yaşlanır, emekli olur, gençler sırası gelince profesyonel olur.
const LEGENDS = [
  // 1980'ler
  ['Marcos Virera', 'FW', 95, 'ARG', 1960, 'NAP'],
  ['Nathan Piron', 'MF', 93, 'FRA', 1955, 'JUV'],
  ['Corildo', 'MF', 91, 'BRA', 1953, 'UDI'],
  ['Morão', 'MF', 88, 'BRA', 1954, 'FIO'],
  ['Moritz Brandhaus', 'FW', 90, 'GER', 1955, 'BAY'],
  ['Davide Faresi', 'FW', 88, 'ITA', 1956, 'JUV'],
  ['Oliver Langeridge', 'FW', 89, 'SCO', 1951, 'LIV'],
  ['Sam Asheridge', 'FW', 88, 'WAL', 1961, 'LIV'],
  ['Bryan Duner', 'MF', 87, 'ENG', 1957, 'MUN'],
  ['Héctor Salgado', 'FW', 89, 'MEX', 1958, 'RMA'],
  ['Emilio Quinoza', 'FW', 86, 'ESP', 1963, 'RMA'],
  ['Simone Casese', 'DF', 90, 'ITA', 1960, 'MIL'],
  ['Luuk van Kuisen', 'FW', 93, 'NED', 1964, 'MIL'],
  ['Ruben Noorestra', 'MF', 91, 'NED', 1962, 'MIL'],
  ['Sem Ruiman', 'MF', 89, 'NED', 1962, 'MIL'],
  ['Moritz Goler', 'MF', 91, 'GER', 1961, 'INT'],
  ['Rudi Vofeld', 'FW', 87, 'GER', 1960, 'ROM'],
  ['Sam Chaler', 'FW', 88, 'ENG', 1960, 'EVE'],
  ['Théo Taron', 'FW', 89, 'FRA', 1963, 'OM'],
  ['Jonas Holmesen', 'MF', 89, 'DEN', 1964, 'BAR'],
  ['Tanju Uçarhan', 'FW', 84, 'TUR', 1963, 'GAL'],
  ['Rıdvan Akınbey', 'MF', 82, 'TUR', 1962, 'FNK'],
  ['Metin Selsever', 'FW', 80, 'TUR', 1964, 'BJK'],
  ['Feyyaz Alptaş', 'FW', 81, 'TUR', 1963, 'BJK'],
  ['Aykut Yücetepe', 'FW', 82, 'TUR', 1965, 'FNK'],
  ['Rıza Gökmen', 'DF', 79, 'TUR', 1963, 'BJK'],
  ['Şenol Yücehan', 'GK', 80, 'TUR', 1952, 'TRB'],
  // 1990'lar
  ['Calola', 'FW', 92, 'BRA', 1966, 'BAR'],
  ['Kiril Petkanov', 'FW', 90, 'BUL', 1966, 'BAR'],
  ['Lorenzo Lurotti', 'FW', 92, 'ITA', 1967, 'JUV'],
  ['Dorin Mărculescu', 'MF', 89, 'ROU', 1965, 'GAL'],
  ['Enzo Virot', 'FW', 89, 'FRA', 1966, 'MUN'],
  ['Emil Engestad', 'GK', 90, 'DEN', 1963, 'MUN'],
  ['Diego Quines', 'FW', 90, 'ARG', 1969, 'FIO'],
  ['Luuk Brouman', 'FW', 90, 'NED', 1969, 'ARS'],
  ['Alessio Oresi', 'DF', 92, 'ITA', 1968, 'MIL'],
  ['Tobias Rieberg', 'GK', 90, 'GER', 1969, 'BAY'],
  ['George Bradewood', 'FW', 89, 'ENG', 1970, 'NEW'],
  ['Yanis Morel', 'MF', 95, 'FRA', 1972, 'JUV'],
  ['Nasola', 'FW', 91, 'BRA', 1972, 'BAR'],
  ['Gonçalo Goado', 'MF', 91, 'POR', 1972, 'BAR'],
  ['Andrea Del Marini', 'FW', 90, 'ITA', 1974, 'JUV'],
  ['Rhys Pritchard', 'MF', 88, 'WAL', 1973, 'MUN'],
  ['Rodrigo Valença', 'FW', 96, 'BRA', 1976, 'INT'],
  ['Oleh Kravets', 'FW', 91, 'UKR', 1976, 'MIL'],
  ['Rüştü Arısever', 'GK', 86, 'TUR', 1973, 'FNK'],
  ['Sergen Günhan', 'MF', 84, 'TUR', 1972, 'BJK'],
  ['Tugay Boradağ', 'MF', 84, 'TUR', 1970, 'GAL'],
  ['Bülent Çınaralp', 'DF', 83, 'TUR', 1968, 'GAL'],
  ['Hami Tantekin', 'FW', 83, 'TUR', 1968, 'TRB'],
  ['Ümit Uçaryürek', 'MF', 81, 'TUR', 1973, 'GAL'],
  ['Okan Toprakdemir', 'MF', 82, 'TUR', 1973, 'GAL'],
  ['Oğuz Tunbey', 'MF', 81, 'TUR', 1963, 'FNK'],
  // 2000'ler
  ['Théo Belard', 'FW', 93, 'FRA', 1977, 'ARS'],
  ['Sergio Marano', 'FW', 89, 'ESP', 1977, 'RMA'],
  ['Marco Casano', 'DF', 90, 'ITA', 1973, 'JUV'],
  ['Marco Narelli', 'GK', 92, 'ITA', 1978, 'JUV'],
  ['Oliver Waleford', 'MF', 89, 'ENG', 1978, 'CHE'],
  ['Yao Kouassi', 'FW', 89, 'CIV', 1978, 'CHE'],
  ['Alessio Galucci', 'MF', 90, 'ITA', 1979, 'MIL'],
  ['Joca Serrano', 'MF', 94, 'BRA', 1980, 'BAR'],
  ['Oliver Waleson', 'MF', 89, 'ENG', 1980, 'LIV'],
  ['Rubén Tames', 'MF', 92, 'ESP', 1980, 'BAR'],
  ['Hugo Zerales', 'GK', 91, 'ESP', 1981, 'RMA'],
  ['Johan Lindqvist', 'FW', 91, 'SWE', 1981, 'JUV'],
  ['Arildo', 'MF', 92, 'BRA', 1982, 'MIL'],
  ['Álvaro Zeres', 'MF', 92, 'ESP', 1984, 'BAR'],
  ['Mason Mideridge', 'FW', 90, 'ENG', 1985, 'MUN'],
  ['Rafael Santeiro', 'FW', 96, 'POR', 1985, 'MUN'],
  ['Mateo Lirandi', 'FW', 97, 'ARG', 1987, 'BAR'],
  ['Alex de Tarela', 'MF', 87, 'BRA', 1977, 'FNK'],
  ['Emre Günkan', 'MF', 85, 'TUR', 1980, 'GAL'],
  ['Nihat Akınmen', 'FW', 84, 'TUR', 1979, 'RSO'],
  ['Tuncay Demiryürek', 'FW', 83, 'TUR', 1982, 'FNK'],
  ['Volkan Yıldağ', 'GK', 82, 'TUR', 1981, 'FNK'],
  ['Hamit Toprakyol', 'MF', 85, 'TUR', 1982, 'BAY'],
  ['Arda Gökel', 'MF', 86, 'TUR', 1987, 'GAL'],
  ['Semih Çakırsever', 'FW', 81, 'TUR', 1983, 'FNK'],
  // 2010'lar
  ['Matías Ferreyra', 'FW', 91, 'URU', 1987, 'LIV'],
  ['Iker Urez', 'DF', 90, 'ESP', 1986, 'RMA'],
  ['Elias Jakić', 'MF', 90, 'CRO', 1985, 'TOT'],
  ['Jan Lindhoff', 'GK', 91, 'GER', 1986, 'BAY'],
  ['Noah Haleny', 'FW', 91, 'POL', 1988, 'BVB'],
  ['Jonas Golestein', 'MF', 88, 'GER', 1988, 'RMA'],
  ['Owen Llewellyn', 'FW', 89, 'WAL', 1989, 'TOT'],
  ['Jan Kelener', 'MF', 90, 'GER', 1990, 'BAY'],
  ['Enzo Charel', 'MF', 90, 'BEL', 1991, 'CHE'],
  ['Yanis De Roret', 'MF', 91, 'BEL', 1991, 'MCS'],
  ['Lucas Gireau', 'FW', 89, 'FRA', 1991, 'ATM'],
  ['Bram van Dekeveld', 'DF', 90, 'NED', 1991, 'LIV'],
  ['Ririco', 'FW', 92, 'BRA', 1992, 'BAR'],
  ['Karim Nami', 'FW', 90, 'EGY', 1992, 'LIV'],
  ['Tom Hartewood', 'FW', 90, 'ENG', 1993, 'TOT'],
  ['Burak Uçartaş', 'FW', 84, 'TUR', 1985, 'TRB'],
  ['Cenk Sarımen', 'FW', 82, 'TUR', 1991, 'BJK'],
  ['Hakan Tekgöz', 'MF', 87, 'TUR', 1994, 'MIL'],
  ['Merih Salen', 'DF', 84, 'TUR', 1998, 'JUV'],
  ['Çağlar Ulumen', 'DF', 82, 'TUR', 1996, 'FNK'],
  ['Cengiz Aktepe', 'FW', 82, 'TUR', 1997, 'ROM'],
  // 2020'ler
  ['Valón', 'MF', 90, 'ESP', 1996, 'MCS'],
  ['Uğurcan Uzcan', 'GK', 84, 'TUR', 1996, 'TRB'],
  ['Yanis Carard', 'FW', 90, 'FRA', 1997, 'PSG'],
  ['Enzo Kamara', 'FW', 94, 'FRA', 1998, 'PSG'],
  ['Samuel Kakodu', 'FW', 88, 'NGA', 1998, 'GAL'],
  ['Ferdi Toprakdağ', 'DF', 83, 'TUR', 1999, 'FNK'],
  ['Magnus Solestad', 'FW', 93, 'NOR', 2000, 'MCS'],
  ['Rafael Pares', 'FW', 91, 'BRA', 2000, 'RMA'],
  ['Barış Alper Gökoğlu', 'FW', 82, 'TUR', 2000, 'GAL'],
  ['Orkun Çakırmen', 'MF', 84, 'TUR', 2000, 'BJK'],
  ['Mason Halewood', 'FW', 89, 'ENG', 2001, 'ARS'],
  ['Adam Gitashvili', 'FW', 89, 'GEO', 2001, 'NAP'],
  ['Solano', 'MF', 89, 'ESP', 2002, 'BAR'],
  ['Lewis Whitewell', 'MF', 91, 'ENG', 2003, 'RMA'],
  ['Lukas Neuner', 'MF', 90, 'GER', 2003, 'BAY'],
  ['Lukas Brandedorf', 'MF', 90, 'GER', 2003, 'LEV'],
  ['Tolga Özmen', 'MF', 90, 'TUR', 2005, 'RMA'],
  ['Umut Uzsoy', 'FW', 88, 'TUR', 2005, 'JUV'],
  ['Rubén Belez', 'FW', 94, 'ESP', 2007, 'BAR'],
  // --- Türkiye ligi: dönem dönem ---
  ['Fatih Uçargöz', 'DF', 80, 'TUR', 1953, 'GAL'],
  ['Cüneyt Seltaş', 'MF', 80, 'TUR', 1956, 'GAL'],
  ['Goran Jakšić', 'GK', 82, 'SRB', 1954, 'GAL'],
  ['Uğur Tekdağ', 'MF', 80, 'TUR', 1963, 'GAL'],
  ['Erdal Balsoy', 'FW', 79, 'TUR', 1961, 'GAL'],
  ['Harald Keleberg', 'GK', 86, 'GER', 1954, 'FNK'],
  ['Müjdat Tunoğlu', 'DF', 79, 'TUR', 1955, 'FNK'],
  ['Selçuk Karacan', 'FW', 81, 'TUR', 1959, 'FNK'],
  ['Hasan Uçarpınar', 'MF', 78, 'TUR', 1962, 'FNK'],
  ['Ali Uzdağ', 'FW', 79, 'TUR', 1965, 'BJK'],
  ['Zeki Tursoy', 'MF', 78, 'TUR', 1962, 'BJK'],
  ['Gökhan Ulualp', 'DF', 79, 'TUR', 1966, 'BJK'],
  ['Hasan Oğuzer', 'FW', 78, 'TUR', 1966, 'TRB'],
  ['Ünal Boradağ', 'MF', 79, 'TUR', 1966, 'TRB'],
  ['Hakan Arısever', 'DF', 82, 'TUR', 1973, 'GAL'],
  ['Suat Uzhan', 'MF', 80, 'TUR', 1967, 'GAL'],
  ['Fonito', 'GK', 86, 'BRA', 1966, 'GAL'],
  ['Marian Ionescu', 'DF', 85, 'ROU', 1967, 'GAL'],
  ['Bülent Taşyol', 'FW', 81, 'TUR', 1971, 'FNK'],
  ['Senad Hadžić', 'FW', 83, 'BIH', 1971, 'FNK'],
  ['Kemalettin Erkkan', 'FW', 79, 'TUR', 1970, 'FNK'],
  ['Ogün Bayyol', 'DF', 81, 'TUR', 1969, 'TRB'],
  ['Chidi Obiora', 'DF', 82, 'NGA', 1967, 'FNK'],
  ['Mehmet Ilgazsal', 'MF', 80, 'TUR', 1966, 'BJK'],
  ['Ertuğrul Durutekin', 'FW', 80, 'TUR', 1969, 'SAM'],
  ['Oktay Kayaer', 'FW', 79, 'TUR', 1975, 'BJK'],
  ['Paskal Mareau', 'FW', 81, 'FRA', 1972, 'BJK'],
  ['Recep Oğuzsoy', 'DF', 79, 'TUR', 1965, 'BJK'],
  ['Orhan Yıldağ', 'FW', 79, 'TUR', 1967, 'TRB'],
  ['Abdullah Köksever', 'DF', 80, 'TUR', 1971, 'TRB'],
  ['Levan Beridze', 'FW', 84, 'GEO', 1973, 'TRB'],
  ['Hasan Taşhan', 'MF', 83, 'TUR', 1976, 'GAL'],
  ['Ümit Ilgazsever', 'FW', 80, 'TUR', 1976, 'GAL'],
  ['Mario Morida', 'FW', 86, 'BRA', 1973, 'GAL'],
  ['Necati Karanmen', 'FW', 79, 'TUR', 1980, 'GAL'],
  ['Sabri Turkaya', 'DF', 80, 'TUR', 1984, 'GAL'],
  ['Serhat Kayahan', 'FW', 80, 'TUR', 1981, 'FNK'],
  ['Mehmet Baybey', 'MF', 82, 'BRA', 1977, 'FNK'],
  ['Gökhan Taşkan', 'DF', 82, 'TUR', 1985, 'FNK'],
  ['Nemanja Ilić', 'FW', 84, 'SRB', 1979, 'FNK'],
  ['Bruno Terão', 'DF', 89, 'BRA', 1973, 'RMA'],
  ['İbrahim Gökpınar', 'DF', 80, 'TUR', 1974, 'BJK'],
  ['Ahmet Akyol', 'FW', 80, 'TUR', 1978, 'BJK'],
  ['Tümer Kayatekin', 'MF', 80, 'TUR', 1974, 'BJK'],
  ['Bobo Tarares', 'FW', 81, 'BRA', 1985, 'BJK'],
  ['Fatih Erksal', 'FW', 82, 'TUR', 1977, 'TRB'],
  ['Gökdeniz Alpdemir', 'MF', 82, 'TUR', 1980, 'TRB'],
  ['Tolga Topraksoy', 'GK', 79, 'TUR', 1983, 'TRB'],
  ['Hüseyin Güngül', 'MF', 79, 'TUR', 1979, 'TRB'],
  ['Umut Yağıztepe', 'FW', 79, 'TUR', 1983, 'TRB'],
  ['Mehmet Demiryürek', 'MF', 80, 'TUR', 1983, 'KAY'],
  ['Luuk Stema', 'MF', 89, 'NED', 1984, 'INT'],
  ['Selçuk Köksal', 'MF', 82, 'TUR', 1985, 'GAL'],
  ['Gastón Olivera', 'GK', 84, 'URU', 1986, 'GAL'],
  ['Karim Belkacem', 'MF', 81, 'ALG', 1989, 'GAL'],
  ['Dirk Smitema', 'FW', 84, 'NED', 1980, 'LIV'],
  ['Pape Ndao', 'FW', 81, 'SEN', 1986, 'FNK'],
  ['Volkan Yücesal', 'MF', 80, 'TUR', 1987, 'FNK'],
  ['Ikenna Okoro', 'FW', 81, 'NGA', 1987, 'FNK'],
  ['Ozan Şenel', 'MF', 80, 'TUR', 1995, 'FNK'],
  ['Rikardo Queinho', 'FW', 86, 'POR', 1983, 'BJK'],
  ['Jean Ebanga', 'FW', 82, 'CMR', 1992, 'BJK'],
  ['Dorito', 'MF', 82, 'BRA', 1994, 'BJK'],
  ['Oğuzhan Kayacan', 'MF', 80, 'TUR', 1992, 'BJK'],
  ['Onur Erkmen', 'GK', 79, 'TUR', 1988, 'TRB'],
  ['Yusuf Özbey', 'MF', 82, 'TUR', 1997, 'TRB'],
  ['Abdülkadir Uçartürk', 'MF', 80, 'TUR', 1999, 'TRB'],
  ['Amir Hodžić', 'MF', 81, 'BIH', 1990, 'BSK'],
  ['Mahmut Tunyol', 'MF', 78, 'TUR', 1988, 'BSK'],
  ['Mauro Sanez', 'FW', 84, 'ARG', 1993, 'INT'],
  ['Dris Beland', 'MF', 84, 'BEL', 1987, 'NAP'],
  ['Kerem Bilgetekin', 'FW', 81, 'TUR', 1998, 'GAL'],
  ['Haris Mehmedović', 'FW', 86, 'BIH', 1986, 'MCS'],
  ['İrfan Can Tekmen', 'MF', 81, 'TUR', 1995, 'BSK'],
  ['Luka Pavlović', 'MF', 84, 'SRB', 1988, 'FNK'],
  ['Altay Tekdağ', 'GK', 79, 'TUR', 1998, 'FNK'],
  ['Mert Ilgazyürek', 'GK', 80, 'TUR', 1989, 'BJK'],
  ['Ciro Fiese', 'FW', 85, 'ITA', 1990, 'LAZ'],
  // --- 1980-90'lar milli takım yıldızları ---
  ['Jorge Ferillo', 'FW', 86, 'ARG', 1955, 'RMA'],
  ['Jorge Rerón', 'MF', 85, 'ARG', 1962, 'NAN'],
  ['Alen Toet', 'MF', 86, 'FRA', 1952, 'OM'],
  ['Jan Morier', 'MF', 86, 'FRA', 1955, 'OM'],
  ['Andoni Moles', 'GK', 86, 'ESP', 1961, 'ATH'],
  ['Mişel Belón', 'MF', 86, 'ESP', 1963, 'RMA'],
  ['Peter Fenemore', 'GK', 87, 'ENG', 1949, 'NFO'],
  ['Glen Noreford', 'MF', 87, 'ENG', 1957, 'TOT'],
  ['Kris Haleford', 'MF', 86, 'ENG', 1960, 'TOT'],
  ['Tom Carleley', 'MF', 88, 'ENG', 1967, 'TOT'],
  ['Arinho', 'FW', 88, 'BRA', 1960, 'NAP'],
  ['Aré', 'MF', 88, 'BRA', 1953, 'ROM'],
  ['Barão', 'FW', 87, 'BRA', 1964, 'VAL'],
  ['Paulo Virão', 'FW', 86, 'POR', 1966, 'ATM'],
  ['Luan Marão', 'MF', 88, 'POR', 1972, 'FIO'],
  ['Florian Neuner', 'FW', 88, 'GER', 1964, 'VFB'],
  ['Andreas Loberg', 'DF', 87, 'GER', 1960, 'INT'],
  ['Toni Ostedorf', 'GK', 86, 'GER', 1954, 'KOE'],
  ['Thijs Janestra', 'DF', 88, 'NED', 1963, 'BAR'],
  ['Hans van Griestra', 'GK', 84, 'NED', 1956, 'NFO'],
  ['Lorenzo Farotti', 'GK', 88, 'ITA', 1960, 'INT'],
  ['Gianluca Maresi', 'FW', 87, 'ITA', 1964, 'JUV'],
  ['Roberto Virotti', 'FW', 86, 'ITA', 1964, 'GEN'],
  ['Enzo Tareau', 'MF', 87, 'BEL', 1966, 'INT'],
  ['Jan Larier', 'MF', 85, 'BEL', 1957, 'BHA'],
  ['Mişel Verard', 'GK', 86, 'BEL', 1959, 'BEN'],
  ['Victor Vulić', 'FW', 88, 'CRO', 1968, 'SEV'],
  ['Zvonimir Torović', 'MF', 87, 'CRO', 1968, 'MIL'],
  ['Robert Lukinić', 'MF', 86, 'CRO', 1969, 'RMA'],
  ['Ole Gunnar Åsegard', 'FW', 85, 'NOR', 1973, 'MUN'],
  ['Tore André Skovestad', 'FW', 83, 'NOR', 1973, 'CHE'],
  ['John Arne Torestad', 'DF', 84, 'NOR', 1980, 'LIV'],
  ['Hossam El Oudawi', 'FW', 80, 'EGY', 1966, 'XXX'],
  ['Ahmed Beli', 'MF', 81, 'EGY', 1975, 'XXX'],
  ['Mohamed El Zamouri', 'MF', 82, 'EGY', 1978, 'XXX'],
  ['Zbigniev Dvowski', 'MF', 87, 'POL', 1956, 'JUV'],
  ['Jerzi Vlek', 'GK', 84, 'POL', 1973, 'LIV'],
  ['Jakub Dvák', 'MF', 83, 'POL', 1985, 'BVB'],
  ['Kaha Matia', 'DF', 85, 'GEO', 1978, 'MIL'],
  ['Giorgi Tsiridze', 'MF', 83, 'GEO', 1973, 'MCS'],
  ['Ramil Garev', 'FW', 74, 'AZE', 1996, 'XXX'],
];

// Belirli bir yaştaki güç: 27 civarı zirve
function legendRating(peak, age) {
  const r = peak - Math.max(0, 25 - age) * 2.4 - Math.max(0, age - 30) * 2.1;
  return Math.round(U.clamp(r, 48, 97));
}

const Legends = {
  // Dünya oluşturulurken: o yıla ait yıldız kayıtları
  init(world, year) {
    world.legends = LEGENDS.map(([n, pos, peak, nat, by, club], i) => ({ i, n, pos, peak, nat, by, club, state: 'future' }));
    world.legends.forEach((L) => {
      const age = year - L.by;
      if (age >= 17 && age <= Legends.retireAge(L)) Legends.activate(world, L, year, true);
      else if (age > Legends.retireAge(L)) L.state = 'retired';
    });
  },

  retireAge(L) { return 33 + (L.i % 5) + (L.pos === 'GK' ? 3 : 0); },

  homeClub(world, L) {
    if (world.clubs[L.club]) return L.club;
    const lg = { TUR: 'TR1', ENG: 'ENG', ESP: 'ESP', GER: 'GER', ITA: 'ITA', FRA: 'FRA', NED: 'NED', POR: 'POR', BRA: 'BRA', ARG: 'ARG' }[L.nat];
    const top = (c) => (LEAGUES.find((l) => l.id === c.league) || {}).level === 1;
    const pool = Object.values(world.clubs).filter((c) => (lg ? c.league === lg : top(c)) && c.rating >= 74);
    return (U.pick(pool) || Object.values(world.clubs)[0]).id;
  },

  activate(world, L, year, silent) {
    L.state = 'active';
    L.club = Legends.homeClub(world, L);
    const c = world.clubs[L.club];
    c.roster.push({ n: L.n, pos: L.pos, r: legendRating(L.peak, year - L.by), nat: L.nat, age: year - L.by, star: true, lid: L.i });
    if (!silent) return `${L.n} (${year - L.by}) ${c.name} formasıyla profesyonel kariyerine başladı. Yeni bir yıldız doğuyor olabilir.`;
    return null;
  },

  find(world, L) {
    const c = world.clubs[L.club];
    return c ? c.roster.find((x) => x.lid === L.i) : null;
  },

  // Sezon sonu: yaşlanma, emeklilik, yeni yıldızlar, transferler. Haber metinleri döner.
  season(world, year) {
    if (!world.legends) { Legends.init(world, year); return []; }
    const news = [];
    world.legends.forEach((L) => {
      const age = year - L.by;
      if (L.state === 'future' && age >= 17) {
        const t = Legends.activate(world, L, year, false);
        if (t && L.peak >= 86) news.push({ t, kind: 'debut', L });
        return;
      }
      if (L.state !== 'active') return;
      const pl = Legends.find(world, L);
      if (!pl) { L.state = 'retired'; return; }
      pl.age = age;
      pl.r = legendRating(L.peak, age);
      const ra = Legends.retireAge(L);
      if (age >= ra || (age >= ra - 2 && U.chance(0.25))) {
        L.state = 'retired';
        const c = world.clubs[L.club];
        c.roster = c.roster.filter((x) => x !== pl);
        if (L.peak >= 85) news.push({ t: `${L.n}, ${age} yaşında futbolu bıraktı. Veda paylaşımı kısa sürede milyonlarca beğeni aldı.`, kind: 'retire', L });
        return;
      }
      // yıldız transferleri
      const club = world.clubs[L.club];
      if (age >= 21 && age <= 30 && pl.r > club.rating + 3 && U.chance(0.22)) {
        const dest = U.pick(Object.values(world.clubs).filter((c) => c.id !== club.id && c.rating > club.rating + 2 && c.rating >= pl.r - 8 && ['ENG', 'ESP', 'GER', 'ITA', 'FRA'].includes(c.league)));
        if (dest) {
          club.roster = club.roster.filter((x) => x !== pl);
          dest.roster.push(pl);
          L.club = dest.id;
          if (L.peak >= 86) news.push({ t: `Bomba transfer: ${L.n}, ${club.name} kulübünden ${dest.name} kulübüne imza attı.`, kind: 'transfer', L });
        }
      }
    });
    // liste bittikten sonra da yeni nesil yıldızlar çıksın
    const debuting = world.legends.filter((L) => L.state === 'future').length;
    if (debuting < 6) {
      for (let k = 0; k < 3; k++) news.push(...Legends.regen(world, year));
    }
    return news;
  },

  regen(world, year) {
    const pools = ['TR', 'EN', 'ES', 'DE', 'IT', 'FR', 'BR', 'AR', 'NL', 'PT', 'SN', 'HR'];
    const natOf = POOL_NAT;
    const pool = U.pick(pools);
    const L = { i: world.legends.length, n: World.genName(pool), pos: U.pick(['FW', 'FW', 'MF', 'MF', 'DF', 'GK']), peak: U.randi(84, 94), nat: natOf[pool], by: year - 17, club: null, state: 'future', regen: true };
    world.legends.push(L);
    const t = Legends.activate(world, L, year, false);
    return L.peak >= 89 ? [{ t, kind: 'debut', L }] : [];
  },

  active(world, nat) {
    if (!world.legends) return [];
    return world.legends.filter((L) => L.state === 'active' && (!nat || L.nat === nat)).map((L) => Object.assign({ L }, Legends.find(world, L) || {})).filter((x) => x.n);
  },

  // Dönemin en büyük yıldızı (idol)
  idol(world) {
    const a = Legends.active(world).sort((x, y) => y.r - x.r);
    return a.length ? a[0].n : 'Mateo Lirandi';
  },
};
