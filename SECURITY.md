# Security Notes

## IT-safe hosting: use 340b-BASIC.html

If your IT or security team will not approve the full dashboard (external scripts, inline script, localStorage), host **340b-BASIC.html** instead:

- **No JavaScript.** No `<script>` tags. CSP is `script-src 'none'`.
- **Same content.** Overview, HAP position, key numbers, executive strip, state lists (static), recent legal signals, methodology, KPIs.
- **Same look.** Uses the same `340b.css`. No map, no PDF download, no filters—pure HTML.
- **Safe for locked-down environments.** No CDN, no inline script, no eval, no localStorage. Passes strict CSP and script restrictions.

Link from 340b-BASIC.html to 340b.html for users who are allowed to use the full interactive dashboard.

## Full dashboard (340b.html)

This dashboard is a static site. Most of its security posture comes from:

- safe DOM rendering in `340b.js`
- safe DOM rendering in older dashboard scripts like `main.js` and inline legacy pages
- keeping local vendor files trusted and documented
- keeping high-salience copy, metadata, and print trust cues aligned
- deploying with strong host-level headers
- keeping the documented threat model honest for future AI and human edits
- avoiding remote fonts, remote runtime data fetches, and unnecessary third-party scripts

## Recommended host headers

If you deploy this on GitHub Pages, Netlify, Vercel, S3, or another static host, configure these headers where possible:

- **HTTPS:** Serve the dashboard over HTTPS only in production. GitHub Pages provides HTTPS by default. For self-hosting, use a valid TLS certificate and redirect HTTP to HTTPS.
- **For 340b-BASIC.html only (strictest):** No script, so CSP can be `script-src 'none'`. See the CSP in 340b-BASIC.html.
- **For 340b.html (full dashboard):** CSP in the page allows `'self'` and `https://unpkg.com` for PDF libraries. If IT disallows external script, host 340b-BASIC.html instead or self-host html2canvas and jsPDF under `assets/vendor/` and change script src to local.
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`

Optional:

- `Permissions-Policy` can be added by the host if you want tighter browser feature control.

## Static audit checklist

Run these checks after meaningful edits:

1. Search for unsafe DOM patterns like `innerHTML`, `outerHTML`, `eval`, `new Function`, and inline event handlers.
2. Check for hidden Unicode or control characters in edited source files.
3. Verify all outbound links that open a new tab use `rel="noopener noreferrer"`.
4. Confirm the Share button still copies a canonical URL.
5. Confirm the map fallback still works if map assets fail.
6. Confirm high-salience copy in `state-data.js`, `340b.html`, and metadata surfaces still agree after edits.
7. Re-check print/PDF output after layout changes, including the overview, HAP position, executive scan strip, map visibility, and final metric values.
8. Confirm the PDF still reads clearly for a lawmaker, hospital CEO, or hospital administrator who may never open the live dashboard.
9. Run `python3 dashboard-audit.py` for the project’s lightweight built-in audit.
10. Run `HOME="$PWD" ./.venv-semgrep/bin/semgrep --config auto .` for a deeper SAST scan when security-sensitive code changes.

## Honesty note

The audit script is useful, but it is not a release decision by itself.

- It checks code and structure.
- It does not prove the print preview looks correct.
- It does not verify whether the legal-status sources are still current.
- It does not replace human review of policymaker or executive-facing copy.

## Human release gate

Do not publish until a human has confirmed:

1. the PDF reads correctly from first page to last page
2. the selected-state print context is acceptable
3. the source dates and source links are current
4. the wording still sounds precise for lawmakers, hospital CEOs, and administrators
5. the executive scan strip and metadata still match the main dashboard story

## Things to avoid

- Do not add remote scripts unless absolutely necessary.
- Do not move editable content into multiple places.
- Do not replace safe DOM creation with string-based HTML rendering.
- Do not update vendor assets without also updating `assets/vendor/README.md`.
- Do not describe this static site as having backend auth or secret-handling protections that do not actually exist.

## Code patterns (Wave 4)

- **Dynamic content:** Use `textContent` (or the dashboard’s `safeText()` helper) for any string that comes from data or could later come from user/external input. Do not use `innerHTML` with dynamic or unsanitized strings.
- **JSON:** If you add `JSON.parse()` (e.g. for future API or config), always use try/catch and handle parse errors; do not use the result without checking it.
- **Links:** Any link that opens in a new tab (`target="_blank"`) must include `rel="noopener noreferrer"`.
- **Map/content from external source:** Validate structure and bounds before rendering; do not inject raw response HTML or script into the page.
