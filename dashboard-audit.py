#!/usr/bin/env python3
"""
Dashboard Audit & Smoke Test Suite — 340B Advocacy Dashboard.

Run with:

    python3 dashboard-audit.py            # full suite
    python3 dashboard-audit.py --json     # machine-readable output (CI-friendly)
    python3 dashboard-audit.py --verbose  # print passing checks too

This expands the original security-focused audit into a comprehensive smoke test
that covers: page structure, MetricKey resolution, semantic layer completeness,
DOM safety, cross-file consistency, JSON validity, module API surface, and more.

It does NOT replace manual review. Print preview, source verification, and copy
quality still need a human check before publishing.
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
PROMPTS_FILE = ROOT / "340b-dashboard-prompts.md"

# ─── File inventories ───

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
APP_HTML_FILES = [ROOT / "340b.html", ROOT / "340b-BASIC.html"]
MOBILE_HTML = ROOT / "340b-mobile.html"
APP_HTML_WITH_MOBILE = APP_HTML_FILES + [MOBILE_HTML]
BASIC_HTML = ROOT / "340b-BASIC.html"
PRINT_HTML = ROOT / "print.html"
PRINT_VIEW_CSS = ROOT / "print-view.css"

ALL_HTML_PAGES = [
    ROOT / "340b.html",
    ROOT / "340b-mobile.html",
    ROOT / "340b-BASIC.html",
    ROOT / "340b-print.html",
    ROOT / "print.html",
    ROOT / "index.html",
]

JSON_FILES = [
    ROOT / "powerbi" / "metric-registry.json",
    ROOT / "powerbi" / "semantic-layer-registry.json",
    ROOT / "manifest.json",
    ROOT / "config.json",
    ROOT / "data" / "pa-member-photo-map.json",
]

MODULE_FILES = [
    ROOT / "modules" / "data-layer.js",
    ROOT / "modules" / "ai-helpers.js",
    ROOT / "modules" / "impact-simulator.js",
    ROOT / "modules" / "impact-ui.js",
    ROOT / "modules" / "pa-district-map.js",
]

# ─── Patterns ───

UNSAFE_PATTERNS = [
    r"\binnerHTML\b",
    r"\bouterHTML\b",
    r"\beval\s*\(",
    r"\bnew Function\b",
    r"on(click|change|load|error)\s*=",
]
REMOVED_FEATURE_TERMS = ["dark mode", "presentation mode", "search state"]
HIDDEN_CHAR_PATTERN = re.compile(r"[\u200b\u200c\u200d\ufeff\u2060]")
TARGET_BLANK_LINK_PATTERN = re.compile(
    r"<a\b[^>]*target=\"_blank\"[^>]*>", re.IGNORECASE
)
REMOTE_ASSET_PATTERN = re.compile(
    r"(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com|ajax\.googleapis\.com)",
    re.IGNORECASE,
)
RUNTIME_FETCH_PATTERN = re.compile(
    r"\b(fetch\s*\(|d3\.json\s*\(|XMLHttpRequest\b)", re.IGNORECASE
)

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

# ─── Helpers ───

_stats = {"pass": 0, "fail": 0, "skip": 0}


_file_cache: dict[Path, str] = {}


def read_text(path: Path) -> str:
    if path not in _file_cache:
        _file_cache[path] = path.read_text(encoding="utf-8")
    return _file_cache[path]


def record(result_list: list[dict], ok: bool, message: str, category: str = "general") -> None:
    status = "PASS" if ok else "FAIL"
    if ok:
        _stats["pass"] += 1
    else:
        _stats["fail"] += 1
    result_list.append({"status": status, "message": message, "category": category})


def skip(result_list: list[dict], message: str, category: str = "general") -> None:
    _stats["skip"] += 1
    result_list.append({"status": "SKIP", "message": message, "category": category})


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 1: Original Security Checks (unchanged logic, improved reporting)
# ══════════════════════════════════════════════════════════════════════════════


def check_unsafe_patterns(results: list[dict]) -> bool:
    okay = True
    for path in EXECUTABLE_FILES:
        text = read_text(path)
        for pattern in UNSAFE_PATTERNS:
            if re.search(pattern, text):
                record(results, False, f"{path.name} matched unsafe pattern `{pattern}`", "security")
                okay = False
    if okay:
        record(results, True, "No unsafe DOM or inline-handler patterns in executable files", "security")
    return okay


def check_hidden_characters(results: list[dict]) -> bool:
    okay = True
    for path in SOURCE_FILES:
        if not path.exists():
            continue
        text = read_text(path)
        if HIDDEN_CHAR_PATTERN.search(text):
            record(results, False, f"{path.name} contains hidden zero-width or BOM characters", "security")
            okay = False
    if okay:
        record(results, True, "No hidden zero-width or BOM characters in source files", "security")
    return okay


def check_external_links(results: list[dict]) -> bool:
    okay = True
    for path in APP_HTML_WITH_MOBILE:
        if not path.exists():
            continue
        html = read_text(path)
        for match in TARGET_BLANK_LINK_PATTERN.finditer(html):
            tag = match.group(0)
            if 'rel="noopener noreferrer"' not in tag:
                record(results, False, f"target=\"_blank\" without rel=\"noopener noreferrer\" in {path.name}", "security")
                okay = False
    if okay:
        record(results, True, "All target=\"_blank\" links use rel=\"noopener noreferrer\"", "security")
    return okay


def check_page_hardening(results: list[dict]) -> bool:
    okay = True
    for path in APP_HTML_WITH_MOBILE:
        if not path.exists():
            continue
        html = read_text(path)
        if 'http-equiv="Content-Security-Policy"' not in html:
            record(results, False, f"{path.name} missing Content-Security-Policy meta tag", "security")
            okay = False
        if 'name="referrer"' not in html:
            record(results, False, f"{path.name} missing referrer policy meta tag", "security")
            okay = False
    if okay:
        record(results, True, "App entry pages include CSP and referrer hardening", "security")
    return okay


def check_print_view_regression_guards(results: list[dict]) -> bool:
    if not PRINT_VIEW_CSS.exists():
        record(results, False, "print-view.css missing", "print")
        return False
    css = read_text(PRINT_VIEW_CSS)
    okay = True
    if "@page" not in css:
        record(results, False, "print-view.css should have @page rules", "print")
        okay = False
    if "page-break" not in css:
        record(results, False, "print-view.css should use page-break rules", "print")
        okay = False
    if okay:
        record(results, True, "print-view.css has print regression guards", "print")
    return okay


def check_print_view_security(results: list[dict]) -> bool:
    if not PRINT_HTML.exists():
        skip(results, "print.html not present; skipping print view checks", "print")
        return True
    html = read_text(PRINT_HTML)
    okay = True
    if "Content-Security-Policy" not in html:
        record(results, False, "print.html missing Content-Security-Policy", "print")
        okay = False
    if re.search(r"\.innerHTML\s*=\s*(?:params|location|document\.URL|window\.name|location\.search)", html):
        record(results, False, "print.html assigns unsanitized URL/params to innerHTML", "print")
        okay = False
    if "isValidPayload" not in html and "typeof payload" not in html:
        record(results, False, "print.html should validate payload shape before use", "print")
        okay = False
    if okay:
        record(results, True, "print.html has CSP and validates payload", "print")
    return okay


def check_remote_assets(results: list[dict]) -> bool:
    okay = True
    for path in APP_HTML_FILES:
        if not path.exists():
            continue
        html = read_text(path)
        if REMOTE_ASSET_PATTERN.search(html):
            record(results, False, f"{path.name} references remote font/script infrastructure", "security")
            okay = False
    for path in EXECUTABLE_FILES:
        if not path.exists():
            continue
        text = read_text(path)
        if RUNTIME_FETCH_PATTERN.search(text):
            record(results, False, f"{path.name} performs runtime fetch or remote data request", "security")
            okay = False
    if okay:
        record(results, True, "App entry pages use local assets; no runtime remote fetches", "security")
    return okay


def check_security_documentation(results: list[dict]) -> bool:
    required = [ROOT / "SECURITY-FORCE.md", ROOT / "THREAT-MODEL.md", ROOT / "SECURE-FORCE.md"]
    okay = True
    for path in required:
        if not path.exists():
            record(results, False, f"Missing security doc: {path.name}", "docs")
            okay = False
    if okay:
        record(results, True, "Security documentation present (SECURITY-FORCE, THREAT-MODEL, SECURE-FORCE)", "docs")
    return okay


def check_basic_local_scripts_only(results: list[dict]) -> bool:
    if not BASIC_HTML.exists():
        record(results, False, "340b-BASIC.html is missing", "basic")
        return False
    html = read_text(BASIC_HTML)
    for match in re.finditer(r"<script[^>]+src=[\"']([^\"']+)[\"']", html, re.IGNORECASE):
        src = match.group(1).strip()
        if src.startswith(("http://", "https://", "//")):
            record(results, False, f"340b-BASIC.html uses remote script: {src}", "basic")
            return False
    record(results, True, "340b-BASIC.html uses only local scripts (IT-safe)", "basic")
    return True


def check_print_localstorage_namespace(results: list[dict]) -> bool:
    js = read_text(ROOT / "340b.js")
    pr = read_text(ROOT / "print.html") if PRINT_HTML.exists() else ""
    okay = True
    if not pr:
        skip(results, "print.html not present; skipping localStorage namespace check", "print")
        return True
    if "hap340b:printSnapshot" not in js or "hap340b:printSnapshot" not in pr:
        record(results, False, "Missing namespaced localStorage key hap340b:printSnapshot", "print")
        okay = False
    if "hap340bPrint" not in pr:
        record(results, False, "print.html should retain legacy key hap340bPrint for migration", "print")
        okay = False
    if "payloadVersion" not in js or "payloadVersion" not in pr:
        record(results, False, "Print payload should include payloadVersion", "print")
        okay = False
    if okay:
        record(results, True, "Print pipeline: namespaced localStorage, legacy read, payload version", "print")
    return okay


def check_removed_feature_copy(results: list[dict]) -> bool:
    okay = True
    for path in DASHBOARD_FILES:
        if not path.exists():
            continue
        text = read_text(path).lower()
        for term in REMOVED_FEATURE_TERMS:
            if term in text:
                record(results, False, f"{path.name} mentions removed feature `{term}`", "copy")
                okay = False
    if okay:
        record(results, True, "No stale removed-feature copy in core files", "copy")
    return okay


def check_print_css(results: list[dict]) -> bool:
    css_path = ROOT / "340b.css"
    text = read_text(css_path)
    if "@media print" not in text:
        record(results, False, "340b.css missing @media print", "print")
        return False
    ps = text.find("@media print")
    block = text[ps : ps + 8000]
    okay = True
    if "font-size" not in block:
        record(results, False, "340b.css @media print should set font-size", "print")
        okay = False
    if "max-height" not in block:
        record(results, False, "340b.css @media print should set max-height for map", "print")
        okay = False
    if okay:
        record(results, True, "340b.css @media print has font-size and map max-height", "print")
    return okay


def check_print_structure(results: list[dict]) -> bool:
    html = read_text(ROOT / "340b.html")
    required = [
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
    missing = [s for s in required if s not in html]
    if missing:
        for s in missing:
            record(results, False, f"340b.html missing print structure: `{s}`", "print")
        return False
    if 'class="print-executive-summary print-only"' in html:
        record(results, False, "340b.html still has removed duplicate print executive summary", "print")
        return False
    record(results, True, "340b.html print structure intact", "print")
    return True


def check_prompt_waves(results: list[dict]) -> bool:
    if not PROMPTS_FILE.exists():
        skip(results, "Prompts file not present; skipping wave check", "docs")
        return True
    prompts = read_text(PROMPTS_FILE)
    required = [f"## Prompts v{n:02d}" if n < 10 else f"## Prompts v{n}" for n in range(9, 51)]
    required += ["## Prompts v61", "## Prompts v70", "## Alternate Prompts v40-v50"]
    missing = [s for s in required if s not in prompts]
    if missing:
        for s in missing:
            record(results, False, f"Prompt library missing section `{s}`", "docs")
        return False
    record(results, True, "Prompt library contains v09–v70 plus alternate track", "docs")
    return True


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 2: Smoke Tests — Page Structure
# ══════════════════════════════════════════════════════════════════════════════


def check_html_pages_parse(results: list[dict]) -> bool:
    """Every HTML page should have <!DOCTYPE>, <html>, <head>, <body>."""
    okay = True
    for path in ALL_HTML_PAGES:
        if not path.exists():
            skip(results, f"{path.name} not present", "smoke")
            continue
        html = read_text(path)
        hl = html[:500].lower()
        problems = []
        if "<!doctype html>" not in hl:
            problems.append("missing <!DOCTYPE html>")
        if "<html" not in hl:
            problems.append("missing <html> tag")
        if "<head" not in html[:2000].lower():
            problems.append("missing <head>")
        if "<body" not in html.lower():
            problems.append("missing <body>")
        if problems:
            record(results, False, f"{path.name}: {', '.join(problems)}", "smoke")
            okay = False
        else:
            record(results, True, f"{path.name} has valid HTML structure", "smoke")
    return okay


def check_scripts_exist(results: list[dict]) -> bool:
    """Every <script src="..."> in HTML pages should point to a file that exists."""
    okay = True
    checked = 0
    for page in ALL_HTML_PAGES:
        if not page.exists():
            continue
        html = read_text(page)
        for match in re.finditer(r'<script[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE):
            src = match.group(1).strip()
            if src.startswith(("http://", "https://", "//")):
                continue
            # Strip cache-busting query strings (e.g. "340b.js?v=dmx-16" → "340b.js")
            clean_src = src.split("?")[0]
            resolved = ROOT / clean_src
            if not resolved.exists():
                record(results, False, f"{page.name} references missing script: {clean_src}", "smoke")
                okay = False
            checked += 1
    if okay and checked > 0:
        record(results, True, f"All {checked} local script references resolve to existing files", "smoke")
    return okay


def check_stylesheets_exist(results: list[dict]) -> bool:
    """Every <link rel="stylesheet" href="..."> should point to a file that exists."""
    okay = True
    checked = 0
    for page in ALL_HTML_PAGES:
        if not page.exists():
            continue
        html = read_text(page)
        for match in re.finditer(r'<link[^>]+href=["\']([^"\']+)["\'][^>]*>', html, re.IGNORECASE):
            tag = match.group(0)
            href = match.group(1).strip()
            if 'rel="stylesheet"' not in tag and "stylesheet" not in tag:
                continue
            if href.startswith(("http://", "https://", "//")):
                continue
            clean_href = href.split("?")[0]
            resolved = ROOT / clean_href
            if not resolved.exists():
                record(results, False, f"{page.name} references missing stylesheet: {clean_href}", "smoke")
                okay = False
            checked += 1
    if okay and checked > 0:
        record(results, True, f"All {checked} local stylesheet references resolve to existing files", "smoke")
    return okay


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 3: MetricKey Resolution
# ══════════════════════════════════════════════════════════════════════════════


def _load_metric_registry() -> list[str]:
    """Load all metricKey values from the metric registry."""
    reg_path = ROOT / "powerbi" / "metric-registry.json"
    if not reg_path.exists():
        return []
    data = json.loads(read_text(reg_path))
    return [m["metricKey"] for m in data.get("metrics", []) if "metricKey" in m]


def check_metric_keys_in_html(results: list[dict]) -> bool:
    """Every data-metric-key attribute in HTML must exist in metric-registry.json."""
    registry_keys = _load_metric_registry()
    if not registry_keys:
        skip(results, "metric-registry.json not found or empty; skipping MetricKey check", "semantic")
        return True

    okay = True
    found_keys: set[str] = set()
    for page in ALL_HTML_PAGES:
        if not page.exists():
            continue
        html = read_text(page)
        for match in re.finditer(r'data-metric-key=["\']([^"\']+)["\']', html):
            key = match.group(1)
            found_keys.add(key)
            if key not in registry_keys:
                record(results, False, f"{page.name}: data-metric-key=\"{key}\" not in metric-registry.json", "semantic")
                okay = False

    if okay and found_keys:
        record(results, True, f"All {len(found_keys)} data-metric-key attributes resolve to metric-registry.json", "semantic")
    elif not found_keys:
        skip(results, "No data-metric-key attributes found in HTML pages", "semantic")
    return okay


def check_metric_keys_in_datalayer(results: list[dict]) -> bool:
    """MetricKeys referenced in the registry should appear somewhere in data-layer.js."""
    registry_keys = _load_metric_registry()
    dl_path = ROOT / "modules" / "data-layer.js"
    if not registry_keys or not dl_path.exists():
        skip(results, "metric-registry or data-layer.js missing; skipping cross-check", "semantic")
        return True

    dl_text = read_text(dl_path)
    missing = [k for k in registry_keys if k not in dl_text]
    if missing:
        for k in missing:
            record(results, False, f"MetricKey \"{k}\" in registry but not referenced in data-layer.js", "semantic")
        return False
    record(results, True, f"All {len(registry_keys)} registry MetricKeys appear in data-layer.js", "semantic")
    return True


def check_registry_vs_semantic_layer(results: list[dict]) -> bool:
    """Every MetricKey in the registry should have an entry in semantic-layer-registry.json."""
    registry_keys = _load_metric_registry()
    slr_path = ROOT / "powerbi" / "semantic-layer-registry.json"
    if not registry_keys or not slr_path.exists():
        skip(results, "Registry or semantic-layer-registry missing; skipping", "semantic")
        return True

    slr_text = read_text(slr_path)
    missing = [k for k in registry_keys if k not in slr_text]
    if missing:
        for k in missing:
            record(results, False, f"MetricKey \"{k}\" in registry but absent from semantic-layer-registry.json", "semantic")
        return False
    record(results, True, f"All {len(registry_keys)} MetricKeys present in semantic-layer-registry.json", "semantic")
    return True


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 4: JSON Validity
# ══════════════════════════════════════════════════════════════════════════════


def check_json_files_valid(results: list[dict]) -> bool:
    """All JSON files in the project must parse without errors."""
    okay = True
    checked = 0
    for path in JSON_FILES:
        if not path.exists():
            continue
        try:
            json.loads(read_text(path))
            checked += 1
        except json.JSONDecodeError as e:
            record(results, False, f"{path.relative_to(ROOT)} is invalid JSON: {e}", "json")
            okay = False
    if okay and checked > 0:
        record(results, True, f"All {checked} JSON files parse successfully", "json")
    return okay


def check_manifest_required_fields(results: list[dict]) -> bool:
    """manifest.json (PWA) should have name, start_url, display, and at least one icon."""
    manifest_path = ROOT / "manifest.json"
    if not manifest_path.exists():
        skip(results, "manifest.json not present; skipping PWA check", "pwa")
        return True
    try:
        data = json.loads(read_text(manifest_path))
    except json.JSONDecodeError:
        record(results, False, "manifest.json is invalid JSON", "pwa")
        return False

    required = ["name", "start_url", "display"]
    missing = [f for f in required if f not in data]
    if missing:
        record(results, False, f"manifest.json missing required fields: {', '.join(missing)}", "pwa")
        return False
    if "icons" not in data or not data["icons"]:
        record(results, False, "manifest.json should have at least one icon", "pwa")
        return False
    record(results, True, "manifest.json has required PWA fields (name, start_url, display, icons)", "pwa")
    return True


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 5: Module API Surface
# ══════════════════════════════════════════════════════════════════════════════


def check_datalayer_api_surface(results: list[dict]) -> bool:
    """DataLayer module must expose all expected public methods."""
    dl_path = ROOT / "modules" / "data-layer.js"
    if not dl_path.exists():
        record(results, False, "modules/data-layer.js missing", "modules")
        return False

    text = read_text(dl_path)
    expected_methods = [
        "getStates", "getKPIs", "getPA", "getDelegation", "getLegislators",
        "getConfig", "getFipsLookup", "getStateNames", "getRawState340B",
        "getMetricNumeric", "getFreshness", "getPA340bHospitalPoints",
        "submitStory", "exportJSON", "connectWarehouse", "connectAPI",
        "connectPowerBI", "refresh", "disconnect", "onRefresh", "getStatus",
        "isTrustedLegislatorUrl", "getPaLegislatorPhotoUrl",
        "getPaLegislatorBioPageUrl", "getProvenanceSnapshot",
    ]
    missing = [m for m in expected_methods if m not in text]
    if missing:
        for m in missing:
            record(results, False, f"DataLayer missing expected method: {m}", "modules")
        return False
    record(results, True, f"DataLayer exposes all {len(expected_methods)} expected public methods", "modules")
    return True


def check_aihelpers_api_surface(results: list[dict]) -> bool:
    """AIHelpers module must expose expected public methods."""
    ai_path = ROOT / "modules" / "ai-helpers.js"
    if not ai_path.exists():
        skip(results, "modules/ai-helpers.js not present; skipping", "modules")
        return True

    text = read_text(ai_path)
    expected = ["summarizeStory", "generateChartNarrative", "getPolicyAlert", "summarizePolicyAlert"]
    missing = [m for m in expected if m not in text]
    if missing:
        for m in missing:
            record(results, False, f"AIHelpers missing method: {m}", "modules")
        return False
    record(results, True, f"AIHelpers exposes all {len(expected)} expected methods", "modules")
    return True


def check_modules_have_headers(results: list[dict]) -> bool:
    """Every module .js file should have a file-level JSDoc header."""
    okay = True
    for path in MODULE_FILES:
        if not path.exists():
            continue
        text = read_text(path)
        if not text.lstrip().startswith("/**"):
            record(results, False, f"{path.name} missing file-level JSDoc header", "novice")
            okay = False
    if okay:
        record(results, True, "All module files have JSDoc headers", "novice")
    return okay


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 6: Cross-File Consistency
# ══════════════════════════════════════════════════════════════════════════════


def check_state_data_globals(results: list[dict]) -> bool:
    """state-data.js must define the core globals the dashboard reads."""
    sd_path = ROOT / "state-data.js"
    if not sd_path.exists():
        record(results, False, "state-data.js missing", "data")
        return False
    text = read_text(sd_path)
    required = ["STATE_340B", "STATE_NAMES", "FIPS_TO_ABBR", "CONFIG"]
    missing = [g for g in required if g not in text]
    if missing:
        for g in missing:
            record(results, False, f"state-data.js missing expected global: {g}", "data")
        return False
    record(results, True, "state-data.js defines all expected globals (STATE_340B, STATE_NAMES, FIPS_TO_ABBR, CONFIG)", "data")
    return True


def check_service_worker(results: list[dict]) -> bool:
    """If sw.js exists (PWA), it should reference key assets."""
    sw_path = ROOT / "sw.js"
    if not sw_path.exists():
        skip(results, "sw.js not present; no PWA service worker", "pwa")
        return True
    text = read_text(sw_path)
    if "340b-mobile.html" not in text and "340b-mobile" not in text:
        record(results, False, "sw.js should cache 340b-mobile.html for offline", "pwa")
        return False
    record(results, True, "sw.js references mobile entry point for offline caching", "pwa")
    return True


def check_data_dictionary_coverage(results: list[dict]) -> bool:
    """DATA-DICTIONARY.md should mention all MetricKeys from the registry."""
    dd_path = ROOT / "docs" / "DATA-DICTIONARY.md"
    registry_keys = _load_metric_registry()
    if not dd_path.exists() or not registry_keys:
        skip(results, "DATA-DICTIONARY.md or metric-registry missing; skipping coverage check", "docs")
        return True
    text = read_text(dd_path)
    missing = [k for k in registry_keys if k not in text]
    if missing:
        for k in missing:
            record(results, False, f"DATA-DICTIONARY.md does not mention MetricKey \"{k}\"", "docs")
        return False
    record(results, True, f"DATA-DICTIONARY.md covers all {len(registry_keys)} MetricKeys", "docs")
    return True


def check_settings_no_secrets(results: list[dict]) -> bool:
    """config/settings.js must not contain hardcoded secrets."""
    settings_path = ROOT / "config" / "settings.js"
    if not settings_path.exists():
        skip(results, "config/settings.js not present", "security")
        return True
    text = read_text(settings_path).lower()
    danger_patterns = [
        r"bearer\s+[a-z0-9]",
        r"api[_-]?key\s*[:=]\s*['\"][a-z0-9]",
        r"password\s*[:=]\s*['\"][^\s]",
        r"secret\s*[:=]\s*['\"][a-z0-9]",
    ]
    for pat in danger_patterns:
        if re.search(pat, text):
            record(results, False, f"config/settings.js may contain a hardcoded secret (pattern: {pat})", "security")
            return False
    record(results, True, "config/settings.js has no hardcoded secrets", "security")
    return True


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 7: Internal Link & Asset Resolution
# ══════════════════════════════════════════════════════════════════════════════


HREF_PATTERN = re.compile(r'<a\b[^>]+href=["\']([^"\'#][^"\']*)["\']', re.IGNORECASE)
ANCHOR_HREF_PATTERN = re.compile(r'<a\b[^>]+href=["\']#([^"\']+)["\']', re.IGNORECASE)
ID_ATTR_PATTERN = re.compile(r'\bid=["\']([^"\']+)["\']', re.IGNORECASE)
IMG_SRC_PATTERN = re.compile(r'<img\b[^>]+src=["\']([^"\']+)["\']', re.IGNORECASE)


def check_internal_links(results: list[dict]) -> bool:
    """Local href= links in HTML must resolve to files that exist."""
    okay = True
    checked = 0
    for page in ALL_HTML_PAGES:
        if not page.exists():
            continue
        html = read_text(page)
        for match in HREF_PATTERN.finditer(html):
            href = match.group(1).strip()
            if href.startswith(("http://", "https://", "//", "mailto:", "tel:", "javascript:")):
                continue
            clean = href.split("?")[0].split("#")[0]
            if not clean:
                continue
            resolved = ROOT / clean
            if not resolved.exists():
                record(results, False, f"{page.name}: broken internal link href=\"{clean}\"", "links")
                okay = False
            checked += 1
    if okay and checked > 0:
        record(results, True, f"All {checked} internal links resolve to existing files", "links")
    elif checked == 0:
        skip(results, "No internal href links found to check", "links")
    return okay


def check_anchor_targets(results: list[dict]) -> bool:
    """href="#id" links must reference an id= that exists in the same page."""
    okay = True
    checked = 0
    for page in ALL_HTML_PAGES:
        if not page.exists():
            continue
        html = read_text(page)
        ids_on_page = set(ID_ATTR_PATTERN.findall(html))
        for match in ANCHOR_HREF_PATTERN.finditer(html):
            target_id = match.group(1)
            if target_id not in ids_on_page:
                record(results, False, f"{page.name}: anchor href=\"#{target_id}\" has no matching id on page", "links")
                okay = False
            checked += 1
    if okay and checked > 0:
        record(results, True, f"All {checked} anchor links resolve to ids on their page", "links")
    elif checked == 0:
        skip(results, "No anchor links found to check", "links")
    return okay


def check_image_sources(results: list[dict]) -> bool:
    """Local <img src="..."> must point to files that exist."""
    okay = True
    checked = 0
    for page in ALL_HTML_PAGES:
        if not page.exists():
            continue
        html = read_text(page)
        for match in IMG_SRC_PATTERN.finditer(html):
            src = match.group(1).strip()
            if src.startswith(("http://", "https://", "//", "data:")):
                continue
            clean = src.split("?")[0]
            if not clean:
                continue
            resolved = ROOT / clean
            if not resolved.exists():
                record(results, False, f"{page.name}: broken image src=\"{clean}\"", "links")
                okay = False
            checked += 1
    if okay and checked > 0:
        record(results, True, f"All {checked} local image sources resolve to existing files", "links")
    elif checked == 0:
        skip(results, "No local img src attributes found to check", "links")
    return okay


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 8: Metric Data Attribute Validation
# ══════════════════════════════════════════════════════════════════════════════


DATA_COUNT_PATTERN = re.compile(
    r'data-metric-key=["\']([^"\']+)["\'][^>]*data-count=["\']([^"\']+)["\']',
    re.IGNORECASE,
)
DATA_COUNT_ALT_PATTERN = re.compile(
    r'data-count=["\']([^"\']+)["\'][^>]*data-metric-key=["\']([^"\']+)["\']',
    re.IGNORECASE,
)


def check_metric_data_values(results: list[dict]) -> bool:
    """data-count on metric-keyed elements must be a valid number."""
    okay = True
    checked = 0
    for page in ALL_HTML_PAGES:
        if not page.exists():
            continue
        html = read_text(page)
        pairs: list[tuple[str, str]] = []
        for m in DATA_COUNT_PATTERN.finditer(html):
            pairs.append((m.group(1), m.group(2)))
        for m in DATA_COUNT_ALT_PATTERN.finditer(html):
            pairs.append((m.group(2), m.group(1)))
        seen: set[str] = set()
        for metric_key, count_val in pairs:
            tag = f"{metric_key}@{count_val}"
            if tag in seen:
                continue
            seen.add(tag)
            try:
                float(count_val)
                checked += 1
            except ValueError:
                record(results, False, f"{page.name}: data-metric-key=\"{metric_key}\" has non-numeric data-count=\"{count_val}\"", "metrics")
                okay = False
    if okay and checked > 0:
        record(results, True, f"All {checked} metric data-count values are valid numbers", "metrics")
    elif checked == 0:
        skip(results, "No data-metric-key + data-count pairs found", "metrics")
    return okay


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 9: Expanded DOM Safety (modules + XSS vectors)
# ══════════════════════════════════════════════════════════════════════════════


TEMPLATE_SQL_INJECTION = re.compile(r"(query|execute|prepare|run)\s*\(\s*`", re.IGNORECASE)
INNERHTML_ASSIGNMENT = re.compile(r"\.innerHTML\s*=")
DOCUMENT_WRITE = re.compile(r"\bdocument\.write\s*\(")
UNSANITIZED_INNERHTML = re.compile(r"\.innerHTML\s*=\s*[^'\";\n]*\b(input|value|param|query|hash|search|location)\b")


def check_module_dom_safety(results: list[dict]) -> bool:
    """Deeper DOM safety scan across all module .js files."""
    okay = True
    for path in MODULE_FILES:
        if not path.exists():
            continue
        text = read_text(path)
        name = path.name

        if TEMPLATE_SQL_INJECTION.search(text):
            record(results, False, f"{name}: template literal in query/execute call (SQL injection risk)", "dom-safety")
            okay = False

        if DOCUMENT_WRITE.search(text):
            record(results, False, f"{name}: uses document.write() (XSS and performance risk)", "dom-safety")
            okay = False

        if UNSANITIZED_INNERHTML.search(text):
            record(results, False, f"{name}: innerHTML assigned from user-controlled source", "dom-safety")
            okay = False

        for match in INNERHTML_ASSIGNMENT.finditer(text):
            start = max(0, match.start() - 200)
            context = text[start:match.end() + 200]
            if re.search(r"(user|param|input|location|hash|search|query)", context, re.IGNORECASE):
                record(results, False, f"{name}: innerHTML near user-input variable (line ~{text[:match.start()].count(chr(10)) + 1})", "dom-safety")
                okay = False
                break

    if okay:
        record(results, True, "Module files pass expanded DOM safety checks", "dom-safety")
    return okay


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 10: TypeScript / Build Checks
# ══════════════════════════════════════════════════════════════════════════════


def check_typescript_config(results: list[dict]) -> bool:
    """If tsconfig.json exists, verify it's valid JSON."""
    ts_path = ROOT / "tsconfig.json"
    if not ts_path.exists():
        skip(results, "tsconfig.json not present; no TypeScript configured", "typescript")
        return True
    try:
        json.loads(read_text(ts_path))
        record(results, True, "tsconfig.json is valid JSON", "typescript")
        return True
    except json.JSONDecodeError as e:
        record(results, False, f"tsconfig.json is invalid JSON: {e}", "typescript")
        return False


def check_type_definitions_exist(results: list[dict]) -> bool:
    """If types/ directory exists, verify .d.ts files cover core modules."""
    types_dir = ROOT / "types"
    if not types_dir.exists():
        skip(results, "types/ directory not present; no type definitions", "typescript")
        return True
    expected = ["data-layer.d.ts", "ai-helpers.d.ts", "globals.d.ts"]
    missing = [f for f in expected if not (types_dir / f).exists()]
    if missing:
        for f in missing:
            record(results, False, f"types/{f} missing", "typescript")
        return False
    record(results, True, f"Type definition files present: {', '.join(expected)}", "typescript")
    return True


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 11: Schema Validation
# ══════════════════════════════════════════════════════════════════════════════


METRIC_REGISTRY_REQUIRED_FIELDS = ["metricKey", "unit", "goldColumns", "authoritativeSourceUrls"]


def check_metric_registry_schema(results: list[dict]) -> bool:
    """Each metric in metric-registry.json must have required fields and valid types."""
    reg_path = ROOT / "powerbi" / "metric-registry.json"
    if not reg_path.exists():
        skip(results, "metric-registry.json not found; skipping schema check", "schema")
        return True
    data = json.loads(read_text(reg_path))
    metrics = data.get("metrics", [])
    if not metrics:
        record(results, False, "metric-registry.json has empty metrics array", "schema")
        return False

    okay = True
    for m in metrics:
        key_label = m.get("metricKey", "???")
        missing = [f for f in METRIC_REGISTRY_REQUIRED_FIELDS if f not in m]
        if missing:
            record(results, False, f"Metric '{key_label}' missing required fields: {', '.join(missing)}", "schema")
            okay = False
        if "goldColumns" in m and not isinstance(m["goldColumns"], dict):
            record(results, False, f"Metric '{key_label}' goldColumns should be an object", "schema")
            okay = False
        if "authoritativeSourceUrls" in m and not isinstance(m["authoritativeSourceUrls"], list):
            record(results, False, f"Metric '{key_label}' authoritativeSourceUrls should be an array", "schema")
            okay = False
    if okay:
        record(results, True, f"All {len(metrics)} metrics pass schema validation", "schema")
    return okay


def check_semantic_layer_registry_schema(results: list[dict]) -> bool:
    """semantic-layer-registry.json must have required top-level sections with entries."""
    slr_path = ROOT / "powerbi" / "semantic-layer-registry.json"
    if not slr_path.exists():
        skip(results, "semantic-layer-registry.json not found", "schema")
        return True
    data = json.loads(read_text(slr_path))
    required_sections = ["kpiCards", "paFocusStats", "charts"]
    okay = True
    for section in required_sections:
        arr = data.get(section)
        if arr is None:
            record(results, False, f"semantic-layer-registry.json missing section '{section}'", "schema")
            okay = False
        elif isinstance(arr, list) and len(arr) == 0:
            record(results, False, f"semantic-layer-registry.json section '{section}' is empty", "schema")
            okay = False
    if okay:
        record(results, True, "semantic-layer-registry.json has all required sections", "schema")
    return okay


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 12: MetricKey Centralization
# ══════════════════════════════════════════════════════════════════════════════


def _extract_ts_metric_keys(path: Path) -> set[str]:
    """Extract MetricKey values from a TypeScript type union in data-layer.d.ts."""
    if not path.exists():
        return set()
    text = read_text(path)
    keys: set[str] = set()
    in_block = False
    for line in text.splitlines():
        if "type MetricKey" in line or "MetricKey =" in line:
            in_block = True
        if in_block:
            m = re.search(r'\|\s*"([A-Z][A-Z0-9_]+)"', line)
            if m:
                keys.add(m.group(1))
            if in_block and line.rstrip().endswith(";"):
                break
    return keys


def _extract_validator_metric_keys(path: Path) -> set[str]:
    """Extract KNOWN_METRIC_KEYS values from metric-validator.ts."""
    if not path.exists():
        return set()
    text = read_text(path)
    keys: set[str] = set()
    in_block = False
    for line in text.splitlines():
        if "KNOWN_METRIC_KEYS" in line:
            in_block = True
        if in_block:
            m = re.search(r'"([A-Z][A-Z0-9_]+)"', line)
            if m:
                keys.add(m.group(1))
            if in_block and "] as const" in line:
                break
    return keys


def check_metrickey_centralization(results: list[dict]) -> bool:
    """MetricKeys must be identical across registry, TS types, and validator."""
    registry_keys = set(_load_metric_registry())
    if not registry_keys:
        skip(results, "No MetricKeys in registry; skipping centralization check", "schema")
        return True

    ts_keys = _extract_ts_metric_keys(ROOT / "types" / "data-layer.d.ts")
    mv_keys = _extract_validator_metric_keys(ROOT / "src" / "modules" / "metric-validator.ts")

    okay = True
    sources_checked = ["metric-registry.json"]

    if ts_keys:
        sources_checked.append("data-layer.d.ts")
        only_ts = ts_keys - registry_keys
        only_reg = registry_keys - ts_keys
        if only_ts:
            record(results, False, f"MetricKeys in data-layer.d.ts but not registry: {sorted(only_ts)}", "schema")
            okay = False
        if only_reg:
            record(results, False, f"MetricKeys in registry but not data-layer.d.ts: {sorted(only_reg)}", "schema")
            okay = False

    if mv_keys:
        sources_checked.append("metric-validator.ts")
        only_mv = mv_keys - registry_keys
        only_reg = registry_keys - mv_keys
        if only_mv:
            record(results, False, f"MetricKeys in metric-validator.ts but not registry: {sorted(only_mv)}", "schema")
            okay = False
        if only_reg:
            record(results, False, f"MetricKeys in registry but not metric-validator.ts: {sorted(only_reg)}", "schema")
            okay = False

    if okay:
        record(results, True, f"All {len(registry_keys)} MetricKeys aligned across {', '.join(sources_checked)}", "schema")
    return okay


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 13: Data Drift Detection
# ══════════════════════════════════════════════════════════════════════════════


def check_data_drift(results: list[dict]) -> bool:
    """Compare current data file shapes against drift-baseline.json."""
    baseline_path = ROOT / "data" / "drift-baseline.json"
    if not baseline_path.exists():
        skip(results, "data/drift-baseline.json not found; skipping drift detection", "drift")
        return True

    baseline = json.loads(read_text(baseline_path))
    tracked_files = baseline.get("files", {})
    if not tracked_files:
        skip(results, "drift-baseline.json has no tracked files", "drift")
        return True

    okay = True
    for rel_path, expectations in tracked_files.items():
        file_path = ROOT / rel_path
        if not file_path.exists():
            record(results, False, f"Drift: expected file '{rel_path}' is missing", "drift")
            okay = False
            continue

        try:
            data = json.loads(read_text(file_path))
        except json.JSONDecodeError:
            record(results, False, f"Drift: '{rel_path}' is not valid JSON", "drift")
            okay = False
            continue

        for top_key in expectations.get("requiredTopKeys", []):
            if top_key not in data:
                record(results, False, f"Drift: '{rel_path}' missing expected top-level key '{top_key}'", "drift")
                okay = False

        for key_path, info in expectations.get("arrayCounts", {}).items():
            min_count = info.get("min", 0)
            label = info.get("label", key_path)
            node = data
            for part in key_path.split("."):
                if isinstance(node, dict):
                    node = node.get(part)
                else:
                    node = None
                    break
            if node is None:
                record(results, False, f"Drift: '{rel_path}' key path '{key_path}' not found", "drift")
                okay = False
            elif isinstance(node, (list, dict)):
                actual = len(node)
                if actual < min_count:
                    record(results, False, f"Drift: '{rel_path}' {label} has {actual} entries, expected >= {min_count}", "drift")
                    okay = False

    if okay:
        record(results, True, f"Data drift check passed for {len(tracked_files)} tracked files", "drift")
    return okay


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 14: Mobile-Specific Checks
# ══════════════════════════════════════════════════════════════════════════════


def check_mobile_viewport(results: list[dict]) -> bool:
    """Mobile page must have a viewport meta tag for proper responsive rendering."""
    if not MOBILE_HTML.exists():
        skip(results, "340b-mobile.html not present; skipping viewport check", "mobile")
        return True
    html = read_text(MOBILE_HTML)
    if 'name="viewport"' not in html.lower() and "name='viewport'" not in html.lower():
        record(results, False, "340b-mobile.html missing <meta name=\"viewport\"> tag", "mobile")
        return False
    record(results, True, "340b-mobile.html has viewport meta tag", "mobile")
    return True


def check_mobile_metrickey_parity(results: list[dict]) -> bool:
    """Critical MetricKeys present on desktop must also appear on mobile."""
    desktop_path = ROOT / "340b.html"
    if not desktop_path.exists() or not MOBILE_HTML.exists():
        skip(results, "Desktop or mobile HTML missing; skipping parity check", "mobile")
        return True

    critical_keys = [
        "PA_HOSPITALS_340B_COUNT",
        "COMMUNITY_BENEFIT_TOTAL_BILLIONS",
        "US_STATES_CP_PROTECTION_COUNT",
        "US_STATES_NO_CP_PROTECTION_COUNT",
    ]

    mobile_html = read_text(MOBILE_HTML)
    okay = True
    missing = []
    for key in critical_keys:
        if f'data-metric-key="{key}"' not in mobile_html:
            missing.append(key)
            okay = False

    if missing:
        record(results, False, f"Mobile page missing critical MetricKey element(s): {', '.join(missing)}", "mobile")
    else:
        record(results, True, f"All {len(critical_keys)} critical MetricKeys present on mobile", "mobile")
    return okay


# ══════════════════════════════════════════════════════════════════════════════
#  RUNNER
# ══════════════════════════════════════════════════════════════════════════════


ALL_CHECKS = [
    # Security (original)
    ("Security: unsafe DOM patterns", check_unsafe_patterns),
    ("Security: hidden characters", check_hidden_characters),
    ("Security: external link safety", check_external_links),
    ("Security: CSP / referrer hardening", check_page_hardening),
    ("Security: no remote assets", check_remote_assets),
    ("Security: no secrets in settings", check_settings_no_secrets),
    ("Security: documentation present", check_security_documentation),
    ("BASIC: local scripts only", check_basic_local_scripts_only),
    # Print pipeline
    ("Print: localStorage namespace", check_print_localstorage_namespace),
    ("Print: print.html security", check_print_view_security),
    ("Print: CSS regression guards", check_print_view_regression_guards),
    ("Print: @media print block", check_print_css),
    ("Print: 340b.html structure", check_print_structure),
    # Smoke tests
    ("Smoke: HTML pages parse", check_html_pages_parse),
    ("Smoke: script files exist", check_scripts_exist),
    ("Smoke: stylesheets exist", check_stylesheets_exist),
    # Semantic layer / MetricKeys
    ("Semantic: MetricKeys in HTML → registry", check_metric_keys_in_html),
    ("Semantic: MetricKeys in registry → DataLayer", check_metric_keys_in_datalayer),
    ("Semantic: registry ↔ semantic-layer-registry", check_registry_vs_semantic_layer),
    # JSON validity
    ("JSON: all project JSON files valid", check_json_files_valid),
    ("PWA: manifest.json fields", check_manifest_required_fields),
    # Module API
    ("Module: DataLayer API surface", check_datalayer_api_surface),
    ("Module: AIHelpers API surface", check_aihelpers_api_surface),
    ("Module: JSDoc headers", check_modules_have_headers),
    # Cross-file consistency
    ("Data: state-data.js globals", check_state_data_globals),
    ("Data: DATA-DICTIONARY coverage", check_data_dictionary_coverage),
    ("PWA: service worker caching", check_service_worker),
    # Links & asset resolution
    ("Links: internal href links", check_internal_links),
    ("Links: anchor targets (#id)", check_anchor_targets),
    ("Links: image sources", check_image_sources),
    # Metric data attributes
    ("Metrics: data-count values numeric", check_metric_data_values),
    # Expanded DOM safety
    ("DOM safety: module injection patterns", check_module_dom_safety),
    # Copy
    ("Copy: no stale removed features", check_removed_feature_copy),
    ("Copy: prompt waves", check_prompt_waves),
    # TypeScript
    ("TypeScript: tsconfig valid", check_typescript_config),
    ("TypeScript: type definitions", check_type_definitions_exist),
    # Schema validation
    ("Schema: metric-registry entry fields", check_metric_registry_schema),
    ("Schema: semantic-layer-registry sections", check_semantic_layer_registry_schema),
    ("Schema: MetricKey centralization", check_metrickey_centralization),
    # Drift detection
    ("Drift: data file shape stability", check_data_drift),
    # Mobile-specific
    ("Mobile: viewport meta tag", check_mobile_viewport),
    ("Mobile: MetricKey parity", check_mobile_metrickey_parity),
]


def main() -> int:
    start = time.time()
    verbose = "--verbose" in sys.argv
    json_mode = "--json" in sys.argv

    results: list[dict] = []
    all_ok = True

    for label, check in ALL_CHECKS:
        try:
            passed = check(results)
            all_ok = all_ok and passed
        except Exception as e:
            record(results, False, f"[{label}] Crashed: {e}", "error")
            all_ok = False

    elapsed = round(time.time() - start, 2)

    if json_mode:
        output: dict[str, Any] = {
            "passed": all_ok,
            "stats": _stats,
            "elapsed_seconds": elapsed,
            "results": results,
            "manual_checks": MANUAL_CHECKS,
        }
        print(json.dumps(output, indent=2))
        return 0 if all_ok else 1

    # Human-readable output
    print("=" * 60)
    print("  340B Dashboard Audit & Smoke Tests")
    print("=" * 60)
    print()

    categories_seen: list[str] = []
    for r in results:
        cat = r["category"]
        if cat not in categories_seen:
            categories_seen.append(cat)

    for cat in categories_seen:
        cat_results = [r for r in results if r["category"] == cat]
        print(f"  [{cat.upper()}]")
        for r in cat_results:
            icon = {"PASS": "+", "FAIL": "X", "SKIP": "-"}[r["status"]]
            if r["status"] == "FAIL" or verbose:
                print(f"    [{icon}] {r['message']}")
            elif r["status"] == "SKIP":
                print(f"    [-] {r['message']}")
            else:
                print(f"    [+] {r['message']}")
        print()

    print("-" * 60)
    print(f"  PASS: {_stats['pass']}  |  FAIL: {_stats['fail']}  |  SKIP: {_stats['skip']}  |  {elapsed}s")
    print("-" * 60)

    if _stats["fail"] > 0:
        print("\n  VERDICT: FAIL — fix issues above before merge\n")
    else:
        print("\n  VERDICT: PASS — all automated checks green\n")

    print("  Manual checks still required:")
    for item in MANUAL_CHECKS:
        print(f"    - {item}")
    print()

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
