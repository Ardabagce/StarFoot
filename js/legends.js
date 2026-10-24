// Dönem yıldızları: gerçek futbolculara benzeyen kurgusal isimler.
// [isim, mevki, zirve gücü, ülke, doğum yılı, ilk kulüp]
// Oyun hangi yılda başlarsa o yıl 17-38 yaş arasındaki yıldızlar sahadadır;
// zamanla yaşlanır, emekli olur, gençler sırası gelince profesyonel olur.
const LEGENDS = [
  // 1980'ler
  ['Diego Maradoni', 'FW', 95, 'ARG', 1960, 'NAP'],
  ['Mişel Platinni', 'MF', 93, 'FRA', 1955, 'JUV'],
  ['Zikko', 'MF', 91, 'BRA', 1953, 'UDI'],
  ['Sokrates', 'MF', 88, 'BRA', 1954, 'FIO'],
  ['Karl-Heinz Rummenige', 'FW', 90, 'GER', 1955, 'BAY'],
  ['Paolo Rossy', 'FW', 88, 'ITA', 1956, 'JUV'],
  ['Kenny Dalgliş', 'FW', 89, 'SCO', 1951, 'LIV'],
  ['Ian Raş', 'FW', 88, 'WAL', 1961, 'LIV'],
  ['Bryan Robsın', 'MF', 87, 'ENG', 1957, 'MUN'],
  ['Hugo Sançez', 'FW', 89, 'XX', 1958, 'RMA'],
  ['Emilio Butragenyo', 'FW', 86, 'ESP', 1963, 'RMA'],
  ['Franko Barezi', 'DF', 90, 'ITA', 1960, 'MIL'],
  ['Marco van Bastın', 'FW', 93, 'NED', 1964, 'MIL'],
  ['Ruud Gulett', 'MF', 91, 'NED', 1962, 'MIL'],
  ['Frank Raykart', 'MF', 89, 'NED', 1962, 'MIL'],
  ['Lotar Matteus', 'MF', 91, 'GER', 1961, 'INT'],
  ['Rudi Föller', 'FW', 87, 'GER', 1960, 'ROM'],
  ['Gari Lineker', 'FW', 88, 'ENG', 1960, 'EVE'],
  ['Jan-Pier Papen', 'FW', 89, 'FRA', 1963, 'OM'],
  ['Mişel Laudrap', 'MF', 89, 'DEN', 1964, 'BAR'],
  ['Tanju Çolakoğulları', 'FW', 84, 'TUR', 1963, 'GAL'],
  ['Rıdvan Dilmenoğlu', 'MF', 82, 'TUR', 1962, 'FNK'],
  ['Metin Tekinoğlu', 'FW', 80, 'TUR', 1964, 'BJK'],
  ['Feyyaz Uçaroğlu', 'FW', 81, 'TUR', 1963, 'BJK'],
  ['Aykut Kocamanlı', 'FW', 82, 'TUR', 1965, 'FNK'],
  ['Rıza Çalımoğlu', 'DF', 79, 'TUR', 1963, 'BJK'],
  ['Şenol Güneşli', 'GK', 80, 'TUR', 1952, 'TRB'],
  // 1990'lar
  ['Romaryo', 'FW', 92, 'BRA', 1966, 'BAR'],
  ['Hristo Stoiçkov', 'FW', 90, 'XX', 1966, 'BAR'],
  ['Roberto Bacco', 'FW', 92, 'ITA', 1967, 'JUV'],
  ['Gheorghe Hacı', 'MF', 89, 'XX', 1965, 'GAL'],
  ['Erik Kantona', 'FW', 89, 'FRA', 1966, 'MUN'],
  ['Peter Şmeykel', 'GK', 90, 'DEN', 1963, 'MUN'],
  ['Gabriel Batistuda', 'FW', 90, 'ARG', 1969, 'FIO'],
  ['Dennis Berkamp', 'FW', 90, 'NED', 1969, 'ARS'],
  ['Paolo Maldinni', 'DF', 92, 'ITA', 1968, 'MIL'],
  ['Oliver Kahm', 'GK', 90, 'GER', 1969, 'BAY'],
  ['Alan Şirer', 'FW', 89, 'ENG', 1970, 'NEW'],
  ['Zinedin Zidan', 'MF', 95, 'FRA', 1972, 'JUV'],
  ['Rivaldu', 'FW', 91, 'BRA', 1972, 'BAR'],
  ['Luis Figu', 'MF', 91, 'POR', 1972, 'BAR'],
  ['Alessandro Del Pierro', 'FW', 90, 'ITA', 1974, 'JUV'],
  ['Rai Giggz', 'MF', 88, 'XX', 1973, 'MUN'],
  ['Ronaldu Nazario', 'FW', 96, 'BRA', 1976, 'INT'],
  ['Andriy Şevçenko', 'FW', 91, 'XX', 1976, 'MIL'],
  ['Rüştü Reçberoğlu', 'GK', 86, 'TUR', 1973, 'FNK'],
  ['Sergen Yalçınkaya', 'MF', 84, 'TUR', 1972, 'BJK'],
  ['Tugay Kerimli', 'MF', 84, 'TUR', 1970, 'GAL'],
  ['Bülent Korkmazer', 'DF', 83, 'TUR', 1968, 'GAL'],
  ['Hami Mandıracı', 'FW', 83, 'TUR', 1968, 'TRB'],
  ['Ümit Davalı', 'MF', 81, 'TUR', 1973, 'GAL'],
  ['Okan Buruklu', 'MF', 82, 'TUR', 1973, 'GAL'],
  ['Oğuz Çetinkayalı', 'MF', 81, 'TUR', 1963, 'FNK'],
  // 2000'ler
  ['Tiyerri Anri', 'FW', 93, 'FRA', 1977, 'ARS'],
  ['Raul Gonzales', 'FW', 89, 'ESP', 1977, 'RMA'],
  ['Fabio Kannavaro', 'DF', 90, 'ITA', 1973, 'JUV'],
  ['Gianluigi Buffo', 'GK', 92, 'ITA', 1978, 'JUV'],
  ['Frenk Lampart', 'MF', 89, 'ENG', 1978, 'CHE'],
  ['Didye Drogba', 'FW', 89, 'XX', 1978, 'CHE'],
  ['Andrea Pirlou', 'MF', 90, 'ITA', 1979, 'MIL'],
  ['Ronaldinyo', 'MF', 94, 'BRA', 1980, 'BAR'],
  ['Steven Cerard', 'MF', 89, 'ENG', 1980, 'LIV'],
  ['Ksavi Ernandes', 'MF', 92, 'ESP', 1980, 'BAR'],
  ['Ikır Kasiyas', 'GK', 91, 'ESP', 1981, 'RMA'],
  ['Zlatan İbrahimoviç', 'FW', 91, 'XX', 1981, 'JUV'],
  ['Kakah', 'MF', 92, 'BRA', 1982, 'MIL'],
  ['Andres İniesto', 'MF', 92, 'ESP', 1984, 'BAR'],
  ['Wayne Runi', 'FW', 90, 'ENG', 1985, 'MUN'],
  ['Cristiano Ronalda', 'FW', 96, 'POR', 1985, 'MUN'],
  ['Lionel Mezzi', 'FW', 97, 'ARG', 1987, 'BAR'],
  ['Alex de Souzza', 'MF', 87, 'BRA', 1977, 'FNK'],
  ['Emre Belözoğulları', 'MF', 85, 'TUR', 1980, 'GAL'],
  ['Nihat Kahvecioğlu', 'FW', 84, 'TUR', 1979, 'RSO'],
  ['Tuncay Şanlıer', 'FW', 83, 'TUR', 1982, 'FNK'],
  ['Volkan Demirelli', 'GK', 82, 'TUR', 1981, 'FNK'],
  ['Hamit Altıntoplu', 'MF', 85, 'TUR', 1982, 'BAY'],
  ['Arda Turanlı', 'MF', 86, 'TUR', 1987, 'GAL'],
  ['Semih Şentürklü', 'FW', 81, 'TUR', 1983, 'FNK'],
  // 2010'lar
  ['Luis Suarek', 'FW', 91, 'XX', 1987, 'LIV'],
  ['Sergio Ramoz', 'DF', 90, 'ESP', 1986, 'RMA'],
  ['Luka Modrac', 'MF', 90, 'CRO', 1985, 'TOT'],
  ['Manuel Neuler', 'GK', 91, 'GER', 1986, 'BAY'],
  ['Robert Lewandovsky', 'FW', 91, 'POL', 1988, 'BVB'],
  ['Mesut Özel', 'MF', 88, 'GER', 1988, 'RMA'],
  ['Gareth Beyl', 'FW', 89, 'XX', 1989, 'TOT'],
  ['Toni Krus', 'MF', 90, 'GER', 1990, 'BAY'],
  ['Eden Azar', 'MF', 90, 'BEL', 1991, 'CHE'],
  ['Kevin De Braune', 'MF', 91, 'BEL', 1991, 'MCS'],
  ['Antoine Grizmann', 'FW', 89, 'FRA', 1991, 'ATM'],
  ['Virgil van Dyck', 'DF', 90, 'NED', 1991, 'LIV'],
  ['Neymor', 'FW', 92, 'BRA', 1992, 'BAR'],
  ['Mohamed Saleh', 'FW', 90, 'EGY', 1992, 'LIV'],
  ['Harry Kain', 'FW', 90, 'ENG', 1993, 'TOT'],
  ['Burak Yılmazer', 'FW', 84, 'TUR', 1985, 'TRB'],
  ['Cenk Tosunoğlu', 'FW', 82, 'TUR', 1991, 'BJK'],
  ['Hakan Çalıkoğlu', 'MF', 87, 'TUR', 1994, 'MIL'],
  ['Merih Demirel', 'DF', 84, 'TUR', 1998, 'JUV'],
  ['Çağlar Söyüncan', 'DF', 82, 'TUR', 1996, 'FNK'],
  ['Cengiz Ünderli', 'FW', 82, 'TUR', 1997, 'ROM'],
  // 2020'ler
  ['Rodry', 'MF', 90, 'ESP', 1996, 'MCS'],
  ['Uğurcan Çakar', 'GK', 84, 'TUR', 1996, 'TRB'],
  ['Ousmane Dembelo', 'FW', 90, 'FRA', 1997, 'PSG'],
  ['Kylian Mbappo', 'FW', 94, 'FRA', 1998, 'PSG'],
  ['Victor Osimen', 'FW', 88, 'XX', 1998, 'GAL'],
  ['Ferdi Kadıköylü', 'DF', 83, 'TUR', 1999, 'FNK'],
  ['Erling Halland', 'FW', 93, 'NOR', 2000, 'MCS'],
  ['Vinicio Junho', 'FW', 91, 'BRA', 2000, 'RMA'],
  ['Barış Alper Yılmazer', 'FW', 82, 'TUR', 2000, 'GAL'],
  ['Orkun Kökçe', 'MF', 84, 'TUR', 2000, 'BJK'],
  ['Bukayo Saki', 'FW', 89, 'ENG', 2001, 'ARS'],
  ['Khviça Kvaratskelya', 'FW', 89, 'GEO', 2001, 'NAP'],
  ['Pedry', 'MF', 89, 'ESP', 2002, 'BAR'],
  ['Jude Bellinger', 'MF', 91, 'ENG', 2003, 'RMA'],
  ['Jamal Musiola', 'MF', 90, 'GER', 2003, 'BAY'],
  ['Florian Wirtzer', 'MF', 90, 'GER', 2003, 'LEV'],
  ['Arda Güner', 'MF', 90, 'TUR', 2005, 'RMA'],
  ['Kenan Yıldırım', 'FW', 88, 'TUR', 2005, 'JUV'],
  ['Lamin Yamel', 'FW', 94, 'ESP', 2007, 'BAR'],
  // --- Türkiye ligi: dönem dönem ---
  ['Fatih Terimli', 'DF', 80, 'TUR', 1953, 'GAL'],
  ['Cüneyt Tanoğlu', 'MF', 80, 'TUR', 1956, 'GAL'],
  ['Zoran Simoviğ', 'GK', 82, 'XX', 1954, 'GAL'],
  ['Uğur Tütünekli', 'MF', 80, 'TUR', 1963, 'GAL'],
  ['Erdal Keserli', 'FW', 79, 'TUR', 1961, 'GAL'],
  ['Harald Şumaher', 'GK', 86, 'GER', 1954, 'FNK'],
  ['Müjdat Yetkinli', 'DF', 79, 'TUR', 1955, 'FNK'],
  ['Selçuk Yulalı', 'FW', 81, 'TUR', 1959, 'FNK'],
  ['Hasan Vezirli', 'MF', 78, 'TUR', 1962, 'FNK'],
  ['Ali Gültekinli', 'FW', 79, 'TUR', 1965, 'BJK'],
  ['Zeki Önatlı', 'MF', 78, 'TUR', 1962, 'BJK'],
  ['Gökhan Keskinli', 'DF', 79, 'TUR', 1966, 'BJK'],
  ['Hasan Şenler', 'FW', 78, 'TUR', 1966, 'TRB'],
  ['Ünal Karamanlı', 'MF', 79, 'TUR', 1966, 'TRB'],
  ['Hakan Ünsallı', 'DF', 82, 'TUR', 1973, 'GAL'],
  ['Suat Kayalı', 'MF', 80, 'TUR', 1967, 'GAL'],
  ['Taffarelo', 'GK', 86, 'BRA', 1966, 'GAL'],
  ['Gheorghe Popesko', 'DF', 85, 'XX', 1967, 'GAL'],
  ['Bülent Uygunlu', 'FW', 81, 'TUR', 1971, 'FNK'],
  ['Elvir Boliç', 'FW', 83, 'XX', 1971, 'FNK'],
  ['Kemalettin Şentürklü', 'FW', 79, 'TUR', 1970, 'FNK'],
  ['Ogün Temizkanlı', 'DF', 81, 'TUR', 1969, 'TRB'],
  ['Uçe Okeçukvu', 'DF', 82, 'XX', 1967, 'FNK'],
  ['Mehmet Özdilekli', 'MF', 80, 'TUR', 1966, 'BJK'],
  ['Ertuğrul Sağlamlı', 'FW', 80, 'TUR', 1969, 'SAM'],
  ['Oktay Dereli', 'FW', 79, 'TUR', 1975, 'BJK'],
  ['Paskal Numa', 'FW', 81, 'FRA', 1972, 'BJK'],
  ['Recep Çetinli', 'DF', 79, 'TUR', 1965, 'BJK'],
  ['Orhan Çıkrıkçı', 'FW', 79, 'TUR', 1967, 'TRB'],
  ['Abdullah Ercanlı', 'DF', 80, 'TUR', 1971, 'TRB'],
  ['Şota Arveladzi', 'FW', 84, 'XX', 1973, 'TRB'],
  ['Hasan Şaşlı', 'MF', 83, 'TUR', 1976, 'GAL'],
  ['Ümit Karanlı', 'FW', 80, 'TUR', 1976, 'GAL'],
  ['Mario Jardelo', 'FW', 86, 'BRA', 1973, 'GAL'],
  ['Necati Ateşli', 'FW', 79, 'TUR', 1980, 'GAL'],
  ['Sabri Sarıoğulları', 'DF', 80, 'TUR', 1984, 'GAL'],
  ['Serhat Akınlı', 'FW', 80, 'TUR', 1981, 'FNK'],
  ['Mehmet Aurelyo', 'MF', 82, 'BRA', 1977, 'FNK'],
  ['Gökhan Gönüllü', 'DF', 82, 'TUR', 1985, 'FNK'],
  ['Mateja Kejman', 'FW', 84, 'XX', 1979, 'FNK'],
  ['Roberto Karlos', 'DF', 89, 'BRA', 1973, 'RMA'],
  ['İbrahim Üzülmezli', 'DF', 80, 'TUR', 1974, 'BJK'],
  ['Ahmet Dursunlu', 'FW', 80, 'TUR', 1978, 'BJK'],
  ['Tümer Metinli', 'MF', 80, 'TUR', 1974, 'BJK'],
  ['Bobo Santos', 'FW', 81, 'BRA', 1985, 'BJK'],
  ['Fatih Tekkeli', 'FW', 82, 'TUR', 1977, 'TRB'],
  ['Gökdeniz Karadenizli', 'MF', 82, 'TUR', 1980, 'TRB'],
  ['Tolga Zenginli', 'GK', 79, 'TUR', 1983, 'TRB'],
  ['Hüseyin Çimşirli', 'MF', 79, 'TUR', 1979, 'TRB'],
  ['Umut Bulutlu', 'FW', 79, 'TUR', 1983, 'TRB'],
  ['Mehmet Topuzlu', 'MF', 80, 'TUR', 1983, 'KAY'],
  ['Wesley Sneyder', 'MF', 89, 'NED', 1984, 'INT'],
  ['Selçuk İnanlı', 'MF', 82, 'TUR', 1985, 'GAL'],
  ['Fernando Muslero', 'GK', 84, 'XX', 1986, 'GAL'],
  ['Sofyan Fegouli', 'MF', 81, 'XX', 1989, 'GAL'],
  ['Dirk Kuyten', 'FW', 84, 'NED', 1980, 'LIV'],
  ['Musa Sov', 'FW', 81, 'XX', 1986, 'FNK'],
  ['Volkan Şenli', 'MF', 80, 'TUR', 1987, 'FNK'],
  ['Emmanuel Emenikeh', 'FW', 81, 'XX', 1987, 'FNK'],
  ['Ozan Tufanlı', 'MF', 80, 'TUR', 1995, 'FNK'],
  ['Rikardo Kuaresma', 'FW', 86, 'POR', 1983, 'BJK'],
  ['Vinsent Abubakar', 'FW', 82, 'XX', 1992, 'BJK'],
  ['Taliska', 'MF', 82, 'BRA', 1994, 'BJK'],
  ['Oğuzhan Özyakuplu', 'MF', 80, 'TUR', 1992, 'BJK'],
  ['Onur Kıvraklı', 'GK', 79, 'TUR', 1988, 'TRB'],
  ['Yusuf Yazıcıoğlu', 'MF', 82, 'TUR', 1997, 'TRB'],
  ['Abdülkadir Ömürlü', 'MF', 80, 'TUR', 1999, 'TRB'],
  ['Edin Vişça', 'MF', 81, 'XX', 1990, 'BSK'],
  ['Mahmut Tekdemirli', 'MF', 78, 'TUR', 1988, 'BSK'],
  ['Mauro İkardo', 'FW', 84, 'ARG', 1993, 'INT'],
  ['Dris Mertenz', 'MF', 84, 'BEL', 1987, 'NAP'],
  ['Kerem Aktürkler', 'FW', 81, 'TUR', 1998, 'GAL'],
  ['Edin Dzeka', 'FW', 86, 'XX', 1986, 'MCS'],
  ['İrfan Can Kahvecioğlu', 'MF', 81, 'TUR', 1995, 'BSK'],
  ['Dusan Tadiç', 'MF', 84, 'XX', 1988, 'FNK'],
  ['Altay Bayındırlı', 'GK', 79, 'TUR', 1998, 'FNK'],
  ['Mert Günoklu', 'GK', 80, 'TUR', 1989, 'BJK'],
  ['Ciro İmmobilo', 'FW', 85, 'ITA', 1990, 'LAZ'],
  // --- 1980-90'lar milli takım yıldızları ---
  ['Jorge Valdanno', 'FW', 86, 'ARG', 1955, 'RMA'],
  ['Jorge Burruçaga', 'MF', 85, 'ARG', 1962, 'NAN'],
  ['Alen Jiress', 'MF', 86, 'FRA', 1952, 'OM'],
  ['Jan Tigano', 'MF', 86, 'FRA', 1955, 'OM'],
  ['Andoni Zubizaretta', 'GK', 86, 'ESP', 1961, 'ATH'],
  ['Mişel Gonzales', 'MF', 86, 'ESP', 1963, 'RMA'],
  ['Peter Şilton', 'GK', 87, 'ENG', 1949, 'NFO'],
  ['Glen Hoddıl', 'MF', 87, 'ENG', 1957, 'TOT'],
  ['Kris Vaddıl', 'MF', 86, 'ENG', 1960, 'TOT'],
  ['Pol Gaskoyn', 'MF', 88, 'ENG', 1967, 'TOT'],
  ['Karekka', 'FW', 88, 'BRA', 1960, 'NAP'],
  ['Falkao', 'MF', 88, 'BRA', 1953, 'ROM'],
  ['Bebetto', 'FW', 87, 'BRA', 1964, 'VAL'],
  ['Paulo Futri', 'FW', 86, 'POR', 1966, 'ATM'],
  ['Rui Kosta', 'MF', 88, 'POR', 1972, 'FIO'],
  ['Jürgen Klinsmen', 'FW', 88, 'GER', 1964, 'VFB'],
  ['Andreas Brehmer', 'DF', 87, 'GER', 1960, 'INT'],
  ['Toni Şumaher', 'GK', 86, 'GER', 1954, 'KOE'],
  ['Ronald Kuman', 'DF', 88, 'NED', 1963, 'BAR'],
  ['Hans van Brökelen', 'GK', 84, 'NED', 1956, 'NFO'],
  ['Walter Zengo', 'GK', 88, 'ITA', 1960, 'INT'],
  ['Gianluca Viyalli', 'FW', 87, 'ITA', 1964, 'JUV'],
  ['Roberto Mançini', 'FW', 86, 'ITA', 1964, 'GEN'],
  ['Enzo Şifo', 'MF', 87, 'BEL', 1966, 'INT'],
  ['Jan Söylemans', 'MF', 85, 'BEL', 1957, 'BHA'],
  ['Mişel Prödom', 'GK', 86, 'BEL', 1959, 'BEN'],
  ['Davor Şuker', 'FW', 88, 'CRO', 1968, 'SEV'],
  ['Zvonimir Boben', 'MF', 87, 'CRO', 1968, 'MIL'],
  ['Robert Prosineçki', 'MF', 86, 'CRO', 1969, 'RMA'],
  ['Ole Gunnar Solşer', 'FW', 85, 'NOR', 1973, 'MUN'],
  ['Tore André Flo', 'FW', 83, 'NOR', 1973, 'CHE'],
  ['John Arne Riize', 'DF', 84, 'NOR', 1980, 'LIV'],
  ['Hossam Hasen', 'FW', 80, 'EGY', 1966, 'XXX'],
  ['Ahmed Hassen', 'MF', 81, 'EGY', 1975, 'XXX'],
  ['Mohamed Ebutrika', 'MF', 82, 'EGY', 1978, 'XXX'],
  ['Zbigniev Boniyek', 'MF', 87, 'POL', 1956, 'JUV'],
  ['Jerzi Dudek', 'GK', 84, 'POL', 1973, 'LIV'],
  ['Jakub Blaşçikovski', 'MF', 83, 'POL', 1985, 'BVB'],
  ['Kaha Kaladzi', 'DF', 85, 'GEO', 1978, 'MIL'],
  ['Giorgi Kinkladzi', 'MF', 83, 'GEO', 1973, 'MCS'],
  ['Ramil Şeydayev', 'FW', 74, 'AZE', 1996, 'XXX'],
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
    const pools = ['TR', 'EN', 'ES', 'DE', 'IT', 'FR', 'XX'];
    const natOf = { TR: 'TUR', EN: 'ENG', ES: 'ESP', DE: 'GER', IT: 'ITA', FR: 'FRA', XX: 'XX' };
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
    return a.length ? a[0].n : 'Lionel Mezzi';
  },
};
