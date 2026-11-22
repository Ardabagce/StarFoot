#!/bin/bash
# Bilibili ana video: 1920x1080, 30 fps, H.264 + AAC
set -e
cd "$(dirname "$0")"
F=frames; T=tmp; mkdir -p $T
VF="-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30"
# yuvarlak köşeli maske (telefon iç ekranı 431x932, köşe yarıçapı 42)
ffmpeg -v error -y -f lavfi -i "color=black:s=431x932,format=gray" -vf "geq=lum='if(lte(hypot(max(0,max(42-X,X-(W-43))),max(0,max(42-Y,Y-(H-43)))),42),255,0)'" -frames:v 1 $T/mask.png

still() { # $1 png, $2 süre, $3 çıktı  (hafif yakınlaşma)
  ffmpeg -v error -y -loop 1 -t $2 -i $1 -vf "scale=2112:-1,zoompan=z='min(zoom+0.0006,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,fade=t=in:st=0:d=0.4" $VF $3
}
seg() { # $1 ad, $2 başlangıç, $3 süre
  ffmpeg -v error -y -loop 1 -t $3 -i $F/seg-$1.png -ss $2 -t $3 -i $1.webm -i $T/mask.png \
    -filter_complex "[1]crop=390:844:0:0,scale=431:932:flags=lanczos,fps=30,format=rgba[v];[2]format=gray[m];[v][m]alphamerge[vm];[0][vm]overlay=1254:74:shortest=1,fade=t=in:st=0:d=0.35" $VF $T/s-$1.mp4
}
still $F/title.png 3.6 $T/a0.mp4
seg penalty 2.6 7.2
seg dribble 2.6 10.6
seg freekick 10.6 7.2
seg shop 2.2 7.6
still $F/slide-1.png 4.6 $T/a5.mp4
still $F/slide-2.png 4.6 $T/a6.mp4
still $F/end.png 4.4 $T/a7.mp4
printf "file 'a0.mp4'\nfile 's-penalty.mp4'\nfile 's-dribble.mp4'\nfile 's-freekick.mp4'\nfile 's-shop.mp4'\nfile 'a5.mp4'\nfile 'a6.mp4'\nfile 'a7.mp4'\n" > $T/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $T/list.txt -c copy $T/video.mp4
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $T/video.mp4)
# ses: menü müziği (CC0) + düşük tribün sesi (CC-BY 4.0), sonda kısılır
ffmpeg -v error -y -i $T/video.mp4 -stream_loop -1 -i /home/user/StarFoot/snd/menu.mp3 -stream_loop -1 -i /home/user/StarFoot/snd/crowd.mp3 \
  -filter_complex "[1]volume=0.55,atrim=0:$DUR[m];[2]volume=0.18,atrim=0:$DUR[c];[m][c]amix=inputs=2:normalize=0,afade=t=in:st=0:d=1,afade=t=out:st=$(echo "$DUR-2" | bc):d=2[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest starfoot-bilibili-zh.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 starfoot-bilibili-zh.mp4
