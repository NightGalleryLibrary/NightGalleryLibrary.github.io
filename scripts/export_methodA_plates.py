#!/usr/bin/env python3
"""Export Method A chrome twins into Night Gallery Library plates/.

Reads plates.json, cover-fits LANCZOS JPEGs at gallery sizes from
geom_batch8 / geom_batch_rest / geom_locked_A_* Method A sources.
Keeps 03_persephone assets untouched. Regenerates number-blur only
when that file already exists in plates/.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageFilter

SITE = Path("/workspace/NightGalleryLibrary.github.io")
PLATES_DIR = SITE / "plates"
PLATES_JSON = SITE / "plates.json"
TWINS = Path(
    "/workspace/coloring-books/book1_final/out/framed8/twins_lift"
)
BATCH8 = TWINS / "geom_batch8"
BATCH_REST = TWINS / "geom_batch_rest"

SIZES = {
    "card": (560, 725),
    "hero": (1200, 1553),
    "thumb": (80, 104),
    "blur": (32, 41),
}
QUALITY = {
    "card": 84,
    "hero": 84,
    "thumb": 78,
    "blur": 70,
}

BATCH8_STEMS = {
    "01_medusa",
    "02_hecate",
    "04_circe",
    "05_minotaur",
    "06_cerberus",
    "07_hydra",
    "08_sirens",
    "09_chimera",
}
LOCKED_A = {
    "35_centaur": TWINS / "geom_locked_A_centaur",
    "36_harpy": TWINS / "geom_locked_A_harpy",
    "37_kraken": TWINS / "geom_locked_A_kraken",
}


def cover_fit(im: Image.Image, tw: int, th: int) -> Image.Image:
    """LANCZOS cover-fit, centered crop to exact tw×th."""
    if im.mode not in ("RGB", "L"):
        im = im.convert("RGB")
    elif im.mode == "L":
        im = im.convert("RGB")
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    nw = max(1, int(round(sw * scale)))
    nh = max(1, int(round(sh * scale)))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (resized.width - tw) // 2
    top = (resized.height - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def save_jpeg(im: Image.Image, path: Path, kind: str) -> None:
    q = QUALITY[kind]
    im = im.convert("RGB")
    im.save(
        path,
        format="JPEG",
        quality=q,
        optimize=True,
        progressive=True,
        subsampling=2,
    )


def make_variants(src: Image.Image, out_stem: str, prefix: str = "") -> list[str]:
    """Write card/hero/thumb/blur (blur always for color; caller gates number-blur).

    prefix: '' for color, 'number-' for numbered.
    Returns list of written filenames.
    """
    written = []
    variants = [
        ("card", f"{out_stem}-{prefix}card.jpg"),
        ("hero", f"{out_stem}-{prefix}hero.jpg"),
        ("thumb", f"{out_stem}-{prefix}thumb.jpg"),
    ]
    thumbs = {}
    for kind, name in variants:
        tw, th = SIZES[kind]
        fitted = cover_fit(src, tw, th)
        dest = PLATES_DIR / name
        save_jpeg(fitted, dest, kind)
        written.append(name)
        if kind == "thumb":
            thumbs[prefix] = fitted

    blur_name = f"{out_stem}-{prefix}blur.jpg"
    blur_path = PLATES_DIR / blur_name
    if prefix == "":
        # always write color blur
        tiny = cover_fit(src, *SIZES["blur"])
        blurred = tiny.filter(ImageFilter.GaussianBlur(radius=2.5))
        save_jpeg(blurred, blur_path, "blur")
        written.append(blur_name)
    elif blur_path.exists():
        # number-blur only if already present
        tiny = cover_fit(src, *SIZES["blur"])
        blurred = tiny.filter(ImageFilter.GaussianBlur(radius=2.5))
        save_jpeg(blurred, blur_path, "blur")
        written.append(blur_name)

    return written


def resolve_color_source(stem: str) -> Path | None:
    if stem in BATCH8_STEMS:
        p = BATCH8 / stem / "recolored_chrome_framed.png"
        return p if p.is_file() else None
    if stem in LOCKED_A:
        base = LOCKED_A[stem]
        candidates = [
            base / "recolored_lineart_chrome_framed.png",
            base / "recolored_chrome_framed.png",
            base / "chrome_pipeline" / "recolored_chrome_framed.png",
            base / "chrome_pipeline_smoke" / "recolored_chrome_framed.png",
            # "color framed with chrome if present"
            base / "color_pA_framed.png",
            base / "color_framed.png",
        ]
        for c in candidates:
            if c.is_file():
                return c
        return None
    # rest (and anything else except persephone)
    p = BATCH_REST / stem / "recolored_chrome_framed.png"
    return p if p.is_file() else None


def resolve_numbered_source(stem: str) -> Path | None:
    if stem in BATCH8_STEMS:
        p = BATCH8 / stem / "numbered_chrome_framed.png"
        return p if p.is_file() else None
    if stem in LOCKED_A:
        base = LOCKED_A[stem]
        candidates = [
            base / "numbered_lineart_chrome_framed.png",
            base / "chrome_pipeline" / "numbered_chrome_framed.png",
            base / "numbered_chrome_framed.png",
        ]
        for c in candidates:
            if c.is_file():
                return c
        return None
    p = BATCH_REST / stem / "numbered_chrome_framed.png"
    return p if p.is_file() else None


def main() -> int:
    data = json.loads(PLATES_JSON.read_text())
    plates = data["plates"]
    overwritten = 0
    kept = 0
    missing: list[str] = []
    details: list[str] = []

    for plate in plates:
        stem = plate["stem"]
        pid = plate["id"]
        if stem == "03_persephone":
            kept += 1
            details.append(f"KEEP  {pid} ({stem})")
            continue

        color_src = resolve_color_source(stem)
        num_src = resolve_numbered_source(stem)
        if color_src is None:
            missing.append(f"{pid}: color source missing for {stem}")
        if num_src is None:
            missing.append(f"{pid}: numbered source missing for {stem}")
        if color_src is None or num_src is None:
            details.append(f"MISS  {pid} color={color_src} num={num_src}")
            continue

        color_im = Image.open(color_src)
        num_im = Image.open(num_src)
        written = []
        written += make_variants(color_im, pid, prefix="")
        written += make_variants(num_im, pid, prefix="number-")
        overwritten += 1
        details.append(
            f"OK    {pid}  color={color_src.name}  num={num_src.name}  "
            f"files={len(written)}"
        )
        # also note which locked path was used
        if stem in LOCKED_A:
            details[-1] += f"  [{color_src.parent.name}/{color_src.name}]"

    print("=== Method A plate export ===")
    print(f"plates total:     {len(plates)}")
    print(f"overwritten:      {overwritten}")
    print(f"kept (persephone):{kept}")
    print(f"missing sources:  {len(missing)}")
    print()
    for line in details:
        print(line)
    if missing:
        print()
        print("--- missing ---")
        for m in missing:
            print(m)

    # quick size check on a few
    print()
    print("--- size verify sample ---")
    samples = [
        "medusa-card.jpg",
        "medusa-hero.jpg",
        "medusa-thumb.jpg",
        "medusa-blur.jpg",
        "medusa-number-card.jpg",
        "centaur-card.jpg",
        "harpy-hero.jpg",
        "kraken-number-thumb.jpg",
        "anubis-card.jpg",
    ]
    for name in samples:
        path = PLATES_DIR / name
        if not path.is_file():
            print(f"MISSING FILE {name}")
            continue
        with Image.open(path) as im:
            print(f"{name}: {im.size}")

    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
