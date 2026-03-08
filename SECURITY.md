# Security Notes

This dashboard is a static site. Most of its security posture comes from:

- safe DOM rendering in `340b.js`
- keeping local vendor files trusted and documented
- deploying with strong host-level headers

## Recommended host headers

If you deploy this on GitHub Pages, Netlify, Vercel, S3, or another static host, configure these headers where possible:

- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'`
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
6. Re-check print/PDF output after layout changes.

## Things to avoid

- Do not add remote scripts unless absolutely necessary.
- Do not move editable content into multiple places.
- Do not replace safe DOM creation with string-based HTML rendering.
- Do not update vendor assets without also updating `assets/vendor/README.md`.
