# Perfect SEO & Maximum Leads — pamedia.art

**Goal:** #1 visibility for high-intent Central PA event production searches → qualified bookings with deposits.

**North star metric:** `deposit_complete` GA4 events from organic + local discovery (not vanity traffic).

---

## Phase 0 — Done (technical foundation)

| Item | Status |
|------|--------|
| Per-page titles, descriptions, canonical, OG/Twitter | Live |
| JSON-LD: LocalBusiness, WebSite, FAQ, Service, Video, Breadcrumb | Live |
| 5 geo landing pages (wedding, corporate, DJ, event video, concert) | Live |
| `/about/` page + showcase | Live |
| `noindex` booking-confirmed + junk duplicate pages | Live |
| Sitemap hygiene (exclude book-*, work-*, privacy-policy-*) | Live |
| GA4 funnel events in JS | Code ready — **paste G- ID in wp-admin** |
| Footer + services internal links to geo pages | Live |

---

## Phase 1 — This week (you + 30 min setup)

### Google Search Console
1. Verify `pamedia.art` at [search.google.com/search-console](https://search.google.com/search-console)
2. Submit sitemap: `https://pamedia.art/wp-sitemap.xml`
3. Request indexing for: `/`, `/book/`, 5 geo landing URLs

### Google Analytics 4
1. Create web data stream for `pamedia.art`
2. **PA Booking → Settings → Analytics** → paste `G-XXXXXXXXXX`
3. Mark conversions: `booking_submit`, `deposit_complete`, `book_cta_click`

### Google Business Profile (highest ROI for local #1)
1. Primary category: **Video production service** or **Photographer** (pick best fit)
2. Secondary: DJ, Audio visual consultant, Event planner
3. NAP exactly: Pennsylvania Media Arts LLC · New Cumberland PA 17070 · pamedia.art
4. Add 20+ photos (wedding, concert, corporate, team, gear)
5. Weekly post → link to `/book/?utm_source=gbp`
6. Ask every happy client for a Google review (text them the GBP review link)

### Bing / Apple
- Claim Bing Places and Apple Business Connect (same NAP)

---

## Phase 2 — Weeks 2–4 (content + authority)

### Expand winning landings (when GSC shows impressions)
Add pages only for queries with impressions but position > 10:
- `wedding photographer harrisburg` (if wedding-video page ranks but photo doesn’t)
- `live sound company york pa`
- `nonprofit event video central pa`

Template: copy structure from `class-landing-pages.php` — unique H1, 2 body paragraphs, 2 FAQs, book CTA.

### Portfolio SEO
- YouTube: every video description → `https://pamedia.art/book/?utm_source=youtube&utm_medium=video`
- Work page: ensure gallery alts mention event type + city when known

### Citations (NAP consistency)
List on: Yelp, Thumbtack, The Knot, WeddingWire, Bark, Alignable, local Harrisburg/York chambers.
Same business name, address, phone, website everywhere.

### Backlinks (high trust)
- CPMA / Central PA Music Hall of Fame (nominee badge page)
- Venues you’ve worked with (ask for “preferred vendor” link)
- Nonprofit clients (annual report / sponsor thank-you page)

---

## Phase 3 — Weeks 5–12 (CRO + scale)

### Conversion rate optimization
| Test | Hypothesis |
|------|------------|
| Hero CTA “Check availability” vs “Start booking” | Lower friction wins |
| Deposit amount visibility on `/book/` | Transparency ↑ completions |
| Social proof above fold on `/book/` | Reviews ↑ trust |
| SMS follow-up within 1h of `booking_submit` | ↑ deposit conversion |

### Review velocity
- Target: 2 new Google reviews/month minimum
- Never incentivize reviews (policy) — ask after successful delivery

### Monthly SEO report (15 min)
From GSC + GA4 fill `docs/SEO-ROLLOUT.md` monthly table:
- Impressions, clicks, avg position (top 10 queries)
- `/book/` sessions, `booking_submit`, `deposit_complete`
- Top landing pages (geo vs home vs services)

### Prune
- Noindex or delete remaining junk WP pages in admin (book-2…book-21, work-2…)
- Our plugin noindexes them; deletion saves server clutter

---

## Keyword priority (attack order)

1. **Wedding photo/video Central PA** — highest $, geo page live
2. **Event videographer Harrisburg** — geo page live
3. **Wedding DJ Harrisburg / Central PA** — geo page live
4. **Corporate event photographer Harrisburg** — geo page live
5. **Concert videography Pennsylvania** — geo page live + CPMA credential
6. Long-tail: drone, photo+video bundle, nonprofit video

---

## What “#1” realistically means

You will not outrank national directories (The Knot, Yelp) for generic terms. You **can** own:

- “Pennsylvania Media Arts” (brand) — should be #1 now
- “[service] + Central PA / Harrisburg” long-tail — 3–6 months with GBP + reviews + landings
- Map pack (3-pack) for “event videographer near me” in your service radius — **GBP is the lever**

**Perfect SEO** = technical site (done) + local authority (GBP, reviews, citations) + content matching intent (geo pages) + measurable funnel (GA4).

---

## Checklist: maximum leads

- [ ] GA4 Measurement ID saved in wp-admin
- [ ] GSC sitemap submitted
- [ ] GBP complete + 10+ reviews
- [ ] Every YouTube video links to `/book/`
- [ ] 2 GBP posts/month with book link
- [ ] Review ask after every gig
- [ ] Monthly GSC query review → add 1 landing page per quarter if needed
- [ ] Respond to all GBP messages within 24h
