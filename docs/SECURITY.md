# Security — 340B Dashboard

For full security notes, checklist, and code patterns, see **[SECURITY.md](../SECURITY.md)** in the repository root.

Quick reference:

- **Code patterns:** Use `textContent` or `safeText()` for dynamic content; no `innerHTML` with data. Use try/catch with `JSON.parse`. External links must use `rel="noopener noreferrer"`.
- **Audit:** Run the static audit checklist in root SECURITY.md before publishing significant changes.
