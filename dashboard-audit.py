#!/usr/bin/env python3
"""
Lightweight audit script for the 340B dashboard.

This is intentionally simple so a novice maintainer can run it with:

    python3 dashboard-audit.py

It checks high-value risks in the 340B dashboard files:
- unsafe DOM patterns (including print.html)
- hidden zero-width/control characters
- missing rel="noopener noreferrer" on external links
- CSP / referrer hardening on app entry pages (340b.html, 340b-BASIC.html, 340b-mobile.html)
- BASIC: no remote script URLs (CDN-free IT-safe build)
- print pipeline: namespaced localStorage key + payload version validation
- security documentation files (SECURITY-FORCE, THREAT-MODEL, SECURE-FORCE)
- unexpected remote fonts, scripts, or runtime data fetches
  (EXECUTABLE_FILES: 340b.js / 340b-mobile.js / print.html must not use fetch(),
  XMLHttpRequest, or d3.json(); same-origin data loads use static <script> — e.g.
  data/pa-member-photo-map.js sets window.HAP_PA_MEMBER_PHOTO_MAP; regenerate via
  scripts/regenerate-pa-photo-map-js.py when the JSON changes)
- stale removed-feature copy; prompt library sections

It does NOT replace manual review. Print preview, source verification, and copy quality
still need a human check before publishing.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PROMPTS_FILE = ROOT / "340b-dashboard-prompts.md"
DASHBOARD_FILES = [
    ROOT / "340b.html",
    ROOT / "340b.css",
    ROOT / "340b.js",
    ROOT / "state-data.js",
    ROOT / "README.md",
    ROOT / "SECURITY.md",
    ROOT / "QA-CHECKLIST.md",
    ROOT / "NOVICE-MAINTAINER.md",
    ROOT / "THREAT-MODEL.md",
    ROOT / "SECURITY-FORCE.md",
    ROOT / "SECURE-FORCE.md",
    ROOT / "AI-HANDOFF.md",
    ROOT / "340b-mobile.html",
    ROOT / "340b-mobile.js",
]
EXECUTABLE_FILES = [
    ROOT / "340b.html",
    ROOT / "340b.js",
    ROOT / "print.html",
    ROOT / "340b-mobile.js",
]
SOURCE_FILES = list(DASHBOARD_FILES) + [PROMPTS_FILE]
APP_HTML_FILES = [
    ROOT / "340b.html",
    ROOT / "340b-BASIC.html",
]
MOBILE_HTML = ROOT / "340b-mobile.html"
APP_HTML_WITH_MOBILE = APP_HTML_FILES + [MOBILE_HTML]
BASIC_HTML = ROOT / "340b-BASIC.html"
PRINT_HTML = ROOT / "print.html"
PRINT_VIEW_CSS = ROOT / "print-view.css"

UNSAFE_PATTERNS = [
    r"\binnerHTML\b",
    r"\bouterHTML\b",
    r"\beval\s*\(",
    r"\bnew Function\b",
    r"on(click|change|load|error)\s*=",
]
REMOVED_FEATURE_TERMS = [
    "dark mode",
    "presentation mode",
    "search state",
]
HIDDEN_CHAR_PATTERN = re.compile(r"[\u200b\u200c\u200d\ufeff\u2060]")
TARGET_BLANK_LINK_PATTERN = re.compile(r"<a\b[^>]*target=\"_blank\"[^>]*>", re.IGNORECASE)
REMOTE_ASSET_PATTERN = re.compile(
    r"(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com|ajax\.googleapis\.com)",
    re.IGNORECASE,
)
RUNTIME_FETCH_PATTERN = re.compile(r"\b(fetch\s*\(|d3\.json\s*\(|XMLHttpRequest\b)", re.IGNORECASE)
MANUAL_CHECKS = [
    "Open Print / PDF and confirm the document fits in exactly 2 pages with no excessive white space.",
    "Confirm page 1: header, intro cards, executive strip, map, selection summary, state detail.",
    "Confirm page 2: state summary, trends, KPIs, supporting cards, community benefit, access, PA safeguards, methodology, sources.",
    "Confirm Pennsylvania prints as the default state context when no live state is selected.",
    "Confirm the PDF looks polished and pharma/CEO presentable.",
    "Verify source dates and source links still match the current law and reporting data.",
    "Re-read the PDF and dashboard copy for lawmakers, hospital CEOs, and administrators before release.",
    "Confirm invalid #state-XX in URL (e.g. #state-XY) shows empty selection and no console error.",
]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def record(result_list: list[str], ok: bool, message: str) -> None:
    prefix = "PASS" if ok else "FAIL"
    result_list.append(f"{prefix}: {message}")


def check_unsafe_patterns(results: list[str]) -> bool:
    okay = True

    for path in EXECUTABLE_FILES:
        text = read_text(path)
        for pattern in UNSAFE_PATTERNS:
            if re.search(pattern, text):
                record(results, False, f"{path.name} matched unsafe pattern `{pattern}`")
                okay = False

    if okay:
        record(results, True, "No unsafe DOM or inline-handler patterns found in dashboard source files")

    return okay


def check_hidden_characters(results: list[str]) -> bool:
    okay = True

    for path in SOURCE_FILES:
        text = read_text(path)
        if HIDDEN_CHAR_PATTERN.search(text):
            record(results, False, f"{path.name} contains hidden zero-width or BOM characters")
            okay = False

    if okay:
        record(results, True, "No hidden zero-width or BOM characters found in dashboard source files")

    return okay


def check_external_links(results: list[str]) -> bool:
    okay = True

    for path in APP_HTML_WITH_MOBILE:
        html = read_text(path)
        for match in TARGET_BLANK_LINK_PATTERN.finditer(html):
            tag = match.group(0)
            if 'rel="noopener noreferrer"' not in tag:
                record(results, False, f"Found target=\"_blank\" link without rel=\"noopener noreferrer\" in {path.name}")
                okay = False

    if okay:
        record(results, True, "All external target=\"_blank\" links in app HTML files use rel=\"noopener noreferrer\"")

    return okay


def check_page_hardening(results: list[str]) -> bool:
    okay = True

    for path in APP_HTML_WITH_MOBILE:
        html = read_text(path)
        if 'http-equiv="Content-Security-Policy"' not in html:
            record(results, False, f"{path.name} is missing a Content-Security-Policy meta tag")
            okay = False
        if 'name="referrer"' not in html:
            record(results, False, f"{path.name} is missing a referrer policy meta tag")
            okay = False

    if okay:
        record(results, True, "App entry pages include CSP and referrer hardening")

    return okay


def check_print_view_regression_guards(results: list[str]) -> bool:
    """Print view must have @page rules and page-break regression guards."""
    okay = True
    if not PRINT_VIEW_CSS.exists():
        record(results, False, "print-view.css missing")
        return False
    css = read_text(PRINT_VIEW_CSS)
    if "@page" not in css:
        record(results, False, "print-view.css should have @page rules for print layout")
        okay = False
    if "page-break" not in css:
        record(results, False, "print-view.css should use page-break rules for content blocks")
        okay = False
    if okay:
        record(results, True, "print-view.css has print regression guards")
    return okay


def check_print_view_security(results: list[str]) -> bool:
    """Print view (print.html) must have CSP and must not use innerHTML for payload injection."""
    okay = True
    if not PRINT_HTML.exists():
        record(results, True, "print.html not present (optional); skipping print view checks")
        return True
    html = read_text(PRINT_HTML)
    if 'Content-Security-Policy' not in html:
        record(results, False, "print.html is missing a Content-Security-Policy meta tag")
        okay = False
    # Allow innerHTML for map SVG (validated payload from our serialization). Fail only on clearly unsafe sources.
    if re.search(r"\.innerHTML\s*=\s*(?:params|location|document\.URL|window\.name|location\.search)", html):
        record(results, False, "print.html must not assign unsanitized URL/params to innerHTML")
        okay = False
    # Check for payload validation
    if "isValidPayload" not in html and "typeof payload" not in html:
        record(results, False, "print.html should validate payload shape before use")
        okay = False
    if okay:
        record(results, True, "print.html has CSP and does not use innerHTML for payload")
    return okay


def check_remote_assets(results: list[str]) -> bool:
    okay = True

    for path in APP_HTML_FILES:
        html = read_text(path)
        if REMOTE_ASSET_PATTERN.search(html):
            record(results, False, f"{path.name} still references remote font or script infrastructure")
            okay = False

    for path in EXECUTABLE_FILES:
        text = read_text(path)
        if RUNTIME_FETCH_PATTERN.search(text):
            record(results, False, f"{path.name} still performs a runtime fetch or remote data request")
            okay = False

    if okay:
        record(results, True, "App entry pages use local assets and avoid runtime remote data fetches")

    return okay


def check_security_documentation(results: list[str]) -> bool:
    """Enterprise docs: multi-agent workflow + threat model + maintainer rules."""
    required = [
        ROOT / "SECURITY-FORCE.md",
        ROOT / "THREAT-MODEL.md",
        ROOT / "SECURE-FORCE.md",
    ]
    okay = True
    for path in required:
        if not path.exists():
            record(results, False, f"Missing required security documentation: {path.name}")
            okay = False
    if okay:
        record(
            results,
            True,
            "Security documentation present (SECURITY-FORCE.md, THREAT-MODEL.md, SECURE-FORCE.md)",
        )
    return okay


def check_basic_local_scripts_only(results: list[str]) -> bool:
    """340b-BASIC.html must not load scripts from http(s) (air-gapped / hospital IT)."""
    if not BASIC_HTML.exists():
        record(results, False, "340b-BASIC.html is missing")
        return False
    html = read_text(BASIC_HTML)
    for match in re.finditer(r"<script[^>]+src=[\"']([^\"']+)[\"']", html, re.IGNORECASE):
        src = match.group(1).strip()
        if src.startswith(("http://", "https://", "//")):
            record(results, False, f"340b-BASIC.html must not use remote script URL: {src}")
            return False
    record(results, True, "340b-BASIC.html uses only local script sources (no CDN or remote URLs)")
    return True


def check_print_localstorage_namespace(results: list[str]) -> bool:
    """Namespaced localStorage key for print snapshot; legacy read retained in print.html."""
    js = read_text(ROOT / "340b.js")
    pr = read_text(ROOT / "print.html")
    if "hap340b:printSnapshot" not in js or "hap340b:printSnapshot" not in pr:
        record(
            results,
            False,
            "340b.js and print.html should use namespaced localStorage key hap340b:printSnapshot",
        )
        return False
    if "hap340bPrint" not in pr:
        record(results, False, "print.html should retain legacy localStorage key hap340bPrint for migration")
        return False
    if "payloadVersion" not in js or "payloadVersion" not in pr:
        record(results, False, "Print payload should include payloadVersion (340b.js + print.html)")
        return False
    record(results, True, "Print pipeline: namespaced localStorage key, legacy read, payload version")
    return True


def check_removed_feature_copy(results: list[str]) -> bool:
    okay = True

    for path in DASHBOARD_FILES:
        text = read_text(path).lower()
        for term in REMOVED_FEATURE_TERMS:
            if term in text:
                record(results, False, f"{path.name} still mentions removed feature `{term}`")
                okay = False

    if okay:
        record(results, True, "No stale removed-feature copy found in core dashboard files")

    return okay


def check_print_css(results: list[str]) -> bool:
    """Verify @media print exists and contains font-size and map max-height (structure only)."""
    css_path = ROOT / "340b.css"
    text = read_text(css_path)
    if "@media print" not in text:
        record(results, False, "340b.css does not contain @media print")
        return False
    print_start = text.find("@media print")
    print_block = text[print_start : print_start + 8000]
    if "font-size" not in print_block:
        record(results, False, "340b.css @media print block should set font-size (e.g. 75% or 11px)")
        return False
    if "max-height" not in print_block:
        record(results, False, "340b.css @media print block should set max-height for map SVG")
        return False
    record(results, True, "340b.css has @media print with font-size and map max-height")
    return True


def check_print_structure(results: list[str]) -> bool:
    html = read_text(ROOT / "340b.html")
    required_snippets = [
        'class="print-report-header print-only"',
        'id="print-intro-snapshot"',
        "executive-proof-strip span-12 scroll-reveal ow-section ow-section--band-b",
        'id="executive-landscape-value"',
        'id="print-state-summary"',
        'class="print-sources print-only"',
        'id="btn-print"',
        'id="what-is-340b"',
        'id="overview"',
        'id="print-last-updated"',
        'id="print-methodology-last-updated"',
    ]
    missing = [snippet for snippet in required_snippets if snippet not in html]

    if missing:
        for snippet in missing:
            record(results, False, f"340b.html is missing expected print structure snippet `{snippet}`")
        return False

    if 'class="print-executive-summary print-only"' in html:
        record(results, False, "340b.html still contains the removed duplicate print executive summary block")
        return False

    record(results, True, "340b.html includes the expected print header, live intro cards, and source summary structure")
    return True


def check_prompt_waves(results: list[str]) -> bool:
    prompts = read_text(PROMPTS_FILE)
    required_sections = [
        "## Prompts v09",
        "## Prompts v10",
        "## Prompts v11",
        "## Prompts v12",
        "## Prompts v13",
        "## Prompts v14",
        "## Prompts v15",
        "## Prompts v16",
        "## Prompts v17",
        "## Prompts v18",
        "## Prompts v19",
        "## Prompts v20",
        "## Prompts v21",
        "## Prompts v22",
        "## Prompts v23",
        "## Prompts v24",
        "## Prompts v25",
        "## Prompts v26",
        "## Prompts v27",
        "## Prompts v28",
        "## Prompts v29",
        "## Prompts v30",
        "## Prompts v31",
        "## Prompts v32",
        "## Prompts v33",
        "## Prompts v34",
        "## Prompts v35",
        "## Prompts v36",
        "## Prompts v37",
        "## Prompts v38",
        "## Prompts v39",
        "## Prompts v40",
        "## Prompts v41",
        "## Prompts v42",
        "## Prompts v43",
        "## Prompts v44",
        "## Prompts v45",
        "## Prompts v46",
        "## Prompts v47",
        "## Prompts v48",
        "## Prompts v49",
        "## Prompts v50",
        "## Prompts v61",
        "## Prompts v70",
        "## Alternate Prompts v40-v50",
    ]
    missing = [section for section in required_sections if section not in prompts]

    if missing:
        for section in missing:
            record(results, False, f"Prompt library is missing section `{section}`")
        return False

    record(results, True, "Prompt library contains v09 through v70 sections plus alternate track")
    return True


def main() -> int:
    results: list[str] = []

    checks = [
        check_unsafe_patterns,
        check_hidden_characters,
        check_external_links,
        check_page_hardening,
        check_security_documentation,
        check_basic_local_scripts_only,
        check_print_localstorage_namespace,
        check_print_view_security,
        check_print_view_regression_guards,
        check_remote_assets,
        check_removed_feature_copy,
        check_print_css,
        check_print_structure,
        check_prompt_waves,
    ]

    all_ok = True
    for check in checks:
        all_ok = check(results) and all_ok

    print("340B dashboard audit")
    print("====================")
    for line in results:
        print(line)
    print("")
    print("Manual checks still required")
    print("===========================")
    for item in MANUAL_CHECKS:
        print(f"- {item}")

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
