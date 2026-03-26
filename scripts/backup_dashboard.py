#!/usr/bin/env python3
"""
100x Upgrade — Backup dashboard files to backup/dashboard_backup.zip.
Run before major changes or on project start.
"""
from __future__ import annotations

import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKUP_DIR = ROOT / "backup"
ZIP_PATH = BACKUP_DIR / "dashboard_backup.zip"

DASHBOARD_ITEMS = [
    "340b.html",
    "340b.css",
    "340b.js",
    "state-data.js",
    "print.html",
    "print-view.css",
    "assets",
]


def main() -> int:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for name in DASHBOARD_ITEMS:
            path = ROOT / name
            if path.is_file():
                zf.write(path, path.name)
            elif path.is_dir():
                for f in path.rglob("*"):
                    if f.is_file():
                        arcname = f.relative_to(ROOT)
                        zf.write(f, arcname)
    print(f"Backup created: {ZIP_PATH}")
    return 0


if __name__ == "__main__":
    exit(main())
