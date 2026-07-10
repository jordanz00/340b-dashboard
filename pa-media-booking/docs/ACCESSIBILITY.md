# Accessibility — pamedia.art

**Target:** WCAG 2.2 Level AA on marketing + booking surfaces; AAA contrast on primary reading text where design allows.

**Lighthouse goal:** Accessibility **100** on `/`, `/services/`, `/work/`, `/book/` (see `docs/PERFORMANCE.md`).

---

## Standards map

| WCAG 2.2 | Implementation |
|----------|----------------|
| 1.1.1 Non-text Content | Portfolio `alt` from captions; video iframe `title` |
| 1.3.1 Info & Relationships | One H1 per page; landmarks; calendar `role="grid"` |
| 1.4.3 Contrast (AA) | Glass nav ink tokens; `prefers-contrast: more` solid fallbacks |
| 1.4.10 Reflow | 320px layout; no horizontal scroll on marketing pages |
| 2.1.1 Keyboard | All CTAs, lightboxes, filters, booking wizard |
| 2.1.2 No Keyboard Trap | `paA11yFocusTrap()` + ESC restores focus |
| 2.4.1 Bypass Blocks | Skip link → `#main-content` |
| 2.4.7 Focus Visible | `:focus-visible` tokens in `glass-site.css`, `header-nav.css` |
| 2.4.11 Focus Not Obscured | `scroll-margin` on inputs; sticky bar padding |
| 2.5.8 Target Size | 44×44px min on calendar days, filter chips, lightbox nav |
| 3.3.1 Labels | Booking fields use `<label for>` + `aria-describedby` errors |
| 4.1.2 Name, Role, Value | Dialog `aria-modal`; step `aria-live` announcements |

---

## Component checklist

| Component | File | Notes |
|-----------|------|-------|
| Skip link | `class-frontend.php`, `glass-site.css` | First focusable; visible on focus |
| Main landmark | `class-frontend.php`, `site.js` | `id="main-content"` |
| Nav current page | `site.js` | `aria-current="page"` |
| Gallery lightbox | `site.js` | Focus trap, ESC, focus restore |
| Video lightbox | `site.js` | Same pattern |
| Portfolio filters | `site.js` | `role="tablist"` / roving tabindex |
| Reviews carousel | `google-reviews.js` | Text rating + `aria-live` |
| Booking wizard | `booking.js` | Step announcements, labeled inputs |
| Reduced motion | `animations.js`, CSS | Parallax/tilt off when `prefers-reduced-motion: reduce` |

---

## Manual smoke script (pre-deploy)

Test with **keyboard only** and one screen reader (VoiceOver or NVDA):

1. Tab once → **Skip to main content** appears; Enter → focus moves to main
2. Tab through header nav → Book CTA reachable; Enter opens `/book/`
3. On `/book/` → Start booking → service cards keyboard-selectable
4. Calendar → arrow through days; prev/next month buttons labeled
5. Open portfolio image on `/work/` → ESC closes; focus returns to tile
6. Open video lightbox → ESC closes; focus returns to trigger

---

## Automated regression

From a machine with Node.js:

```bash
npx @axe-core/cli https://pamedia.art/ --tags wcag2a,wcag2aa
npx @axe-core/cli https://pamedia.art/services/ --tags wcag2a,wcag2aa
npx @axe-core/cli https://pamedia.art/work/ --tags wcag2a,wcag2aa
npx @axe-core/cli https://pamedia.art/book/ --tags wcag2a,wcag2aa
```

Lighthouse (Chrome DevTools → Lighthouse → Accessibility) on same four URLs.

---

## Sign-off matrix

Record scores after each production deploy:

| URL | Lighthouse A11y | axe critical | Keyboard smoke | SR smoke |
|-----|-----------------|--------------|----------------|----------|
| `/` | Target 100 | 0 | Pass | Pass |
| `/services/` | Target 100 | 0 | Pass | Pass |
| `/work/` | Target 100 | 0 | Pass | Pass |
| `/book/` | Target 100 | 0 | Pass | Pass |

**Baseline (pre-rollout):** Run Lighthouse + axe after first deploy of this rollout and paste scores here.

---

## Supported assistive technology

- **VoiceOver** + Safari (macOS / iOS) — primary mobile test
- **NVDA** + Chrome (Windows) — desktop test
- **Keyboard-only** — no mouse; verify all flows

---

## Theme caveat

Gutenberg/theme blocks outside the PA Media Booking plugin may add issues. This pass covers PA-controlled markup, CSS, and JS only.
