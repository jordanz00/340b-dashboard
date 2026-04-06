#!/usr/bin/env python3
"""
Verify legislator headshot wiring: PA federal delegation Bioguide IDs vs GovTrack,
JPEG files on disk, and PA General Assembly photo map vs district GeoJSON names.

Run from repo root: python3 scripts/verify-headshots.py

Requires network for GovTrack (federal cross-check). GeoJSON is read locally.
"""
from __future__ import annotations

import json
import re
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MOBILE_JS = ROOT / "340b-mobile.js"
CONGRESS_DIR = ROOT / "images" / "headshots" / "congress"
PHOTO_MAP = ROOT / "data" / "pa-member-photo-map.json"
HOUSE_JS = ROOT / "data" / "pa-districts" / "PaHouse2024_03.js"
SENATE_JS = ROOT / "data" / "pa-districts" / "PaSenatorial2024_03.js"

GOVTRACK_ROLES = "https://www.govtrack.us/api/v2/role?current=true&state=PA&limit=600"


def parse_pa_delegation_from_mobile_js() -> list[dict]:
    text = MOBILE_JS.read_text(encoding="utf-8")
    m = re.search(r"window\._PA_DELEGATION_DATA\s*=\s*(\[[\s\S]*?\])\s*;", text)
    if not m:
        print("FAIL: could not find _PA_DELEGATION_DATA in 340b-mobile.js", file=sys.stderr)
        sys.exit(1)
    blob = m.group(1)
    # Quote unquoted JS object keys so json.loads accepts the array.
    blob = re.sub(r"([\{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:", r'\1"\2":', blob)
    return json.loads(blob)


def fetch_govtrack_pa() -> dict:
    req = urllib.request.Request(GOVTRACK_ROLES, headers={"User-Agent": "HAP-dashboard-verify/1.0"})
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=45, context=ctx) as r:
            return json.loads(r.read().decode())
    except (ssl.SSLError, urllib.error.URLError):
        ctx = ssl._create_unverified_context()
        with urllib.request.urlopen(req, timeout=45, context=ctx) as r:
            return json.loads(r.read().decode())


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
    s = set()
    for p in parts:
        for w in re.split(r"[^\w]+", p.lower()):
            if len(w) > 1:
                s.add(w)
    return s


def pa_map_last_first_tokens(pm_name: str) -> tuple[str, set[str]]:
    """Photo map uses 'Lastname Firstname...' (first token is family name, rest is given)."""
    parts = (pm_name or "").strip().split()
    if not parts:
        return "", set()
    last = re.sub(r"[^\w]", "", parts[0].lower())
    given = token_set(" ".join(parts[1:])) if len(parts) > 1 else set()
    return last, given


def geo_family_token(last_field: str) -> str:
    t = (last_field or "").strip().lower().split()
    return re.sub(r"[^\w]", "", t[-1]) if t else ""


def main() -> int:
    errors: list[str] = []
    warns: list[str] = []

    delegation = parse_pa_delegation_from_mobile_js()
    try:
        gt = fetch_govtrack_pa()
    except Exception as e:
        print("WARN: GovTrack fetch failed; skipping federal Bioguide cross-check:", e)
        gt = None

    # Build GovTrack map: district number -> bioguide, senators by name fragment
    gt_by_dist: dict[int, tuple[str, str]] = {}
    gt_senate_bioguides: set[str] = set()
    if gt:
        for role in gt.get("objects", []):
            p = role.get("person") or {}
            bid = p.get("bioguideid")
            name = (p.get("name") or "").replace("Sen. ", "").replace("Rep. ", "")
            if not bid:
                continue
            if role.get("role_type") == "senator":
                gt_senate_bioguides.add(bid)
            elif role.get("role_type") == "representative":
                d = role.get("district")
                if d is not None:
                    gt_by_dist[int(d)] = (bid, name)

    for row in delegation:
        member = row.get("member", "")
        bid = row.get("bioguideId")
        chamber = row.get("chamber")
        if not bid:
            errors.append(f"Missing bioguideId for {member}")
            continue
        img = CONGRESS_DIR / f"{bid}.jpg"
        if not img.is_file() or img.stat().st_size < 500:
            errors.append(f"Missing or tiny congress image: {img.relative_to(ROOT)}")

        if gt:
            if chamber == "Senate":
                if bid not in gt_senate_bioguides:
                    errors.append(
                        f"Federal: {member} bioguide {bid} is not a current PA senator per GovTrack"
                    )
            else:
                dm = re.match(r"District\s+(\d+)", row.get("district") or "")
                if dm:
                    dnum = int(dm.group(1))
                    if dnum in gt_by_dist:
                        exp_bid, gt_name = gt_by_dist[dnum]
                        if exp_bid != bid:
                            errors.append(
                                f"Federal: PA-{dnum} {member} uses {bid} but GovTrack expects "
                                f"{exp_bid} ({gt_name})"
                            )

    # PA state: photo files + name overlap with GeoJSON
    pmap = json.loads(PHOTO_MAP.read_text(encoding="utf-8"))
    for chamber, js_path, first_key, last_key in (
        ("house", HOUSE_JS, "H_FIRSTNAM", "H_LASTNAME"),
        ("senate", SENATE_JS, "S_FIRSTNAM", "S_LASTNAME"),
    ):
        geo = extract_geojson_from_pa_js(js_path)
        bucket = pmap.get(chamber, {})
        for feat in geo.get("features", []):
            pr = feat.get("properties") or {}
            gpid = pr.get("GPID")
            if gpid is None:
                continue
            gk = str(gpid)
            if gk not in bucket:
                continue
            entry = bucket[gk]
            img_id = entry.get("img_id")
            if img_id is None:
                # Intentional after GPID reconciliation (vacant / unknown portrait).
                if "vacant" not in (entry.get("name") or "").lower():
                    warns.append(f"PA {chamber} GPID {gk}: no img_id ({entry.get('name')})")
                continue
            folder = "pa-senate" if chamber == "senate" else "pa-house"
            ip = ROOT / "images" / "headshots" / folder / f"{img_id}.jpg"
            if not ip.is_file() or ip.stat().st_size < 500:
                errors.append(f"Missing state image: {ip.relative_to(ROOT)} ({entry.get('name')})")

            geo_name = f"{pr.get(first_key, '')} {pr.get(last_key, '')}".strip()
            pm_name = (entry.get("name") or "").strip()
            a, b = token_set(geo_name), token_set(pm_name)
            map_last, map_given = pa_map_last_first_tokens(pm_name)
            geo_last = geo_family_token(pr.get(last_key, ""))
            last_names_align = bool(map_last and geo_last and (map_last == geo_last or map_last in geo_last or geo_last in map_last))
            if not a or not b:
                continue
            inter = len(a & b)
            union = len(a | b)
            jacc = inter / union if union else 0.0
            # Strong signals: shared tokens (handles "Jim" vs "James" poorly) or matching surnames.
            if last_names_align or jacc >= 0.25:
                continue
            warns.append(
                f"PA {chamber} GPID {gk}: photo map likely wrong member for this district — "
                f"GeoJSON '{geo_name}' vs map '{pm_name}' (no surname match; Jaccard {inter}/{union})"
            )

    print("Headshot verification (340b-mobile PA federal + state photo map)")
    print("=" * 60)
    if errors:
        print("FAILURES:")
        for e in errors:
            print("  ", e)
    else:
        print("PASS: No blocking errors (files + federal Bioguide vs GovTrack).")
    if warns:
        print("Warnings (manual review):")
        for w in warns:
            print("  ", w)
    print("Sources: GovTrack API current PA roles; local GeoJSON + pa-member-photo-map.json")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
