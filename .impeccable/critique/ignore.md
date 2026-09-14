# Impeccable critique — осознанные исключения (VVID.dc.html)
- buried-raster: зерно (SVG-шум data-URI, opacity .05/.13, mix-blend-mode:overlay) поверх фильма — плёночная фактура бренда, не «похороненное» фото.
- cream-palette: #e4ded2 — кремовый бренда (текст тёмных секций, ::selection).
- dark-glow / text-shadow #ffbe6e: тёплый свет фонаря рыбы на заголовке главы 05 (класс .is-lit) — нарратив, включается только в этой главе.
- clipped-overflow-container: html:not(.pre-done){overflow:hidden} — scroll-lock прелоадера; overflow-x:clip на body/корне — защита от горизонтального выноса; overflow:clip у sticky-секций фильма — режут собственные canvas-слои.
- cramped-padding: артефакт статического парсера — padding:clamp(...) читается как 0 (проверено тестом), live-детектор даёт 0.
- low-contrast «#ffffff on #f4ede1 / #ffffff»: ложное — .hero-pill::before (заливка появляется только на hover и меняет цвет текста), .hero-textlink (белая подчёркивающая линия, не фон).
- numbered-section-labels / all-caps-body: моно-eyebrow глав 01–05 и капс-подписи — система глав спуска (рейл, HUD глубины), утверждённый визуальный мир.
