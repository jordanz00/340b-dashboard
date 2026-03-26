#!/usr/bin/env python3
"""
100x Upgrade — Revert dashboard to state in backup/dashboard_backup.zip.
Usage: python3 scripts/revert_dashboard.py
Or say: "revert back to formula"
"""
from __future__ import annotations

import shutil
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ZIP_PATH = ROOT / "backup" / "dashboard_backup.zip"


def main() -> int:
    if not ZIP_PATH.exists():
        print(f"Backup not found: {ZIP_PATH}")
        print("Run scripts/backup_dashboard.py first.")
        return 1
    with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
        with zipfile.ZipFile(ZIP_PATH, "r") as zf:
            zf.extractall(tmp)
        for name in Path(tmp).iterdir():
            dest = ROOT / name.name
            if dest.exists():
                if dest.is_file():
                    dest.unlink()
                else:
                    shutil.rmtree(dest)
            shutil.move(str(name), str(dest))
    print("Dashboard reverted to backup state.")
    return 0


if __name__ == "__main__":
    exit(main())
