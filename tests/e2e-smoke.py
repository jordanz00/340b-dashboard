#!/usr/bin/env python3
"""
End-to-End Smoke Tests — 340B Advocacy Dashboard.

Run with:

    python3 tests/e2e-smoke.py

Starts a local HTTP server, loads all dashboard pages (desktop + mobile),
and checks that critical content renders correctly. Exits non-zero on failure.

Tests are read-only — they never modify pages or data.
"""

from __future__ import annotations

import http.server
import re
import sys
import threading
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = 8391
BASE = f"http://localhost:{PORT}"

PAGES_TO_CHECK = [
    ("340b.html", "Desktop advanced dashboard"),
    ("340b-mobile.html", "Mobile dashboard"),
    ("340b-BASIC.html", "IT-safe BASIC dashboard"),
    ("index.html", "Landing / PA report"),
]

CRITICAL_METRIC_KEYS = [
    "PA_HOSPITALS_340B_COUNT",
    "COMMUNITY_BENEFIT_TOTAL_BILLIONS",
    "US_STATES_CP_PROTECTION_COUNT",
    "US_STATES_NO_CP_PROTECTION_COUNT",
]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def start_server() -> http.server.HTTPServer:
    import os
    os.chdir(str(ROOT))
    server = http.server.HTTPServer(("127.0.0.1", PORT), QuietHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.3)
    return server


def fetch(path: str) -> tuple[int, str]:
    url = f"{BASE}/{path}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "e2e-smoke/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return 0, str(e)


def _check_metric_keys_on_page(html: str, label: str, results: list[tuple[bool, str]]) -> None:
    """Check that critical MetricKey elements exist and have non-zero values."""
    missing = [k for k in CRITICAL_METRIC_KEYS if f'data-metric-key="{k}"' not in html]
    if not missing:
        results.append((True, f"{label}: all {len(CRITICAL_METRIC_KEYS)} critical MetricKey elements present"))
    else:
        results.append((False, f"{label}: missing MetricKey elements: {', '.join(missing)}"))
        return

    vals = re.findall(r'data-metric-key="[^"]+"\s+[^>]*data-count="([^"]+)"', html)
    if not vals:
        vals = re.findall(r'data-count="([^"]+)"[^>]*data-metric-key', html)
    zero_count = sum(1 for v in vals if v == "0")
    if vals and zero_count == 0:
        results.append((True, f"{label}: all {len(vals)} metric data-count values non-zero"))
    elif not vals:
        results.append((False, f"{label}: no data-count values found"))
    else:
        results.append((False, f"{label}: {zero_count}/{len(vals)} metric data-count values are zero"))


def main() -> int:
    results: list[tuple[bool, str]] = []

    server = start_server()

    try:
        # ── Test 1: All dashboard pages return HTTP 200 with non-trivial body ──
        page_bodies: dict[str, str] = {}
        for page, label in PAGES_TO_CHECK:
            status, body = fetch(page)
            page_bodies[page] = body
            if status == 200 and len(body) > 100:
                results.append((True, f"HTTP 200 — {label} ({page})"))
            else:
                results.append((False, f"HTTP {status} — {label} ({page}), body {len(body)} bytes"))

        # ── Test 2: Pages have <title> ──
        for page, label in PAGES_TO_CHECK:
            body = page_bodies.get(page, "")
            if not body:
                continue
            if re.search(r"<title[^>]*>[^<]+</title>", body, re.IGNORECASE):
                results.append((True, f"{label}: has <title> element"))
            else:
                results.append((False, f"{label}: missing <title> element"))

        # ── Test 3: Mobile page — MetricKey elements and non-zero values ──
        mobile_html = page_bodies.get("340b-mobile.html", "")
        if mobile_html:
            _check_metric_keys_on_page(mobile_html, "Mobile", results)

        # ── Test 4: Desktop page — MetricKey elements (if present) ──
        desktop_html = page_bodies.get("340b.html", "")
        if desktop_html:
            has_any_metric = 'data-metric-key="' in desktop_html
            if has_any_metric:
                _check_metric_keys_on_page(desktop_html, "Desktop", results)
            else:
                results.append((True, "Desktop: MetricKeys rendered via JS (not in static HTML)"))

        # ── Test 5: BASIC page — no remote scripts (IT-safe) ──
        basic_html = page_bodies.get("340b-BASIC.html", "")
        if basic_html:
            remote_scripts = re.findall(
                r'<script[^>]+src=["\']((https?:)?//[^"\']+)["\']', basic_html, re.IGNORECASE
            )
            if not remote_scripts:
                results.append((True, "BASIC: no remote <script> sources (IT-safe)"))
            else:
                results.append((False, f"BASIC: has {len(remote_scripts)} remote script(s) — violates IT-safe constraint"))

        # ── Test 6: Mobile viewport meta tag ──
        if mobile_html:
            if 'name="viewport"' in mobile_html.lower():
                results.append((True, "Mobile: viewport meta tag present"))
            else:
                results.append((False, "Mobile: missing viewport meta tag"))

    finally:
        server.shutdown()

    # ── Report ──
    print("=" * 50)
    print("  E2E Smoke Tests — Desktop + Mobile")
    print("=" * 50)
    all_pass = True
    for passed, msg in results:
        icon = "+" if passed else "X"
        print(f"  [{icon}] {msg}")
        if not passed:
            all_pass = False
    print()

    if all_pass:
        print(f"  PASS ({len(results)} checks)")
    else:
        fail_count = sum(1 for p, _ in results if not p)
        print(f"  FAIL ({fail_count} of {len(results)} checks failed)")

    print()
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
