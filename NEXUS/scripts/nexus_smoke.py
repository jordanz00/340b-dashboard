#!/usr/bin/env python3
"""
NEXUS static smoke checks — no browser required.
Run from repo root: python3 NEXUS/scripts/nexus_smoke.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    nexus = root / "NEXUS"
    if not nexus.is_dir():
        print("FAIL: NEXUS directory missing", file=sys.stderr)
        return 1

    failures: list[str] = []

    index = nexus / "index.html"
    if not index.exists():
        failures.append("index.html missing")
    else:
        text = index.read_text(encoding="utf-8", errors="replace")
        for needle in ("js/engine.js", "NX.compileScenes", "vendor/butterchurn.min.js"):
            if needle not in text:
                failures.append(f"index.html missing marker: {needle!r}")
        if "session-seed.js" not in text:
            failures.append("index.html should load session-seed.js")

    engine = nexus / "js" / "engine.js"
    if not engine.exists():
        failures.append("js/engine.js missing")
    else:
        et = engine.read_text(encoding="utf-8", errors="replace")
        if "setCommonUniforms" not in et:
            failures.append("engine.js: setCommonUniforms missing")
        if "dnaX" not in et and "DNA" not in et:
            failures.append("engine.js: expected DNA / dna state")

    scenes = nexus / "js" / "scenes.js"
    if scenes.exists():
        st = scenes.read_text(encoding="utf-8", errors="replace")
        if "uniform vec4 DNA" not in st and "uniform float DNA" not in st:
            if "DNA" not in st:
                failures.append("scenes.js: DNA uniform not found in HEAD")

    seed = nexus / "js" / "nexus-engine" / "session-seed.js"
    if not seed.exists():
        failures.append("session-seed.js missing")

    meyda = nexus / "js" / "nexus-engine" / "meyda-analyzer.js"
    if not meyda.exists():
        failures.append("meyda-analyzer.js missing")

    meyda_vendor = nexus / "vendor" / "meyda.min.js"
    if not meyda_vendor.exists():
        failures.append("vendor/meyda.min.js missing (run curl from THIRD_PARTY_NOTICES or vendor README)")

    docs = [
        nexus / "docs" / "SHIP-CRITERIA.md",
        nexus / "docs" / "QA-MATRIX.md",
        nexus / "THIRD_PARTY_NOTICES.md",
        nexus / "docs" / "OSS-SPIKE-2-COMPOSITOR.md",
    ]
    for p in docs:
        if not p.exists():
            failures.append(f"missing doc: {p.relative_to(nexus)}")

    presets = nexus / "js" / "presets.js"
    if presets.exists():
        pt = presets.read_text(encoding="utf-8", errors="replace")
        if "sessionSeed" not in pt:
            failures.append("presets.js should persist sessionSeed in capture/apply")

    if failures:
        print("NEXUS smoke: FAIL", file=sys.stderr)
        for f in failures:
            print(" -", f, file=sys.stderr)
        return 1

    print("NEXUS smoke: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
