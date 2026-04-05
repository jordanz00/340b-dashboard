#!/usr/bin/env python3
"""Rebuild data/pa-member-photo-map.js from data/pa-member-photo-map.json (run from repo root)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = ROOT / "data" / "pa-member-photo-map.json"
dst = ROOT / "data" / "pa-member-photo-map.js"
header = """/**
 * PA legislator photo ID map — mirrors pa-member-photo-map.json (edit JSON, then regenerate this file).
 * See dashboard-audit.py docstring: mobile executable avoids fetch(); this script sets window.HAP_PA_MEMBER_PHOTO_MAP.
 * Regenerate from repo root: python3 scripts/regenerate-pa-photo-map-js.py
 */
"""
data = json.loads(src.read_text(encoding="utf-8"))
dst.write_text(header + "window.HAP_PA_MEMBER_PHOTO_MAP = " + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
print("Wrote", dst, dst.stat().st_size, "bytes")
