#!/usr/bin/env python3
"""
Data provenance verification — 340B advocacy dashboard
=======================================================

Run:
    python3 data-verification.py
    python3 data-verification.py --check-urls   # optional live URL reachability (needs network)

What this proves (machine-checkable):
- Each KPI in powerbi/metric-registry.json lists at least one **external** https URL
  (authoritative org / government source — not this repo or localhost).
- Provenance **date strings** in metric-registry.json match DATA_DATES in 340b.js.
- data/dataset-metadata.js **sources** and **kpiSources** entries include https URLs.

What this does **not** prove:
- That numeric values on the page match those URLs (requires human or warehouse QA).
- That legislative status in STATE_340B matches MultiState/ASHP on a given day.
- That sparkline arrays (TREND_DATA) or PA delegation rows are correct — they are
  governed separately; this script flags them as out of scope for numeric verification.

Use this alongside python3 dashboard-audit.py (security/layout) and manual source review.

Optional: pip install certifi — improves TLS verification for --check-urls on systems with an incomplete CA store.
"""

from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def _ssl_context() -> ssl.SSLContext:
    """Prefer certifi CA bundle when installed (avoids bare-Python CA gaps on some machines)."""
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


ROOT = Path(__file__).resolve().parent
REGISTRY_PATH = ROOT / "powerbi" / "metric-registry.json"
JS_PATH = ROOT / "340b.js"
DATASET_META_PATH = ROOT / "data" / "dataset-metadata.js"

# URLs that are deployment or repo-adjacent — not acceptable as *primary* data authority.
DISALLOWED_AUTHORITY_SUBSTRINGS = (
    "localhost",
    "127.0.0.1",
    "file://",
    "192.168.",
    "10.0.",
    "/Users/",
)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_data_dates(js: str) -> dict[str, str]:
    m = re.search(r"const\s+DATA_DATES\s*=\s*\{([^}]+)\}", js, re.DOTALL)
    if not m:
        raise ValueError("Could not find const DATA_DATES = { ... } in 340b.js")
    block = m.group(1)
    out: dict[str, str] = {}
    for line in block.splitlines():
        mm = re.match(r'\s*(\w+)\s*:\s*"([^"]*)"', line.strip())
        if mm:
            out[mm.group(1)] = mm.group(2)
    return out


def is_allowed_authority_url(url: str) -> tuple[bool, str]:
    u = url.strip()
    if not u.startswith("https://"):
        return False, "must start with https://"
    low = u.lower()
    for bad in DISALLOWED_AUTHORITY_SUBSTRINGS:
        if bad in low:
            return False, f"disallowed fragment {bad!r}"
    return True, ""


def extract_js_object_arrays(text: str, key: str) -> list[str]:
    """Return raw inner text of `key: [ ... ],` first match (best-effort for our metadata file)."""
    pat = re.compile(
        rf"{re.escape(key)}\s*:\s*\[([\s\S]*?)\]\s*,",
        re.MULTILINE,
    )
    m = pat.search(text)
    if not m:
        return []
    return [m.group(1)]


def count_entries_with_url(block: str) -> tuple[int, int]:
    """Count metadata array entries by `name:` fields vs https `url:` fields."""
    names = re.findall(r"\{\s*name:\s*\"([^\"]+)\"", block)
    urls = re.findall(r"url:\s*\"(https://[^\"]+)\"", block)
    return len(names), len(urls)


def _classify_http(code: int) -> tuple[str, str]:
    """Return (level, detail) where level is ok | warn | fail."""
    c = int(code)
    if c < 400:
        return "ok", f"HTTP {c}"
    if c == 403:
        return (
            "warn",
            "HTTP 403 (host may block automated requests — confirm in a normal browser)",
        )
    if c in (404, 410):
        return "fail", f"HTTP {c} (broken or removed)"
    if c >= 500:
        return "warn", f"HTTP {c} (server error — retry later or confirm manually)"
    return "fail", f"HTTP {c}"


def head_url(url: str, timeout: float = 20.0) -> tuple[str, str]:
    ctx = _ssl_context()
    ua = "hap-dashboard-data-verify/1.0"
    req = Request(url, method="HEAD", headers={"User-Agent": ua})
    try:
        with urlopen(req, timeout=timeout, context=ctx) as resp:
            code = getattr(resp, "status", None) or resp.getcode()
            if code is not None and int(code) >= 400:
                if int(code) in (403, 405, 501):
                    return get_url_fallback(url, timeout)
                return _classify_http(int(code))
    except HTTPError as e:
        if e.code in (403, 405, 501):
            return get_url_fallback(url, timeout)
        return _classify_http(int(e.code))
    except URLError as e:
        reason = str(e.reason if hasattr(e, "reason") else e)
        if "timed out" in reason.lower() or isinstance(getattr(e, "reason", None), TimeoutError):
            return "warn", f"{reason} (network timeout — verify manually)"
        return "fail", reason
    except TimeoutError as e:
        return "warn", f"{e} (network timeout — verify manually)"
    except ssl.SSLError as e:
        return "fail", f"SSL: {e}"
    except Exception as e:
        es = str(e)
        if "timed out" in es.lower():
            return "warn", f"{es} (network timeout — verify manually)"
        return "fail", es
    return "ok", "ok"


def get_url_fallback(url: str, timeout: float) -> tuple[str, str]:
    """GET with a browser-like UA — some .gov sites return 403 to HEAD or non-browser UAs."""
    ctx = _ssl_context()
    ua = (
        "Mozilla/5.0 (compatible; HAP-DataVerify/1.0; +https://www.haponline.org/) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    req = Request(url, method="GET", headers={"User-Agent": ua})
    try:
        with urlopen(req, timeout=timeout, context=ctx) as resp:
            code = getattr(resp, "status", None) or resp.getcode()
            if code is not None and int(code) >= 400:
                return _classify_http(int(code))
    except HTTPError as e:
        return _classify_http(int(e.code))
    except ssl.SSLError as e:
        return "fail", f"SSL: {e}"
    except URLError as e:
        reason = str(e.reason if hasattr(e, "reason") else e)
        if "timed out" in reason.lower():
            return "warn", f"{reason} (network timeout — verify manually)"
        return "fail", reason
    except TimeoutError as e:
        return "warn", f"{e} (network timeout — verify manually)"
    except Exception as e:
        es = str(e)
        if "timed out" in es.lower():
            return "warn", f"{es} (network timeout — verify manually)"
        return "fail", es
    return "ok", "ok (GET)"


def verify_registry(metrics: list[dict[str, Any]], data_dates: dict[str, str]) -> list[str]:
    lines: list[str] = []
    label_to_date_key = {
        "paHospitals": "paHospitals",
        "communityBenefit": "communityBenefit",
        "stateLaws": "stateLaws",
        "outpatientShare": "outpatientShare",
        "hrsaAudits": "hrsaAudits",
    }
    for m in metrics:
        key = m.get("metricKey", "?")
        label = m.get("provenanceLabel")
        static_disp = m.get("staticProvenanceDisplay")
        urls = m.get("authoritativeSourceUrls")

        if not urls or not isinstance(urls, list) or len(urls) == 0:
            lines.append(f"FAIL: {key} — missing authoritativeSourceUrls (need ≥1 external https URL)")
            continue

        bad_urls = []
        for entry in urls:
            if not isinstance(entry, dict):
                bad_urls.append("(not an object)")
                continue
            u = entry.get("url", "")
            ok, why = is_allowed_authority_url(str(u))
            if not ok:
                bad_urls.append(f"{u!r}: {why}")
        if bad_urls:
            lines.append(f"FAIL: {key} — invalid authority URL(s): {'; '.join(bad_urls)}")
            continue

        dk = label_to_date_key.get(str(label), None)
        if dk and dk in data_dates:
            if static_disp != data_dates[dk]:
                lines.append(
                    f"FAIL: {key} — staticProvenanceDisplay {static_disp!r} != "
                    f"DATA_DATES.{dk} {data_dates[dk]!r} in 340b.js"
                )
                continue

        lines.append(f"PASS: {key} — {len(urls)} authority URL(s), provenance string aligned")

    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify dashboard data provenance and source links.")
    parser.add_argument(
        "--check-urls",
        action="store_true",
        help="HEAD (or GET if needed) each registry URL; requires network",
    )
    parser.add_argument(
        "--allow-ssl-warnings",
        action="store_true",
        help="With --check-urls: TLS/SSL handshake failures count as WARN (exit 0), not FAIL — use only if your Python lacks CA certs (prefer: pip install certifi).",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON summary on stdout")
    args = parser.parse_args()

    errors = 0
    sections: dict[str, list[str]] = {}
    url_samples: list[str] = []

    if not REGISTRY_PATH.exists():
        print("FAIL: powerbi/metric-registry.json missing", file=sys.stderr)
        return 2

    registry = json.loads(read_text(REGISTRY_PATH))
    metrics = registry.get("metrics", [])
    if not metrics:
        print("FAIL: metric-registry.json has no metrics array", file=sys.stderr)
        return 2

    js = read_text(JS_PATH)
    try:
        data_dates = parse_data_dates(js)
    except ValueError as e:
        print(f"FAIL: {e}", file=sys.stderr)
        return 2

    sections["registry_metrics"] = verify_registry(metrics, data_dates)
    for line in sections["registry_metrics"]:
        if line.startswith("FAIL"):
            errors += 1
    for m in metrics:
        for e in m.get("authoritativeSourceUrls") or []:
            if isinstance(e, dict) and e.get("url"):
                url_samples.append(e["url"])

    sections["illustrative_content"] = [
        "INFO: TREND_DATA in 340b.js is documented as illustrative for sparklines — not verified as time series from an API here.",
        "INFO: PA_DELEGATION_MEMBERS in 340b.js is policy tracker metadata — verify against Congress.gov / internal advocacy logs before external use.",
        "INFO: STATE_340B in state-data.js — legislative flags; confirm against MultiState / ASHP / America's Essential Hospitals before publishing.",
    ]

    sections["dataset_metadata"] = []
    if not DATASET_META_PATH.exists():
        sections["dataset_metadata"].append("FAIL: data/dataset-metadata.js missing")
        errors += 1
    else:
        meta = read_text(DATASET_META_PATH)
        for arr_key in ("sources", "kpiSources"):
            blocks = extract_js_object_arrays(meta, arr_key)
            if not blocks:
                sections["dataset_metadata"].append(f"FAIL: could not parse {arr_key} array")
                errors += 1
                continue
            total, with_url = count_entries_with_url(blocks[0])
            if total == 0:
                sections["dataset_metadata"].append(f"FAIL: {arr_key} has no entries")
                errors += 1
            elif with_url < total:
                sections["dataset_metadata"].append(
                    f"FAIL: {arr_key} — only {with_url}/{total} https url fields (each entry needs url: \"https://...\")"
                )
                errors += 1
            elif with_url > total:
                sections["dataset_metadata"].append(
                    f"WARN: {arr_key} — more url fields than name fields; check array structure"
                )
            else:
                sections["dataset_metadata"].append(f"PASS: {arr_key} — all {total} entries have https URLs")
            for murl in re.finditer(r'url:\s*"(https://[^"]+)"', blocks[0]):
                url_samples.append(murl.group(1))

    sections["url_reachability"] = []
    if args.check_urls:
        unique = sorted(set(url_samples))
        for u in unique:
            level, msg = head_url(u)
            if level == "ok":
                sections["url_reachability"].append(f"PASS: {u} — {msg}")
            elif level == "warn":
                sections["url_reachability"].append(f"WARN: {u} — {msg}")
            elif args.allow_ssl_warnings and msg.startswith("SSL:"):
                sections["url_reachability"].append(f"WARN: {u} — {msg}")
            else:
                sections["url_reachability"].append(f"FAIL: {u} — {msg}")
                errors += 1
    else:
        sections["url_reachability"].append(
            "SKIP: live URL check (run with --check-urls after network approval)"
        )

    if args.json:
        print(
            json.dumps(
                {"ok": errors == 0, "errorCount": errors, "sections": sections},
                indent=2,
            )
        )
        return 0 if errors == 0 else 1

    print("340B data provenance verification")
    print("=================================")
    for title, lines in sections.items():
        print(f"\n## {title}\n")
        for line in lines:
            print(line)
    print("\n---")
    print(
        "Reminder: this tool checks citations and internal date consistency — not that KPI math matches each source."
    )
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
