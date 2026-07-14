#!/usr/bin/env python3
"""
Optimize heavy WordPress upload photos for pamedia.art.

Downloads large originals from the live site, writes high-quality JPEG (+ WebP)
grid/hero derivatives into a local staging folder for SFTP upload.

WHO THIS IS FOR: maintainers shipping faster LCP without dropping visual quality.
"""

from __future__ import annotations

import io
import os
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
STAGE = ROOT / ".photo-optimize-stage"
UPLOADS_BASE = "https://pamedia.art/wp-content/uploads"

# Portrait WP intermediates used by the portfolio grid.
PORTRAIT_SIZES = (
    (200, 300),
    (683, 1024),
    (768, 1152),
    (1024, 1536),
    (1365, 2048),
)
LANDSCAPE_SIZES = (
    (300, 200),
    (768, 432),
    (1024, 576),
    (1536, 864),
    (2048, 1152),
)

# Bare / oversized live URLs that currently hurt LCP.
JOBS = [
    {
        "url": f"{UPLOADS_BASE}/2025/12/IMG_5847.png",
        "rel_dir": "2025/12",
        "stem": "IMG_5847",
        "max_edge": 2560,
        "portrait": True,
        "make_scaled": True,
    },
    {
        "url": f"{UPLOADS_BASE}/2025/12/IMG_5960-683x1024.png",
        "rel_dir": "2025/12",
        "stem": "IMG_5960",
        "max_edge": 2048,
        "portrait": True,
        "source_is_size": (683, 1024),
    },
    {
        "url": f"{UPLOADS_BASE}/2025/11/A44D6A70-5E01-43FC-8EA8-C1D8430C6D55-683x1024.png",
        "rel_dir": "2025/11",
        "stem": "A44D6A70-5E01-43FC-8EA8-C1D8430C6D55",
        "max_edge": 2048,
        "portrait": True,
        "source_is_size": (683, 1024),
    },
    {
        "url": f"{UPLOADS_BASE}/2025/11/BC3EB512-5789-4061-90E4-476ADBA6F177-753x1024.png",
        "rel_dir": "2025/11",
        "stem": "BC3EB512-5789-4061-90E4-476ADBA6F177",
        "max_edge": 2048,
        "portrait": True,
        "source_is_size": (753, 1024),
    },
    {
        "url": f"{UPLOADS_BASE}/2025/12/DJI_0423-HDR-scaled.jpg",
        "rel_dir": "2025/12",
        "stem": "DJI_0423-HDR",
        "max_edge": 2560,
        "portrait": False,
        "make_scaled": True,
        "also_overwrite_scaled": True,
    },
]


def fetch(url: str) -> bytes:
    """Download via curl — more reliable than urllib on macOS Python SSL setups."""
    import subprocess

    try:
        proc = subprocess.run(
            ["curl", "-fsSL", "-A", "PAMediaPhotoOptimize/1.0", url],
            check=True,
            capture_output=True,
            timeout=180,
        )
        return proc.stdout
    except Exception:
        # Fallback for environments without curl.
        req = urllib.request.Request(url, headers={"User-Agent": "PAMediaPhotoOptimize/1.0"})
        ctx = None
        try:
            import ssl

            ctx = ssl.create_default_context()
        except Exception:
            ctx = None
        with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
            return resp.read()


def open_image(data: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(data))
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA", "P"):
        rgba = img.convert("RGBA")
        bg = Image.new("RGB", rgba.size, (246, 246, 244))
        bg.paste(rgba, mask=rgba.split()[-1])
        return bg
    return img.convert("RGB")


def save_jpeg(img: Image.Image, path: Path, quality: int = 82) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(
        path,
        format="JPEG",
        quality=quality,
        optimize=True,
        progressive=True,
        subsampling=1,
    )


def save_webp(img: Image.Image, path: Path, quality: int = 80) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="WEBP", quality=quality, method=6)


def fit(img: Image.Image, w: int, h: int) -> Image.Image:
    return ImageOps.fit(img, (w, h), method=Image.Resampling.LANCZOS)


def shrink_max(img: Image.Image, max_edge: int) -> Image.Image:
    w, h = img.size
    edge = max(w, h)
    if edge <= max_edge:
        return img
    scale = max_edge / float(edge)
    return img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)


def process_job(job: dict) -> list[Path]:
    print(f"Fetching {job['url']} ...")
    data = fetch(job["url"])
    print(f"  downloaded {len(data):,} bytes")
    img = open_image(data)
    img = shrink_max(img, int(job.get("max_edge", 2560)))
    out_dir = STAGE / "uploads" / job["rel_dir"]
    written: list[Path] = []
    stem = job["stem"]

    if job.get("make_scaled") or job.get("also_overwrite_scaled"):
        scaled = shrink_max(img, 2560)
        # Match WP “scaled” long-edge behavior for landscape/portrait.
        path = out_dir / f"{stem}-scaled.jpg"
        save_jpeg(scaled, path, quality=82)
        save_webp(scaled, out_dir / f"{stem}-scaled.webp", quality=80)
        written.extend([path, out_dir / f"{stem}-scaled.webp"])
        print(f"  wrote {path.name} ({path.stat().st_size:,} B)")

    sizes = PORTRAIT_SIZES if job.get("portrait", True) else LANDSCAPE_SIZES
    for w, h in sizes:
        if max(img.size) < max(w, h) * 0.9 and job.get("source_is_size") == (w, h):
            # Source already is this size — still recompress as JPEG.
            pass
        path = out_dir / f"{stem}-{w}x{h}.jpg"
        save_jpeg(fit(img, w, h), path, quality=82)
        webp = out_dir / f"{stem}-{w}x{h}.webp"
        save_webp(fit(img, w, h), webp, quality=78)
        written.extend([path, webp])
        print(f"  wrote {path.name} ({path.stat().st_size:,} B)")

    # Always keep a readable “full” JPEG under the original basename for remaps.
    full = out_dir / f"{stem}.jpg"
    save_jpeg(img, full, quality=84)
    save_webp(img, out_dir / f"{stem}.webp", quality=80)
    written.extend([full, out_dir / f"{stem}.webp"])
    print(f"  wrote {full.name} ({full.stat().st_size:,} B)")
    return written


def main() -> int:
    STAGE.mkdir(parents=True, exist_ok=True)
    all_written: list[Path] = []
    for job in JOBS:
        try:
            all_written.extend(process_job(job))
        except Exception as exc:  # noqa: BLE001 — report and continue other jobs
            print(f"ERROR {job['url']}: {exc}", file=sys.stderr)

    # Plugin lane still.
    lane = ROOT / "assets" / "media" / "lane-weddings.jpg"
    if lane.is_file():
        img = open_image(lane.read_bytes())
        img = shrink_max(img, 1600)
        save_jpeg(img, lane, quality=82)
        webp = ROOT / "assets" / "media" / "lane-weddings.webp"
        save_webp(img, webp, quality=80)
        print(f"Optimized plugin asset {lane} ({lane.stat().st_size:,} B) + {webp.name}")

    manifest = STAGE / "manifest.txt"
    manifest.write_text("\n".join(str(p.relative_to(STAGE)) for p in all_written) + "\n")
    print(f"\nStaged {len(all_written)} files under {STAGE}")
    print("Upload with: bash bin/upload-optimized-photos.sh")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
