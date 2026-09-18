#!/usr/bin/env python3
"""Локальный контраст («clarity») для кадров hero: большой радиус нерезкой маски.
Сила по кадрам: CLARITY_A (по умолчанию .55) до кадра RAMP_FROM, линейно к CLARITY_B (.25) к кадру RAMP_TO, дальше CLARITY_B.
Мягкая глава 01 (глина в движении) получает больше, стеклянный лотос — меньше. Применяется к PNG в папке (in place).
Использование: FRAME_FILTER=film-src/hero-clarity.py  (video2film.sh вызывает: python3 $FRAME_FILTER <dir>)"""
import os, sys, glob
from PIL import Image, ImageFilter
d=sys.argv[1]; files=sorted(glob.glob(os.path.join(d,'f_*.png'))); n=len(files)
R=float(os.environ.get('CLARITY_R','28')); A=float(os.environ.get('CLARITY_A','.55')); B=float(os.environ.get('CLARITY_B','.25'))
r0=int(os.environ.get('RAMP_FROM',str(round(n*0.354)))); r1=int(os.environ.get('RAMP_TO',str(round(n*0.448))))   # 170/480 → 215/480
for i,f in enumerate(files):
    s = A if i<=r0 else (B if i>=r1 else A+(B-A)*(i-r0)/max(1,r1-r0))
    im=Image.open(f).convert('RGB'); rad=R*im.width/1920   # радиус пропорционален ширине кадра
    im.filter(ImageFilter.UnsharpMask(radius=rad,percent=int(round(s*100)),threshold=0)).save(f,compress_level=1)
print(f'clarity: {n} кадров, R={R}, {A}→{B} на кадрах {r0}–{r1}')
