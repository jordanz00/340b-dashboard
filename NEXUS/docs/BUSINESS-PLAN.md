# NEXUS Engine Pro — Business plan (sales-oriented)

**Status:** Product is **not yet sales-ready** as a paid SKU; this document defines positioning, packaging, and the path to **first revenue**. Numbers below are **hypotheses** until you validate with customers—replace with your own research.

**Related:** [SALES-READINESS-CHECKLIST.md](./SALES-READINESS-CHECKLIST.md) (execution checklist).

---

## 1. Executive summary

**Product:** Browser-based live VJ / music visualizer—WebGL scenes, Aurora Field (Butterchurn / MilkDrop-class presets), hybrid stack, MIDI, recording, show tools. No install for the free experience; WebGL required.

**Opportunity:** DJs, streamers, small venues, and creators want **Resolume-grade atmosphere** without **Resolume-grade spend or setup**. A **freemium** wedge (full creative tool + visible watermark) converts to **paid** for clean output and commercial rights.

**Gap today:** No payment flow, no license enforcement beyond a client-side flag, pricing copy on the landing page **overstated** Pro-only features (most capabilities are already in Free in code). Legal/commercial terms are not packaged for B2C or B2B.

**Goal:** Ship a **minimum sellable product (MSP)**: honest tiers, checkout or invoice path, Terms of Sale + Privacy, support channel, and proof (demo reels + compatibility matrix).

---

## 2. Problem and solution

| Pain | NEXUS answer |
|------|----------------|
| VJ software is expensive and complex | Runs in browser; try free immediately |
| Streamers need clean visuals for OBS | Present mode + window capture + recording profiles |
| Bedroom / mobile DJs lack a VJ | Mic-driven reactivity, auto scenes, MIDI |
| Tool feels “toy” without polish | Pro positioning: watermark off + commercial license + support |

---

## 3. Ideal customer profiles (pick 1–2 to start)

1. **Twitch / YouTube streamers** — Want loopable, audio-reactive background; care about **clean plate** (no watermark) and stable FPS.
2. **Bedroom / club DJs (Chrome laptop)** — Care about **MIDI**, **present mode**, and **quick aesthetic**; price-sensitive; convert on “remove watermark for gigs/recordings.”
3. **Small venue / church / gym** (secondary) — May need **invoice**, **offline or kiosk** story; longer sales cycle.

**Recommendation:** Lead GTM with **streamers + laptop DJs** first—same browser stack, shortest path to testimonial and clip content.

---

## 4. Competitive landscape (positioning)

| Alternative | NEXUS angle |
|-------------|-------------|
| Resolume / VDMX | “Not a full clip compositor—**focus**: audio-reactive 3D + spectrum in the browser, lower friction” |
| Winamp / projectM nostalgia | “Modern stack, recording, MIDI, hybrid WebGL + spectrum library” |
| Generic WebGL demos | **Product**: presets, show mode, OBS workflow, docs |

Avoid overclaiming **“Resolume killer”** in serious B2B contexts; keep it as **marketing hook** only where audience expects hype.

---

## 5. Packaging and pricing (hypothesis)

Align **legal and marketing** with **what the code actually does**. Today, **Free vs Pro in code** is primarily **watermark on/off** (`js/watermark.js`) plus dev unlock codes—not feature gating for MIDI/recording.

**Honest baseline tiers (recommended):**

| Tier | Includes (honest) | Price hypothesis |
|------|-------------------|------------------|
| **Free** | Full app features; **corner watermark**; personal / evaluation use under your Terms | $0 |
| **Pro (subscription)** | **No watermark**; **commercial use** for individual creator; email support SLA you can keep; future: preset sync or bonus packs | $9–19/mo (test) |
| **Pro Lifetime / early supporter** | Same as Pro, perpetual for current major version; limited slots or time-boxed | $59–99 one-time (test) |
| **Business / venue** (later) | Invoice, optional offline build, indemnification conversation | Custom |

**Important:** If you later **gate** features (e.g. 4K recording, DMX) behind Pro, **implement in code first**, then update landing—never the reverse.

---

## 6. Revenue model

- **Primary:** B2C subscription (Stripe Checkout, Lemon Squeezy, Paddle, or Gumroad).
- **Secondary:** Lifetime / early-bird for cash flow and advocates.
- **Future:** B2B annual, white-label, or “offline bundle” only if you commit to support burden.

**License delivery (minimum):** After payment, customer receives a **license key** or **signed token** validated by your app (today’s `localStorage` key is **not** secure for real DRM—treat as demo only). Plan a **simple server** or **license service** before scaling paid users.

---

## 7. Go-to-market (GTM)

1. **Asset lane:** 3× 30–60s vertical clips (Free + Pro watermark comparison, one “mic + drop,” one OBS capture).
2. **Landing:** Single CTA—try free + waitlist or checkout; honest feature matrix ([landing.html](../landing.html) must match README and code).
3. **Channels:** Reddit (r/DJs, r/obs), Discord DJ communities, YouTube Shorts, one paid micro-test (optional).
4. **Proof:** Replace placeholder social proof with **real** quotes or “Used by X creators” only when true.

---

## 8. 12-month milestone sketch (illustrative)

| Quarter | Focus |
|---------|--------|
| Q1 | MSP: checkout, Terms/Privacy, honest pricing page, license v1, 10 design-partner users |
| Q2 | Testimonials, affiliate or creator code, optional feature gate only if justified |
| Q3 | Business tier pilot, roadmap transparency |
| Q4 | Evaluate native wrapper or offline only if demand pays for it |

---

## 9. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **MIT repo + static app** — keys in client are copiable | Sell **support + updates + commercial terms**, not unbreakable DRM; stronger enforcement = desktop wrapper or server session |
| **Safari / WebGPU gaps** | Publish [README](../README.md) matrix; don’t oversell universal WebGPU |
| **Butterchurn / preset licensing** | Keep credits; don’t resell preset packs as if you own upstream copyright |
| **Chargebacks / refunds** | Clear refund policy (e.g. 7–14 days) and delivery definition |

---

## 10. Financial snapshot (template only)

Fill with your assumptions:

- **CAC** (cost to acquire customer): ___  
- **Target conversion** free → paid: ___%  
- **Monthly churn:** ___%  
- **Fixed costs** (hosting, tools, legal): $___/mo  

Do not present invented metrics to investors or customers—use ranges once you have data.

---

## 11. Next document to use day-to-day

Open **[SALES-READINESS-CHECKLIST.md](./SALES-READINESS-CHECKLIST.md)** and work top-down until “first paid customer” is achievable.
