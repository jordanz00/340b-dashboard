#!/usr/bin/env python3
"""Deploy plugin files via wp-admin plugin editor using browser cookies export."""
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = 'pa-media-booking.disabled'
FILES = [
    'assets/booking.js',
    'assets/booking.css',
    'pa-media-booking.php',
    'includes/class-admin.php',
    'includes/class-frontend.php',
    'includes/class-payments.php',
]

def load_cookie_header(cookie_file: Path) -> str:
    raw = cookie_file.read_text()
    if raw.strip().startswith('['):
        data = json.loads(raw)
        return '; '.join(f"{c['name']}={c['value']}" for c in data if 'name' in c and 'value' in c)
    return raw.strip()

def fetch(url: str, cookie: str, data: bytes | None = None) -> str:
    req = urllib.request.Request(url, data=data, method='POST' if data else 'GET')
    req.add_header('Cookie', cookie)
    if data:
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read().decode('utf-8', 'replace')

def nonce_from_html(html: str) -> str:
    for pat in (
        r'name=["\']nonce["\'][^>]*value=["\']([^"\']+)["\']',
        r'value=["\']([^"\']+)["\'][^>]*name=["\']nonce["\']',
        r'name=["\']_wpnonce["\'][^>]*value=["\']([^"\']+)["\']',
    ):
        m = re.search(pat, html)
        if m:
            return m.group(1)
    return ''

def deploy_file(base: str, cookie: str, rel: str) -> str:
    content = (ROOT / rel).read_text()
    file_path = f'{PLUGIN}/{rel}'
    editor = (
        f'{base}/wp-admin/plugin-editor.php?file='
        + urllib.parse.quote(file_path)
        + '&plugin='
        + urllib.parse.quote(f'{PLUGIN}/pa-media-booking.php')
    )
    html = fetch(editor, cookie)
    if 'Session expired' in html and not nonce_from_html(html):
        return f'{rel}:session-expired'
    nonce = nonce_from_html(html)
    if not nonce:
        return f'{rel}:no-nonce'
    body = urllib.parse.urlencode({
        'nonce': nonce,
        'action': 'update',
        'file': file_path,
        'newcontent': content,
        'submit': 'Update File',
    }).encode()
    out = fetch(f'{base}/wp-admin/plugin-editor.php', cookie, body)
    return f'{rel}:{"ok" if "File edited successfully" in out else "fail"}'

def main() -> int:
    if len(sys.argv) < 2:
        print('Usage: deploy-wp-plugin.py COOKIE_FILE [https://pamedia.art]', file=sys.stderr)
        return 2
    cookie = load_cookie_header(Path(sys.argv[1]))
    base = sys.argv[2].rstrip('/') if len(sys.argv) > 2 else 'https://pamedia.art'
    for rel in FILES:
        print(deploy_file(base, cookie, rel))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
