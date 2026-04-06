#!/usr/bin/env python3
"""
Align PaHouse / PaSenate GeoJSON legislator name fields with pa-member-photo-map.json
(display_name from palegis roster sync). Keeps GPID/geometry; updates H_FIRSTNAM/H_LASTNAME
or S_FIRSTNAM/S_LASTNAME and PARTY when present.

Run after: python3 scripts/sync-pa-palegis-bio-slugs.py

From repo root:
  python3 scripts/sync-pa-geojson-names-from-photo-map.py
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PM_PATH = ROOT / "data" / "pa-member-photo-map.json"
HOUSE_GEO = ROOT / "data" / "pa-districts" / "PaHouse2024_03.geojson"
SENATE_GEO = ROOT / "data" / "pa-districts" / "PaSenatorial2024_03.geojson"


def split_display(dn: str) -> tuple[str, str]:
    parts = (dn or "").strip().split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return " ".join(parts[:-1]), parts[-1]


def write_js(geo_path: Path, geo_obj: dict, global_name: str, var_base: str) -> None:
    js_path = geo_path.with_suffix(".js")
    blob = json.dumps(geo_obj, separators=(",", ":"))
    text = (
        f"/* Auto-generated from {var_base}.geojson. Do not edit by hand. */\n"
        f"(function(g){{\n  'use strict';\n  g.{global_name} = {blob};\n"
        f"}})(typeof window!=='undefined'?window:this);\n"
    )
    js_path.write_text(text, encoding="utf-8")


def main() -> None:
    pm = json.loads(PM_PATH.read_text(encoding="utf-8"))
    jobs = [
        (HOUSE_GEO, "house", "H_FIRSTNAM", "H_LASTNAME", "HAP_PA_DISTRICTS_HOUSE", "PaHouse2024_03"),
        (SENATE_GEO, "senate", "S_FIRSTNAM", "S_LASTNAME", "HAP_PA_DISTRICTS_SENATE", "PaSenatorial2024_03"),
    ]
    for geo_path, chamber, fk, lk, gname, vbase in jobs:
        geo = json.loads(geo_path.read_text(encoding="utf-8"))
        bucket = pm.get(chamber) or {}
        for feat in geo.get("features", []):
            p = feat.get("properties") or {}
            gpid = str(p.get("GPID", ""))
            row = bucket.get(gpid)
            if not row:
                continue
            if "vacant" in (row.get("name") or "").lower():
                continue
            dn = (row.get("display_name") or "").strip()
            if not dn:
                continue
            first, last = split_display(dn)
            p[fk] = first
            p[lk] = last
            party = row.get("party")
            if party:
                p["PARTY"] = party
        geo_path.write_text(json.dumps(geo, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        write_js(geo_path, geo, gname, vbase)
        print("Wrote", geo_path.name, "and", geo_path.with_suffix(".js").name)


if __name__ == "__main__":
    main()
