# NEXUS — Sales readiness checklist

Use this to move from **“not ready to sell”** to **minimum sellable product (MSP)**. Check boxes as you complete items.

---

## A. Product truth (blocks sales if wrong)

- [ ] **Landing = code = README** — Pro tier does not claim exclusive features that Free already has (see `js/watermark.js`: primary paid differentiator today is **watermark**).
- [ ] **“Pro 60” / hybrid presets** — Clarified in copy: library **name** vs **paid tier** (avoid confusion).
- [ ] **WebGL / browser** — Hero and pricing mention requirements; no “runs everywhere” without caveats.
- [ ] **Credits** — Butterchurn / MilkDrop / scene references remain visible ([index.html](../index.html) credits block).

---

## B. Monetization plumbing

- [ ] **Payment provider** chosen (Stripe, Lemon Squeezy, Paddle, Gumroad, etc.).
- [ ] **Checkout URL** or embed live; test card → success path.
- [ ] **Post-purchase delivery**: email with license key, magic link, or account—**not** only `localStorage` dev codes.
- [ ] **License validation** beyond trivial client checks (even a small server that signs short-lived tokens is a big step up).
- [ ] **Refund policy** written (e.g. 7 or 14 days) and linked at checkout.

---

## C. Legal / trust

- [ ] **Terms of Sale** (or Terms of Service) — license grant, restrictions, termination, liability cap, governing law.
- [ ] **Privacy Policy** — if you collect email/payment, analytics, or waitlist.
- [ ] **Commercial use** — explicitly granted in Pro; Free tier limited to personal/non-commercial unless you intend otherwise.
- [ ] **Open source** — [LICENSE](../LICENSE) is MIT; paid product is usually **binary/access** + **your** IP; confirm attorney if bundling third-party assets.

---

## D. Marketing assets

- [ ] **Waitlist or buy** — No `alert('Coming soon')` on primary CTA; use form, mailto, or checkout.
- [ ] **3 demo videos** — Free vs Pro (watermark), OBS present mode, one MIDI or “drop” clip.
- [ ] **Screenshots** — Present mode + UI for store listing if needed.
- [ ] **Social proof** — Real quotes or remove placeholder humor quote on [landing.html](../landing.html).
- [ ] **Pricing page** — Annual option optional; compare table honest.

---

## E. Support and operations

- [ ] **Support inbox** — `support@…` or help desk; SLA you can hit (e.g. 48h).
- [ ] **FAQ** — WebGL issues, Safari, OBS audio routing, refund link.
- [ ] **Status / updates** — Changelog or Discord; set expectations for static GitHub Pages app.

---

## F. Technical hardening (before scaling paid users)

- [ ] **No secrets** in repo (API keys only server-side).
- [ ] **Analytics** — Privacy-friendly (Plausible, Fathom) or none until policy exists.
- [ ] **Error states** — WebGL fatal screen ([index.html](../index.html) `#nx-fatal`) tested; no raw stack traces to users.

---

## G. “First dollar” definition of done

- [ ] A stranger can pay, receive a license, remove watermark (or get promised benefit), and you would **not** be embarrassed if they post a review.

---

## Quick links

- Business context: [BUSINESS-PLAN.md](./BUSINESS-PLAN.md)
- Engineering roadmap: [VISUAL-TECH-ROADMAP.md](./VISUAL-TECH-ROADMAP.md)
- Main README: [README.md](../README.md)
