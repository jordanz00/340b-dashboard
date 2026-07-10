# SEO & Lead Generation Rollout — pamedia.art

**Geo focus:** Central PA — Harrisburg, York, Lancaster, Carlisle, Hershey, New Cumberland.

**Positioning:** One Central PA team for event photography, video, live audio, and DJ — book online with a secure deposit.

---

## Live audit checklist (Week 1)

Complete in wp-admin / Google tools before judging rankings:

| Task | Where | Status |
|------|-------|--------|
| SEO plugin audit | wp-admin → Plugins | ☐ Yoast / Rank Math / AIOSEO / TSF? If yes, configure there; native `PA_Booking_SEO` defers meta tags |
| Google Search Console | [search.google.com/search-console](https://search.google.com/search-console) | ☐ Verify `pamedia.art`, submit `https://pamedia.art/wp-sitemap.xml` |
| GA4 property | [analytics.google.com](https://analytics.google.com) | ☐ Create web stream; paste Measurement ID in **PA Booking → Settings → Analytics** |
| Google Business Profile | Google Business | ☐ NAP: Pennsylvania Media Arts LLC, New Cumberland PA 17070, pamedia.art |
| Baseline KPIs | GA4 / manual | ☐ Organic sessions, `/book/` views, deposit completions |

---

## Keyword map (Central PA)

### Tier 1 — high intent

- wedding photographer central pa / harrisburg wedding photographer
- wedding videographer central pennsylvania
- event videographer harrisburg
- dj services central pa / wedding dj harrisburg
- live sound company central pa

### Tier 2 — commercial

- corporate event photographer harrisburg
- concert videography pennsylvania
- nonprofit event video central pa

### Tier 3 — long-tail

- photo and video package wedding pa
- drone photography central pennsylvania
- music awards videographer pa (CPMA credential)

---

## Technical SEO (plugin)

| Feature | File |
|---------|------|
| Per-page titles & descriptions | `includes/class-seo.php` |
| Open Graph / Twitter | `includes/class-seo.php` |
| JSON-LD (LocalBusiness, FAQ, Service, Video) | `includes/class-seo.php` |
| `noindex` on booking confirmation | `includes/class-seo.php` |
| GA4 + funnel events | Settings + `assets/site.js`, `assets/booking.js` |
| Geo landing pages | `includes/class-landing-pages.php` |

### Indexable URLs

- `/`, `/services/`, `/work/`, `/about/`, `/book/`
- Geo landings: `/services/wedding-photo-video-central-pa/`, `/services/corporate-event-production-harrisburg/`, `/services/dj-live-audio-central-pa/`, `/services/event-videographer-harrisburg/`, `/services/concert-videography-pennsylvania/`

### Noindex

- `/booking-confirmed/` and success pages with `?pa_requested=`, `?deposit=`, UTM params (canonical strips tracking)

---

## Internal linking rules

1. **Services cards** → `/book/?start=1&service=<slug>` (service name in query when applicable)
2. **Work gallery / CTA** → `/book/?start=1`
3. **Footer service chips** → `/services/` or anchor on services page
4. **Geo landing pages** → single primary CTA to `/book/?start=1&service=...`
5. **YouTube descriptions** → `https://pamedia.art/book/?utm_source=youtube`

---

## GA4 funnel events

| Event | Trigger |
|-------|---------|
| `book_cta_click` | `.pa-nav-book`, hero Book, service card book links |
| `booking_start` | Welcome → Start or `?start=1` landing |
| `booking_step` | Wizard steps 0–2 |
| `booking_submit` | Reserve My Date success |
| `deposit_complete` | Success page / `deposit=done` |

---

## Off-site (human-owned)

| Action | Owner |
|--------|-------|
| GBP categories, photos, weekly posts | You |
| Review asks (link to Google profile) | You |
| Citations: Bing, Apple Maps, industry directories | You |
| CPMA / venue / nonprofit backlinks | You |

---

## Monthly report template

| Metric | This month | Prior month |
|--------|------------|-------------|
| GSC impressions | | |
| GSC clicks | | |
| Avg position (top 20 queries) | | |
| `/book/` sessions (GA4) | | |
| `booking_submit` events | | |
| `deposit_complete` events | | |
| Top landing pages | | |

## Deploy verification

After code deploy (`bash deploy-sftp.sh` from `~/Desktop/Cursor Projects/`):

1. **Flush cache** in wp-admin (GoDaddy Quick Links) if CSS/JS changed
2. Submit sitemap in GSC: `https://pamedia.art/wp-sitemap.xml`
3. Paste GA4 Measurement ID in **PA Booking → Settings → Analytics**
4. Run Lighthouse A11y on `/`, `/services/`, `/work/`, `/book/` — record in `docs/ACCESSIBILITY.md`
5. Verify geo pages: `/services/wedding-photo-video-central-pa/`, etc.

### 30-day KPI baseline (record after GA4 live)

| Metric | Day 1 value | Notes |
|--------|-------------|-------|
| GSC impressions (28d) | | |
| Organic sessions | | |
| `/book/` sessions | | |
| `booking_submit` events | | |
| `deposit_complete` events | | |


| Week | Activity |
|------|----------|
| 1 | Baseline audit, deploy technical SEO + a11y, GSC sitemap |
| 2–3 | Monitor GSC; GBP posts; review GA4 funnel |
| 4–6 | Geo landing performance; first query report |
| 7–9 | Citations; review generation; CRO from GA4 |
| 10–12 | Expand winning content; prune underperformers |

---

## Honest expectations

- Rankings for competitive local keywords often take **3–6+ months**
- Goal: **qualified Central PA leads** into the booking funnel, not vanity traffic
- Star rich results require policy-compliant review markup (mirrors on-page Google reviews carousel)
