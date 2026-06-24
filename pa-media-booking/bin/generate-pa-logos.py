#!/usr/bin/env python3
"""
PA Media Arts — brand asset generator v6.

Design principle: one idea, executed perfectly.

Square  : Dark field. White Pennsylvania silhouette.
          "PAMA" knocked out in dark inside the state.
          The state IS the mark.

Lockup  : State silhouette (height = PAMA cap height) — gap — "PAMA" wordmark
          Sub-label: PENNSYLVANIA MEDIA ARTS in ultra-light below.
          No dividers. No decoration.

Render  : 2× supersampling → LANCZOS downscale.

Run:  python3 bin/generate-pa-logos.py
"""

from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT   = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

# ---------------------------------------------------------------------------
# Pennsylvania — normalized polygon, width=1.0, height≈0.548
# Clockwise from NW. Erie panhandle is the key geographic identifier.
# More control points on the Delaware River east side for smoother curve.
# ---------------------------------------------------------------------------
_PA_POLY = [
    (0.000, 0.153),
    (0.000, 0.000),
    (0.140, 0.000),
    (0.140, 0.153),
    (0.300, 0.142),
    (0.500, 0.137),
    (0.700, 0.134),
    (0.852, 0.132),
    (0.905, 0.104),
    (0.948, 0.072),
    (0.972, 0.130),
    (0.990, 0.210),
    (1.000, 0.310),
    (0.998, 0.390),
    (0.985, 0.470),
    (0.972, 0.548),
    (0.000, 0.548),
]
_PA_H = 0.548


def _pa_pts(cx: float, cy: float, width: float) -> list[tuple[float, float]]:
    h  = width * _PA_H
    ox = cx - width / 2
    oy = cy - h / 2
    return [(ox + nx * width, oy + ny * h) for nx, ny in _PA_POLY]


# ---------------------------------------------------------------------------
# Fonts — Avenir Next Heavy / Ultra Light
# ---------------------------------------------------------------------------
_FONT_STACK = {
    "heavy": [
        ("/System/Library/Fonts/Avenir Next.ttc",          8),
        ("/System/Library/Fonts/Avenir Next.ttc",          0),
        ("/System/Library/Fonts/Avenir.ttc",               5),
        ("/System/Library/Fonts/Supplemental/Futura.ttc",  2),
        ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 0),
    ],
    "light": [
        ("/System/Library/Fonts/Avenir Next.ttc",          10),
        ("/System/Library/Fonts/Avenir Next.ttc",           7),
        ("/System/Library/Fonts/Avenir.ttc",                0),
        ("/System/Library/Fonts/Supplemental/Arial.ttf",   0),
    ],
}


def _font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    for path, idx in _FONT_STACK.get(weight, _FONT_STACK["light"]):
        p = Path(path)
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size=size, index=idx)
            except Exception:
                continue
    return ImageFont.load_default()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _hex_rgba(hex_str: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = hex_str.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha


def _cap_height(font: ImageFont.FreeTypeFont) -> int:
    bb = font.getbbox("H")
    return bb[3] - bb[1]


def _text_width(font: ImageFont.FreeTypeFont, text: str) -> int:
    try:
        return int(font.getlength(text))
    except AttributeError:
        bb = font.getbbox(text)
        return bb[2] - bb[0]


def _tracked_width(font: ImageFont.FreeTypeFont, text: str, tracking: float) -> int:
    total = 0.0
    for i, ch in enumerate(text):
        total += _text_width(font, ch)
        if i < len(text) - 1:
            total += tracking
    return int(total)


def _draw_tracked(
    draw:     ImageDraw.ImageDraw,
    xy:       tuple[float, float],
    text:     str,
    font:     ImageFont.FreeTypeFont,
    fill,
    tracking: float = 0.0,
) -> None:
    x, y = float(xy[0]), float(xy[1])
    for i, ch in enumerate(text):
        draw.text((x, y), ch, font=font, fill=fill)
        x += _text_width(font, ch) + (tracking if i < len(text) - 1 else 0)


# ---------------------------------------------------------------------------
_S = 2   # 2× oversample


# ---------------------------------------------------------------------------
# Square icon
# Concept: the PA state silhouette IS the logo.
#          "PAMA" is knocked out of the state in the background color.
#          One idea. Two layers. No clutter.
# ---------------------------------------------------------------------------
def _make_square() -> Image.Image:
    """
    Square icon / app icon — stacked monogram.

    Composition:
       PA          ← heavy
       MA          ← heavy, same size, optically locked to PA
      ─────        ← thin white rule (separator)
      [PA state]   ← small state silhouette as a geographic badge

    "PA / MA" stacked reads PAMA instantly.
    Readable at 32 px. No clutter.
    """
    SZ = 512 * _S
    BG = (13, 13, 13, 255)
    img = Image.new("RGBA", (SZ, SZ), (0, 0, 0, 0))
    d   = ImageDraw.Draw(img)

    pad = 14 * _S
    rad = int(SZ * 0.20)
    d.rounded_rectangle([(pad, pad), (SZ - pad, SZ - pad)], radius=rad, fill=BG)

    mono_font  = _font("heavy", 112 * _S)
    mono_track = 5 * _S

    pa_cap = _cap_height(mono_font)
    pa_w   = _tracked_width(mono_font, "PA", mono_track)
    ma_w   = _tracked_width(mono_font, "MA", mono_track)
    line_w = max(pa_w, ma_w)

    # Left-align both rows to the same column (block monogram feel)
    block_w   = max(pa_w, ma_w)
    block_x   = (SZ - block_w) // 2    # center the block

    inter_gap = int(pa_cap * 0.12)     # tight — rows feel like one unit
    rule_gap  = int(pa_cap * 0.32)     # breathe below MA
    rule_h    = max(2, 2 * _S)
    state_gap = int(pa_cap * 0.20)

    state_w  = int(block_w * 0.82)
    state_h  = int(state_w * _PA_H)

    total_h = pa_cap + inter_gap + pa_cap + rule_gap + rule_h + state_gap + state_h
    start_y = (SZ - total_h) // 2

    # "PA" row — left-aligned to block
    _draw_tracked(d, (block_x, start_y), "PA", mono_font, "#ffffff", tracking=mono_track)

    # "MA" row — left-aligned to block
    ma_y = start_y + pa_cap + inter_gap
    _draw_tracked(d, (block_x, ma_y), "MA", mono_font, "#ffffff", tracking=mono_track)

    # Thin rule — spans block width
    rule_y = ma_y + pa_cap + rule_gap
    d.line([(block_x, rule_y), (block_x + block_w, rule_y)],
           fill=_hex_rgba("#ffffff", 70), width=rule_h)

    # PA state silhouette
    state_cy = rule_y + rule_h + state_gap + state_h // 2
    d.polygon(_pa_pts(SZ // 2, state_cy, state_w),
              fill=_hex_rgba("#ffffff", 210))

    return img.resize((512, 512), Image.LANCZOS)


# ---------------------------------------------------------------------------
# Horizontal lockup
# Concept: state silhouette (height = PAMA cap height) — space — wordmark.
#          No dividers. No decoration. Clean horizontal alignment.
# ---------------------------------------------------------------------------
def _make_lockup(fg: str) -> Image.Image:
    # Size typography first; everything derives from it.
    pama_font  = _font("heavy", 110 * _S)
    sub_font   = _font("light",  21 * _S)

    pama_text  = "PAMA"
    sub_text   = "PENNSYLVANIA MEDIA ARTS"

    pama_track = 4 * _S
    sub_track  = 4 * _S

    pama_cap   = _cap_height(pama_font)
    sub_cap    = _cap_height(sub_font)
    sub_gap    = 18 * _S

    text_block_h = pama_cap + sub_gap + sub_cap

    # State sized so its cap height (visual height) = PAMA cap height
    state_h  = int(pama_cap * 1.0)
    state_w  = int(state_h / _PA_H)

    pama_w = _tracked_width(pama_font, pama_text, pama_track)
    sub_w  = _tracked_width(sub_font, sub_text, sub_track)
    text_w = max(pama_w, sub_w)

    # Canvas dimensions — generous vertical padding, tight horizontal
    pad_v  = int(pama_cap * 0.65)
    pad_l  = 30 * _S
    gap    = int(state_w * 0.38)   # space between state and wordmark
    pad_r  = 30 * _S

    W = pad_l + state_w + gap + text_w + pad_r
    H = text_block_h + 2 * pad_v

    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d   = ImageDraw.Draw(img)

    # PA state — vertically centered on PAMA cap height (not text block height)
    state_cx = pad_l + state_w // 2
    ty       = (H - text_block_h) // 2   # text block top
    state_cy = ty + pama_cap // 2         # center of state = center of PAMA cap height

    d.polygon(_pa_pts(state_cx, state_cy, state_w), fill=fg)

    # "PAMA" wordmark
    tx = pad_l + state_w + gap
    _draw_tracked(d, (tx, ty), pama_text, pama_font, fill=fg, tracking=pama_track)

    # Sub-label
    sub_fill = (
        _hex_rgba(fg, 130) if fg.lower() in ("#ffffff", "#fff")
        else (115, 115, 113, 255)
    )
    _draw_tracked(
        d, (tx, ty + pama_cap + sub_gap),
        sub_text, sub_font, fill=sub_fill, tracking=sub_track,
    )

    # Downscale
    out = img.resize((W // _S, H // _S), Image.LANCZOS)

    # Autocrop + clean padding
    bb = out.getbbox()
    if bb:
        cp = 10
        out = out.crop((
            max(0, bb[0] - cp),
            max(0, bb[1] - cp),
            min(out.width,  bb[2] + cp),
            min(out.height, bb[3] + cp),
        ))

    return out


# ---------------------------------------------------------------------------
def _save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"  Wrote {path.name}  ({path.stat().st_size // 1024} KB)")


def main() -> None:
    print("Generating PAMA brand assets v6...")
    _save(_make_lockup("#111111"), ASSETS / "pa-logo-dark.png")
    _save(_make_lockup("#ffffff"), ASSETS / "pa-logo-white.png")
    _save(_make_square(),          ASSETS / "pa-logo.png")
    print("Done.")


if __name__ == "__main__":
    main()
