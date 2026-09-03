# Night Garden Library — Myths & Monsters

A static nave. No build step, no React, no bundler.

This directory is the GitHub Pages site for
[NightGalleryLibrary.github.io](https://github.com/NightGalleryLibrary/NightGalleryLibrary.github.io).

## Serving

GitHub Pages is served from the **root of `main**.

1. Push these files to the repository root (`index.html` at `/`, not in a subfolder).
2. In the repo: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **`main`**
   - Folder: **`/ (root)`**
3. The live site is `https://nightgallerylibrary.github.io/`

Local preview (optional):

```
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080/`. The page starts on black; there is no white flash.

## Layout

```
index.html          threshold, rose, nave, chapel
css/nave.css
js/threshold.js     gold hairline + greek-key + Cinzel line
js/sun.js           damped pointer / drag / scroll-walk / opt-in tilt
js/caustics.js      WebGL floor puddles + rose projection
js/glass.js         stained-glass pass (UV warp, chroma, Persephone flood)
js/nave.js          Lenis aisle + lancet press
js/chapel.js        FLIP morph from lancet, missal, swipe, return hairline
js/main.js          boot
vendor/             GSAP 3.12.5, ScrollTrigger, Lenis 1.3.23
fonts/              Cinzel, Cormorant Garamond (woff2, self-hosted)
plates/             hero / card / blur JPEGs, plus rose-roundel
img/grain-256.png   mix-blend grain
```

No Amazon, no price, no sequels. Forty windows. The rest live in the book.
