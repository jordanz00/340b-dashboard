#!/usr/bin/env python3
"""
Merge palegis canonical bio paths (bio_id + slug) into data/pa-member-photo-map.json.

palegis.us requires /members/bio/{id}/{slug}; numeric-only /bio/{id} returns 404.

Run from repo root after updating manual overrides if needed:
  python3 scripts/sync-pa-palegis-bio-slugs.py
  python3 scripts/regenerate-pa-photo-map-js.py
"""
from __future__ import annotations

import json
import re
import ssl
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHOTO_MAP = ROOT / "data" / "pa-member-photo-map.json"
HOUSE_GEO = ROOT / "data" / "pa-districts" / "PaHouse2024_03.geojson"
SENATE_GEO = ROOT / "data" / "pa-districts" / "PaSenatorial2024_03.geojson"
MANUAL = ROOT / "data" / "pa-palegis-bio-manual.json"

UA = "Mozilla/5.0 HAP-dashboard-palegis-sync/1.0"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    ctx = ssl.create_default_context()
    try:
        return urllib.request.urlopen(req, timeout=90, context=ctx).read().decode("utf-8", "replace")
    except Exception:
        ctx = ssl._create_unverified_context()
        return urllib.request.urlopen(req, timeout=90, context=ctx).read().decode("utf-8", "replace")


def parse_roster(html: str, chamber: str) -> dict[int, dict]:
    """district int -> palegis row: bio_id, bio_slug, display_name (First Last), party, data_name (Last First)."""
    prefix = f"/{chamber}/members/bio/"
    out: dict[int, dict] = {}
    chunks = re.split(r'<div class="col-6 col-sm-6 col-lg-3 member mb-4"', html)[1:]
    for chunk in chunks:
        md = re.search(r'data-district="(\d+)"', chunk)
        mh = re.search(rf'href="\s*{re.escape(prefix)}(\d+)/([^"]+)"', chunk, re.I)
        if not md or not mh:
            continue
        d = int(md.group(1))
        bid, slug = mh.group(1), mh.group(2).strip()
        inner = re.search(r'class="thumb-info-inner">([^<]+)</span>', chunk)
        display_name = inner.group(1).strip() if inner else ""
        dname = re.search(r'data-name="([^"]*)"', chunk)
        raw_dn = dname.group(1).strip() if dname else ""
        # Photo map convention: "Lastname Firstname" (matches existing JSON).
        name_lf = " ".join(raw_dn.split()) if raw_dn else ""
        party_m = re.search(r'data-party="([DR])"', chunk)
        party = party_m.group(1) if party_m else ""
        out[d] = {
            "bio_id": bid,
            "bio_slug": slug,
            "display_name": display_name,
            "name": name_lf,
            "party": party,
        }
    return out


def gpid_by_leg_dist(geo_path: Path, leg_key: str) -> dict[int, str]:
    geo = json.loads(geo_path.read_text(encoding="utf-8"))
    m: dict[int, str] = {}
    for feat in geo.get("features", []):
        p = feat.get("properties") or {}
        dist = p.get(leg_key)
        gpid = p.get("GPID")
        if dist is None or gpid is None:
            continue
        m[int(dist)] = str(gpid)
    return m


def main() -> None:
    house_html = fetch("https://www.palegis.us/house/members")
    sen_html = fetch("https://www.palegis.us/senate/members")
    house_roster = parse_roster(house_html, "house")
    sen_roster = parse_roster(sen_html, "senate")

    house_gpid = gpid_by_leg_dist(HOUSE_GEO, "LEG_DISTRI")
    sen_gpid = gpid_by_leg_dist(SENATE_GEO, "LEG_DISTRI")

    pmap = json.loads(PHOTO_MAP.read_text(encoding="utf-8"))
    manual: dict = {"house": {}, "senate": {}}
    if MANUAL.is_file():
        manual = json.loads(MANUAL.read_text(encoding="utf-8"))

    def apply_roster(roster: dict[int, dict], gpid_map: dict[int, str], bucket: str) -> None:
        b = pmap.setdefault(bucket, {})
        man_bucket = manual.get(bucket) or {}
        for dist, gpid in gpid_map.items():
            if gpid not in b:
                continue
            entry = b[gpid]
            if "vacant" in (entry.get("name") or "").lower():
                entry.pop("bio_slug", None)
                continue
            man = man_bucket.get(gpid)
            if dist in roster:
                row = roster[dist]
                entry["bio_id"] = row["bio_id"]
                entry["bio_slug"] = row["bio_slug"]
                entry["img_id"] = row["bio_id"]
                if row.get("name"):
                    entry["name"] = row["name"]
                if row.get("display_name"):
                    entry["display_name"] = row["display_name"]
                if row.get("party"):
                    entry["party"] = row["party"]
            else:
                entry.pop("bio_slug", None)
            if man:
                if man.get("bio_id"):
                    entry["bio_id"] = str(man["bio_id"])
                if man.get("bio_slug"):
                    entry["bio_slug"] = str(man["bio_slug"])

    apply_roster(house_roster, house_gpid, "house")
    apply_roster(sen_roster, sen_gpid, "senate")

    PHOTO_MAP.write_text(json.dumps(pmap, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Wrote", PHOTO_MAP)
    print("house roster cards:", len(house_roster), "senate:", len(sen_roster))

    # One row per seated member (current role only); dedupe by bio_id if ever duplicated.
    current_list: list[dict] = []
    seen_bio: set[str] = set()
    for dist in sorted(house_roster.keys()):
        row = house_roster[dist]
        bid = row["bio_id"]
        if bid in seen_bio:
            continue
        seen_bio.add(bid)
        nm = (row.get("display_name") or row.get("name") or "").strip()
        current_list.append(
            {
                "name": nm,
                "chamber": "House",
                "district": f"HD {dist}",
                "party": row.get("party") or "",
            }
        )
    for dist in sorted(sen_roster.keys()):
        row = sen_roster[dist]
        bid = row["bio_id"]
        if bid in seen_bio:
            continue
        seen_bio.add(bid)
        nm = (row.get("display_name") or row.get("name") or "").strip()
        current_list.append(
            {
                "name": nm,
                "chamber": "Senate",
                "district": f"SD {dist}",
                "party": row.get("party") or "",
            }
        )
    out_current = ROOT / "data" / "pa-legislators-current.json"
    out_current.write_text(
        json.dumps(
            {"asOf": "2026-04", "source": "palegis.us member rosters (sync script)", "legislators": current_list},
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print("Wrote", out_current, "unique members:", len(current_list))


if __name__ == "__main__":
    main()
