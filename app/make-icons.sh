#!/usr/bin/env bash
# Uygulama ikonlarını store/logo/konseptler/forma.png'den (1024x1024) üretir: bash app/make-icons.sh
# iOS (1024, şeffaflıksız), Android (klasik, yuvarlak, uyarlanabilir ön plan), web ikonları ve açılış ekranları.
# Gerekli: ImageMagick (convert)
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=store/logo/konseptler/forma.png
BG='#0a1530'
RES=app/android/app/src/main/res
IOS=app/ios/App/App/Assets.xcassets

# iOS uygulama simgesi: köşesiz kare, alfa kanalı yok
convert "$SRC" -resize 1024x1024 -background "$BG" -alpha remove -alpha off "$IOS/AppIcon.appiconset/AppIcon-512@2x.png"

# Android: dp başına yoğunluklar
for d in mdpi:1 hdpi:1.5 xhdpi:2 xxhdpi:3 xxxhdpi:4; do
  n=${d%%:*}; k=${d##*:}
  s=$(python3 -c "print(round(48*$k))"); f=$(python3 -c "print(round(108*$k))"); inner=$(python3 -c "print(round(76*$k))")
  r=$(python3 -c "print(round(48*$k*0.18))")
  # klasik: yuvarlatılmış kare
  convert "$SRC" -resize ${s}x${s} \( +clone -alpha extract -fill black -colorize 100 -fill white -draw "roundrectangle 0,0,$((s-1)),$((s-1)),$r,$r" \) -alpha off -compose CopyOpacity -composite "$RES/mipmap-$n/ic_launcher.png"
  # yuvarlak
  convert "$SRC" -resize ${s}x${s} \( +clone -alpha extract -fill black -colorize 100 -fill white -draw "circle $((s/2)),$((s/2)) $((s/2)),0" \) -alpha off -compose CopyOpacity -composite "$RES/mipmap-$n/ic_launcher_round.png"
  # uyarlanabilir ön plan: 108dp tuval, ortada 76dp görsel (maske güvenli alanı)
  convert -size ${f}x${f} xc:none \( "$SRC" -resize ${inner}x${inner} \) -gravity center -composite "$RES/mipmap-$n/ic_launcher_foreground.png"
done
# uyarlanabilir arka plan rengi: görselin kenar rengine yakın lacivert
sed -i 's#<color name="ic_launcher_background">[^<]*</color>#<color name="ic_launcher_background">\#08133A</color>#' "$RES/values/ic_launcher_background.xml"

# Web / PWA
convert "$SRC" -resize 512x512 icons/icon-512.png
convert "$SRC" -resize 192x192 icons/icon-192.png
for s in 512 192; do
  i=$(python3 -c "print(round($s*0.8))")
  convert -size ${s}x${s} xc:'#08133A' \( "$SRC" -resize ${i}x${i} \) -gravity center -composite icons/icon-maskable-$s.png
done
convert "$SRC" -resize 512x512 store/icon-512.png

# Açılış ekranları: lacivert zemin, ortada ikon (yuvarlatılmış) ve StarFoot yazısı
TMPI=$(mktemp --suffix=.png)
splash() { # genişlik yükseklik çıktı
  local W=$1 H=$2 out=$3 z
  z=$(( W < H ? W : H ))
  local is=$(( z * 30 / 100 )) rr=$(( z * 30 / 100 * 22 / 100 ))
  convert "$SRC" -resize ${is}x${is} \( +clone -alpha extract -fill black -colorize 100 -fill white -draw "roundrectangle 0,0,$((is-1)),$((is-1)),$rr,$rr" \) -alpha off -compose CopyOpacity -composite "$TMPI"
  convert -size ${W}x${H} xc:"$BG" "$TMPI" -gravity center -geometry +0-$(( z * 6 / 100 )) -composite "$out"
}
splash 2732 2732 "$IOS/Splash.imageset/splash-2732x2732.png"
cp "$IOS/Splash.imageset/splash-2732x2732.png" "$IOS/Splash.imageset/splash-2732x2732-1.png"
cp "$IOS/Splash.imageset/splash-2732x2732.png" "$IOS/Splash.imageset/splash-2732x2732-2.png"
for d in mdpi:1 hdpi:1.5 xhdpi:2 xxhdpi:3 xxxhdpi:4; do
  n=${d%%:*}; k=${d##*:}
  pw=$(python3 -c "print(round(320*$k))"); ph=$(python3 -c "print(round(480*$k))")
  splash $pw $ph "$RES/drawable-port-$n/splash.png"
  splash $ph $pw "$RES/drawable-land-$n/splash.png"
done
splash 480 320 "$RES/drawable/splash.png"
rm -f "$TMPI"
# 8 bit ve meta verisiz (dosya boyutu)
mogrify -depth 8 -strip "$RES"/mipmap-*/ic_launcher*.png icons/icon-*.png store/icon-512.png
echo "ikonlar ve açılış ekranları üretildi"
