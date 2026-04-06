#!/usr/bin/env python3
"""
Reconcile data/pa-member-photo-map.json with PaHouse2024_03.js / PaSenatorial2024_03.js.

- Sets each GPID "name" to PA map order: "{LAST} {FIRST}" from GeoJSON properties.
- Vacant districts: name "Vacant", img_id and bio_id null.
- If the previous map row appears to be the same person as GeoJSON (surname / token
  overlap), keep img_id and bio_id; otherwise clear img_id and bio_id so the UI
  shows initials instead of a wrong portrait.

Run from repo root:
  python3 scripts/reconcile-pa-photo-map-from-geo.py
  python3 scripts/regenerate-pa-photo-map-js.py
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHOTO_MAP_PATH = ROOT / "data" / "pa-member-photo-map.json"
HOUSE_JS = ROOT / "data" / "pa-districts" / "PaHouse2024_03.js"
SENATE_JS = ROOT / "data" / "pa-districts" / "PaSenatorial2024_03.js"


def extract_geojson_from_pa_js(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    idx = text.find("= ")
    if idx < 0:
        raise ValueError(path.name)
    idx += 2
    end = text.find("})(typeof", idx)
    if end < 0:
        end = text.rfind(");")
    blob = text[idx:end].strip()
    if blob.endswith(";"):
        blob = blob[:-1].strip()
    return json.loads(blob)


def token_set(*parts: str) -> set[str]:
    s: set[str] = set()
    for p in parts:
        for w in re.split(r"[^\w]+", p.lower()):
            if len(w) > 1:
                s.add(w)
    return s


def pa_map_last_first_tokens(pm_name: str) -> tuple[str, set[str]]:
    parts = (pm_name or "").strip().split()
    if not parts:
        return "", set()
    last = re.sub(r"[^\w]", "", parts[0].lower())
    given = token_set(" ".join(parts[1:])) if len(parts) > 1 else set()
    return last, given


def geo_family_token(last_field: str) -> str:
    t = (last_field or "").strip().lower().split()
    return re.sub(r"[^\w]", "", t[-1]) if t else ""


def same_person(pm_name: str, geo_first: str, geo_last: str) -> bool:
    """True if existing map name likely refers to the same member as GeoJSON first/last."""
    pm_dec = html.unescape(pm_name or "").strip()
    geo_full = f"{geo_first} {geo_last}".strip()
    if not pm_dec or not geo_full:
        return False
    a, b = token_set(pm_dec), token_set(geo_full)
    map_last, _ = pa_map_last_first_tokens(pm_dec)
    geo_last_t = geo_family_token(geo_last)
    gll = re.sub(r"\s+", "", (geo_last or "").lower())
    last_names_align = bool(
        map_last
        and geo_last_t
        and (
            map_last == geo_last_t
            or map_last in gll
            or geo_last_t in map_last
        )
    )
    if last_names_align:
        return True
    if not a or not b:
        return False
    inter = len(a & b)
    union = len(a | b)
    return bool(union and inter / union >= 0.25)


def canonical_name(geo_first: str, geo_last: str) -> str:
    f, l = (geo_first or "").strip(), (geo_last or "").strip()
    if f.lower() == "vacant" and l.lower() == "vacant":
        return "Vacant"
    return f"{l} {f}".strip()


def is_vacant(geo_first: str, geo_last: str) -> bool:
    return (geo_first or "").strip().lower() == "vacant" and (geo_last or "").strip().lower() == "vacant"


def reconcile_chamber(
    pmap: dict,
    chamber: str,
    geo: dict,
    first_key: str,
    last_key: str,
    stats: dict,
) -> None:
    bucket = pmap.setdefault(chamber, {})
    for feat in geo.get("features", []):
        pr = feat.get("properties") or {}
        gpid = pr.get("GPID")
        if gpid is None:
            continue
        gk = str(gpid)
        if gk not in bucket:
            continue
        geo_first = str(pr.get(first_key, "") or "")
        geo_last = str(pr.get(last_key, "") or "")
        new_name = canonical_name(geo_first, geo_last)
        entry = bucket[gk]
        old_name = (entry.get("name") or "").strip()

        if is_vacant(geo_first, geo_last):
            entry["name"] = "Vacant"
            entry["img_id"] = None
            entry["bio_id"] = None
            stats["vacant"] += 1
            if old_name != "Vacant" or entry.get("img_id") is not None:
                stats["changed"] += 1
            continue

        entry["name"] = new_name
        if same_person(old_name, geo_first, geo_last):
            stats["kept_portrait"] += 1
            if old_name != new_name:
                stats["name_only"] += 1
        else:
            entry["img_id"] = None
            entry["bio_id"] = None
            stats["cleared_portrait"] += 1
            stats["changed"] += 1


def main() -> int:
    pmap = json.loads(PHOTO_MAP_PATH.read_text(encoding="utf-8"))
    stats = {
        "vacant": 0,
        "kept_portrait": 0,
        "name_only": 0,
        "cleared_portrait": 0,
        "changed": 0,
    }

    house_geo = extract_geojson_from_pa_js(HOUSE_JS)
    senate_geo = extract_geojson_from_pa_js(SENATE_JS)

    reconcile_chamber(pmap, "house", house_geo, "H_FIRSTNAM", "H_LASTNAME", stats)
    reconcile_chamber(pmap, "senate", senate_geo, "S_FIRSTNAM", "S_LASTNAME", stats)

    PHOTO_MAP_PATH.write_text(json.dumps(pmap, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print("PA photo map reconciled from district GeoJSON.")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    print("Wrote", PHOTO_MAP_PATH)
    return 0


if __name__ == "__main__":
    sys.exit(main())
