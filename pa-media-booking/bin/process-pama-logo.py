#!/usr/bin/env python3
"""
Copy the official PAMA brand mark into site assets without reprocessing.

The source file is used as-is (black field, white PA shape, black wordmark).
Do not strip backgrounds or recolor — that breaks legibility.

Source : assets/pama-brand-source.png
Outputs:
  pa-logo.png        — 512×512 favicon / site icon
  pa-logo-dark.png   — full source (header)
  pa-logo-white.png  — full source (footer — same mark)

Run:  python3 bin/process-pama-logo.py
"""

from __future__ import annotations
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "pama-brand-source.png"
ICON_SIZE = 512


def _load_rgb() -> Image.Image:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Place source at {SOURCE}")
    return Image.open(SOURCE).convert("RGB")


def _save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"  Wrote {path.name}  ({path.stat().st_size // 1024} KB, {img.size[0]}x{img.size[1]})")


def main() -> None:
    print(f"Copying {SOURCE.name} as-is...")
    src = _load_rgb()
    _save(src.resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS), ASSETS / "pa-logo.png")
    _save(src, ASSETS / "pa-logo-dark.png")
    _save(src, ASSETS / "pa-logo-white.png")
    print("Done.")


if __name__ == "__main__":
    main()
