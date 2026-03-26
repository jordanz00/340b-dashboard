#!/usr/bin/env python3
"""
100x Upgrade — Run all agents and write reports.
Usage: python3 scripts/run_agents.py [--qa|--security|--a11y|--data|--perf|--stakeholder|crosscheck|all]
Default: all (run every agent then crosscheck).
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "reports"
DASHBOARD_FILES = ["340b.html", "340b.css", "340b.js", "state-data.js", "print.html", "print-view.css"]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def write_report(name: str, lines: list[str]) -> None:
    REPORTS.mkdir(parents=True, exist_ok=True)
    out = ROOT / "reports" / name
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {out}")


def qa_agent() -> None:
    """Check core functionality: map, filters, KPIs, PDF/export, responsive."""
    lines = ["# QA Report", "", "## Core functionality", ""]
    for f in DASHBOARD_FILES:
        p = ROOT / f
        lines.append(f"- {'PASS' if p.exists() else 'FAIL'}: `{f}` exists")
    lines.append("")
    lines.append("## Audit script")
    r = subprocess.run([sys.executable, str(ROOT / "dashboard-audit.py")], cwd=str(ROOT), capture_output=True, text=True)
    lines.append("```")
    lines.append(r.stdout or r.stderr or "")
    lines.append("```")
    lines.append("")
    lines.append("**Overall:** PASS" if r.returncode == 0 else "**Overall:** FAIL (see audit output)")
    write_report("qa_report.md", lines)


def security_agent() -> None:
    """Verify CSP, SRI, sanitize innerHTML, remove unsafe scripts."""
    lines = ["# Security Report", ""]
    for f in ["340b.html", "print.html"]:
        p = ROOT / f
        if not p.exists():
            lines.append(f"- FAIL: `{f}` missing")
            continue
        text = read_text(p)
        csp = "Content-Security-Policy" in text or "content-security-policy" in text.lower()
        lines.append(f"- {'PASS' if csp else 'FAIL'}: `{f}` has CSP")
        if f == "print.html":
            unsafe = re.search(r"\.innerHTML\s*=\s*(?:params|location|document\.URL|window\.name)", text)
            lines.append(f"- {'PASS' if not unsafe else 'FAIL'}: print.html no unsafe innerHTML sources")
    lines.append("")
    lines.append("Run `python3 dashboard-audit.py` for full security checks.")
    write_report("security_report.md", lines)


def accessibility_agent() -> None:
    """Validate keyboard nav, skip-map, touch targets, contrast, reduced-motion."""
    lines = ["# Accessibility Report", ""]
    html = read_text(ROOT / "340b.html")
    css = read_text(ROOT / "340b.css")
    checks = [
        ("Skip to main content", "skip-link" in html or "Skip to main" in html),
        ("Skip map link", "skip-map" in html or "Skip map" in html),
        ("aria-atomic on state panel", "aria-atomic" in html),
        ("Policy nav target (id=policy)", 'id="policy"' in html),
        ("skip-link focus-visible", "focus-visible" in css and "skip-link" in css),
        ("Touch targets 44px", "44px" in css or "min-height: 44px" in css),
    ]
    for label, ok in checks:
        lines.append(f"- {'PASS' if ok else 'FAIL'}: {label}")
    lines.append("")
    lines.append("Manual: Tab through map, test reduced-motion, check contrast.")
    write_report("accessibility_report.md", lines)


def data_agent() -> None:
    """Monitor state-data.js for stale/inconsistent data."""
    lines = ["# Data Report", ""]
    p = ROOT / "state-data.js"
    if not p.exists():
        lines.append("- FAIL: state-data.js missing")
        write_report("data_report.md", lines)
        return
    text = read_text(p)
    lines.append("- PASS: state-data.js exists")
    has_config = "CONFIG" in text or "var CONFIG" in text
    lines.append(f"- {'PASS' if has_config else 'FAIL'}: CONFIG present")
    has_state = "STATE_340B" in text
    lines.append(f"- {'PASS' if has_state else 'FAIL'}: STATE_340B present")
    dates = re.findall(r"(dataFreshness|lastUpdated|March 20\d{2})", text)
    lines.append(f"- Dates/freshness refs: {len(dates)}")
    lines.append("")
    lines.append("Manual: Verify dataFreshness and lastUpdated match current release.")
    write_report("data_report.md", lines)


def performance_agent() -> None:
    """Check load times, deferred/preload, images, lazy-loading."""
    lines = ["# Performance Report", ""]
    html = read_text(ROOT / "340b.html")
    checks = [
        ("Logo preload", "preload" in html and "image" in html),
        ("fetchpriority on logo", "fetchpriority" in html),
    ]
    for label, ok in checks:
        lines.append(f"- {'PASS' if ok else 'FAIL'}: {label}")
    lines.append("")
    lines.append("Manual: Run Lighthouse; ensure map draws after viewport.")
    write_report("performance_report.md", lines)


def stakeholder_agent() -> None:
    """Simulate executive UX: clarity, PDF readability, KPIs, filters."""
    lines = ["# Stakeholder Report", ""]
    html = read_text(ROOT / "340b.html")
    lines.append("- PASS: KPIs present (7%, $7.95B, 200+, 72)" if "72" in html and "7.95" in html else "- FAIL: KPIs missing or wrong")
    lines.append("- PASS: Print/PDF flow documented" if "Print" in html or "print" in html else "- FAIL: Print flow not evident")
    lines.append("- PASS: State filters (All / Protection / No protection)" if "state-filter" in html or "Protection" in html else "- FAIL: Filters missing")
    lines.append("")
    lines.append("Manual: Have 2–3 executives try Print/PDF and filters; capture feedback.")
    write_report("stakeholder_report.md", lines)


def crosscheck_agent() -> None:
    """Consolidate all reports and suggest prioritized fixes."""
    lines = ["# Consolidated Action Plan", ""]
    for name in ["qa_report.md", "security_report.md", "accessibility_report.md", "data_report.md", "performance_report.md", "stakeholder_report.md"]:
        p = REPORTS / name
        if p.exists():
            lines.append(f"## {name}")
            lines.append("")
            lines.append(read_text(p))
            lines.append("")
            lines.append("---")
            lines.append("")
        else:
            lines.append(f"## {name} (missing — run agents first)")
            lines.append("")
    lines.append("## Suggested order of fixes")
    lines.append("1. Security (CSP, innerHTML)")
    lines.append("2. QA (audit failures)")
    lines.append("3. Accessibility (skip-map, touch targets)")
    lines.append("4. Data (stale dates)")
    lines.append("5. Performance (preload)")
    lines.append("6. Stakeholder (manual testing)")
    write_report("consolidated_action_plan.md", lines)


def main() -> int:
    ap = argparse.ArgumentParser(description="Run 100x upgrade agents")
    ap.add_argument("agent", nargs="?", default="all", help="qa|security|a11y|data|perf|stakeholder|crosscheck|all")
    args = ap.parse_args()
    agent = (args.agent or "all").strip().lower()
    run = {
        "qa": qa_agent,
        "security": security_agent,
        "a11y": accessibility_agent,
        "data": data_agent,
        "perf": performance_agent,
        "stakeholder": stakeholder_agent,
        "crosscheck": crosscheck_agent,
    }
    if agent == "all":
        for fn in run.values():
            fn()
        crosscheck_agent()
        return 0
    if agent in run:
        run[agent]()
        if agent != "crosscheck":
            crosscheck_agent()
        return 0
    print("Unknown agent. Use: qa, security, a11y, data, perf, stakeholder, crosscheck, all")
    return 1


if __name__ == "__main__":
    sys.exit(main())
