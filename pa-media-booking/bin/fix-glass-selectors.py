#!/usr/bin/env python3
"""Duplicate body.wp-theme-gutenify-photography rules for body.pa-glass-site."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "assets"
PATTERN = re.compile(
    r"body\.wp-theme-gutenify-photography([^{,]+)\{",
    re.MULTILINE,
)

for name in ("site.css", "glass.css", "booking.css"):
    path = ROOT / name
    text = path.read_text()
    text = text.replace("body.wp-theme-gutenify-photography, body.pa-glass-site ", "body.wp-theme-gutenify-photography ")

    def repl(match):
        suffix = match.group(1)
        if "body.pa-glass-site" in suffix:
            return match.group(0)
        return f"body.wp-theme-gutenify-photography{suffix}, body.pa-glass-site{suffix}{{"

    text = PATTERN.sub(repl, text)
    path.write_text(text)
    print("fixed", name)
