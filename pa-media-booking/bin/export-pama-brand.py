#!/usr/bin/env python3
"""
Export PAMA brand assets for web + social.

PNG (assets/brand/):
  pama-logo-white-transparent.png  — white mark, transparent bg (dark surfaces)
  pama-logo-dark-transparent.png   — dark mark, transparent bg (light surfaces)
  pama-logo-white-on-black.png     — white mark on #000000
  pama-logo-black-on-white.png     — dark mark on #FFFFFF

JPEG social avatars (assets/brand/social/) — black field, circle-safe padding:
  pama-profile-1080-black.jpg        Facebook / Instagram profile (recommended)
  pama-profile-400-black.jpg         Smaller upload / previews
  pama-profile-320-black.jpg         Minimum IG size

Run:  python3 bin/export-pama-brand.py
"""

from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageOps

ROOT   = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
BRAND  = ASSETS / "brand"
SOCIAL = BRAND / "social"
SOURCE = ASSETS / "pama-brand-source.png"

BG_THRESHOLD = 40
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
INK   = (17, 17, 17)


def _load() -> Image.Image:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing {SOURCE}")
    return Image.open(SOURCE).convert("RGBA")


def _trim(img: Image.Image, pad: int = 12) -> Image.Image:
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    bb = img.split()[3].getbbox()
    if not bb:
        return img
    x0, y0, x1, y1 = bb
    return img.crop((
        max(0, x0 - pad), max(0, y0 - pad),
        min(img.width, x1 + pad), min(img.height, y1 + pad),
    ))


def _mark_white_transparent(src: Image.Image) -> Image.Image:
    px, out = src.load(), Image.new("RGBA", src.size, (0, 0, 0, 0))
    opx = out.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, _ = px[x, y]
            lum = (r + g + b) / 3
            if lum > BG_THRESHOLD:
                opx[x, y] = (255, 255, 255, min(255, int(lum)))
    return _trim(out)


def _mark_dark_transparent(src: Image.Image) -> Image.Image:
    px, out = src.load(), Image.new("RGBA", src.size, (0, 0, 0, 0))
    opx = out.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, _ = px[x, y]
            lum = (r + g + b) / 3
            if lum > BG_THRESHOLD:
                opx[x, y] = (*INK, min(255, int(lum)))
    return _trim(out)


def _on_solid(mark: Image.Image, bg: tuple[int, int, int]) -> Image.Image:
    """Center mark on square canvas sized to mark + margin."""
    m = 48
    side = max(mark.width, mark.height) + 2 * m
    canvas = Image.new("RGBA", (side, side), (*bg, 255))
    x = (side - mark.width) // 2
    y = (side - mark.height) // 2
    canvas.paste(mark, (x, y), mark)
    return canvas


def _circle_safe_avatar(mark: Image.Image, size: int, bg: tuple[int, int, int] = BLACK) -> Image.Image:
    """
    Place mark on black square with padding so a circular crop (FB/IG)
    does not clip the PA outline or text. Content ≈ 68% of canvas width.
    """
    canvas = Image.new("RGB", (size, size), bg)
    # Inscribed circle diameter ≈ size; keep art inside ~82% diameter
    target_w = int(size * 0.68)
    scale = target_w / mark.width
    target_h = int(mark.height * scale)
    resized = mark.resize((target_w, target_h), Image.LANCZOS)
    x = (size - target_w) // 2
    y = (size - target_h) // 2
    if resized.mode == "RGBA":
        canvas.paste(resized, (x, y), resized)
    else:
        canvas.paste(resized, (x, y))
    return canvas


def _save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if img.mode == "RGBA":
        img.save(path, "PNG", optimize=True)
    else:
        img.convert("RGB").save(path, "PNG", optimize=True)
    print(f"  PNG  {path.relative_to(ROOT)}  ({path.stat().st_size // 1024} KB, {img.size[0]}×{img.size[1]})")


def _save_jpg(img: Image.Image, path: Path, quality: int = 90) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    print(f"  JPG  {path.relative_to(ROOT)}  ({path.stat().st_size // 1024} KB, {img.size[0]}×{img.size[1]})")


def main() -> None:
    print("Exporting PAMA brand assets...")
    src = _load()
    white_t = _mark_white_transparent(src)
    dark_t  = _mark_dark_transparent(src)

    # —— PNG alternates ——
    _save_png(white_t, BRAND / "pama-logo-white-transparent.png")
    _save_png(dark_t,  BRAND / "pama-logo-dark-transparent.png")
    _save_png(_on_solid(white_t, BLACK), BRAND / "pama-logo-white-on-black.png")
    _save_png(_on_solid(dark_t,  WHITE), BRAND / "pama-logo-black-on-white.png")

    # Also refresh site plugin PNGs
    _save_png(src.convert("RGB").resize((512, 512), Image.LANCZOS), ASSETS / "pa-logo.png")
    _save_png(white_t, ASSETS / "pa-logo-white.png")
    _save_png(dark_t,  ASSETS / "pa-logo-dark.png")

    # —— Social JPEGs (black, circle-safe) ——
    for size, name in ((1080, "pama-profile-1080-black.jpg"),
                       (400,  "pama-profile-400-black.jpg"),
                       (320,  "pama-profile-320-black.jpg")):
        _save_jpg(_circle_safe_avatar(white_t, size), SOCIAL / name)

    # Full-width social cover style (optional branding square post)
    _save_jpg(_circle_safe_avatar(white_t, 1080), SOCIAL / "pama-social-square-1080-black.jpg", quality=88)

    print("Done.")


if __name__ == "__main__":
    main()
