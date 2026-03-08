#!/usr/bin/env python3
"""
Lightweight audit script for the 340B dashboard.

This is intentionally simple so a novice maintainer can run it with:

    python3 dashboard-audit.py

It checks a few high-value risks:
- unsafe DOM patterns
- hidden zero-width/control characters
- missing rel="noopener noreferrer" on external links
- missing CSP/referrer hardening on app entry pages
- unexpected remote fonts, scripts, or runtime data fetches
- stale removed-feature copy in dashboard files
- missing prompt waves
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PROMPTS_FILE = ROOT / "340b-dashboard-prompts.md"
DASHBOARD_FILES = [
    ROOT / "340b.html",
    ROOT / "index.html",
    ROOT / "portfolio.html",
    ROOT / "static.html",
    ROOT / "340b.css",
    ROOT / "340b.js",
    ROOT / "main.js",
    ROOT / "README.md",
    ROOT / "SECURITY.md",
    ROOT / "QA-CHECKLIST.md",
    ROOT / "NOVICE-MAINTAINER.md",
]
EXECUTABLE_FILES = [
    ROOT / "340b.html",
    ROOT / "index.html",
    ROOT / "340b.js",
    ROOT / "main.js",
]
SOURCE_FILES = list(DASHBOARD_FILES) + [PROMPTS_FILE]
APP_HTML_FILES = [
    ROOT / "340b.html",
    ROOT / "index.html",
    ROOT / "portfolio.html",
    ROOT / "static.html",
]

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

    for path in APP_HTML_FILES:
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

    for path in APP_HTML_FILES:
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


def check_print_structure(results: list[str]) -> bool:
    html = read_text(ROOT / "340b.html")
    required_snippets = [
        'class="print-report-header print-only"',
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
    ]
    missing = [section for section in required_sections if section not in prompts]

    if missing:
        for section in missing:
            record(results, False, f"Prompt library is missing section `{section}`")
        return False

    record(results, True, "Prompt library contains v09 through v15 sections")
    return True


def main() -> int:
    results: list[str] = []

    checks = [
        check_unsafe_patterns,
        check_hidden_characters,
        check_external_links,
        check_page_hardening,
        check_remote_assets,
        check_removed_feature_copy,
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

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
