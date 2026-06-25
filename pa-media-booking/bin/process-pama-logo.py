#!/usr/bin/env python3
"""
Process the official PAMA brand mark into site assets.

Source : assets/pama-brand-source.png  (1024x1024, white PA shape + black text on black field)
Outputs:
  pa-logo.png        — square mark, black field (favicon / WP site icon)
  pa-logo-white.png  — white monochrome on transparent (footer, dark surfaces)
  pa-logo-dark.png   — full-color on transparent (header, light surfaces)

Run:  python3 bin/process-pama-logo.py
"""

from __future__ import annotations
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "pama-brand-source.png"

# Pixels at or below this luminance are treated as the outer black field.
_BG_THRESHOLD = 32


def _load_rgba() -> Image.Image:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Place source at {SOURCE}")
    return Image.open(SOURCE).convert("RGBA")


def _lum(r: int, g: int, b: int) -> float:
    return (r + g + b) / 3.0


def _trim(img: Image.Image, pad: int = 8) -> Image.Image:
    """Crop to non-transparent content bbox + padding."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    alpha = img.split()[3]
    bb = alpha.getbbox()
    if not bb:
        return img
    x0, y0, x1, y1 = bb
    return img.crop((
        max(0, x0 - pad),
        max(0, y0 - pad),
        min(img.width, x1 + pad),
        min(img.height, y1 + pad),
    ))


def _is_background(r: int, g: int, b: int) -> bool:
    return _lum(r, g, b) <= _BG_THRESHOLD


def _dark_on_transparent(src: Image.Image) -> Image.Image:
    """Keep white state + black wordmark; drop outer black field."""
    px = src.load()
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    opx = out.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, _a = px[x, y]
            if _is_background(r, g, b):
                continue
            if _lum(r, g, b) > 200:
                opx[x, y] = (255, 255, 255, 255)
            else:
                opx[x, y] = (17, 17, 17, 255)
    return _trim(out, pad=12)


def _white_on_transparent(src: Image.Image) -> Image.Image:
    """Monochrome white mark for dark footer surfaces."""
    px = src.load()
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    opx = out.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, _a = px[x, y]
            if _is_background(r, g, b):
                continue
            strength = 255 if _lum(r, g, b) > 200 else 235
            opx[x, y] = (255, 255, 255, strength)
    return _trim(out, pad=12)


def _square_icon(src: Image.Image, size: int = 512) -> Image.Image:
    """Square favicon — keep black field, scale to size."""
    return src.convert("RGB").resize((size, size), Image.LANCZOS)


def _save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"  Wrote {path.name}  ({path.stat().st_size // 1024} KB, {img.size[0]}x{img.size[1]})")


def main() -> None:
    print(f"Processing {SOURCE.name}...")
    src = _load_rgba()
    _save(_square_icon(src), ASSETS / "pa-logo.png")
    _save(_white_on_transparent(src), ASSETS / "pa-logo-white.png")
    _save(_dark_on_transparent(src), ASSETS / "pa-logo-dark.png")
    print("Done.")


if __name__ == "__main__":
    main()
