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
# CLARITY_PROFILE="0:.55,170:.55,215:.3,240:.45,330:.45,370:.25,480:.25" — точки «кадр(в масштабе 480):сила», между ними линейно; задана → ramp игнорируется
prof=os.environ.get('CLARITY_PROFILE','').strip(); pts=None
if prof:
    pts=sorted((float(a)*n/480.0, float(b)) for a,b in (x.split(':') for x in prof.split(',')))
def strength(i):
    if pts:
        if i<=pts[0][0]: return pts[0][1]
        for (x0,y0),(x1,y1) in zip(pts,pts[1:]):
            if x0<=i<=x1: return y0+(y1-y0)*(i-x0)/max(1e-6,x1-x0)
        return pts[-1][1]
    return A if i<=r0 else (B if i>=r1 else A+(B-A)*(i-r0)/max(1,r1-r0))
# Тонкая резкость (деталь): FINE_R — радиус в px при ширине 1920 (масштабируется, но не меньше .9 px), FINE_S — сила в %, FINE_T — порог. 0 — выключить.
# Нужна потому, что 1080p-кадр на retina растягивается в 1.3–1.6 раза: без неё деталь «плывёт». +8…15 % байт webp.
FR=float(os.environ.get('FINE_R','1.3')); FS=int(os.environ.get('FINE_S','50')); FT=int(os.environ.get('FINE_T','1'))
for i,f in enumerate(files):
    s = strength(i)
    im=Image.open(f).convert('RGB'); rad=R*im.width/1920   # радиус пропорционален ширине кадра
    im=im.filter(ImageFilter.UnsharpMask(radius=rad,percent=int(round(s*100)),threshold=0))
    if FR>0 and FS>0: im=im.filter(ImageFilter.UnsharpMask(radius=max(0.9,FR*im.width/1920),percent=FS,threshold=FT))
    im.save(f,compress_level=1)
print(f'clarity: {n} кадров, R={R}, ' + (f'профиль {prof}' if pts else f'{A}→{B} на кадрах {r0}–{r1}') + f'; fine r={FR} {FS}% t={FT}')
