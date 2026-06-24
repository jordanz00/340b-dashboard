# PA Media Booking — $0 calendar app

**No Amelia. No Calendly. No monthly booking fee.**

You host everything on your WordPress site. The only cost is Stripe’s normal card processing when a customer pays a deposit (~2.9% + 30¢) — same as any card reader.

---

## What you get

- Calendar on [pamedia.art](https://pamedia.art/) — customers see **open vs blocked** dates  
- **Deposit required** via Stripe Checkout before request counts  
- Email to **jordan@pamedia.art** when deposit is paid  
- **WP Admin → PA Booking** — approve/reject requests  
- **Block Dates** screen — mark vacations / booked weekends unavailable  

---

## Install (10 minutes)

### 1. Upload plugin

1. Zip the `pa-media-booking` folder (or use the pre-made zip if provided).
2. **WP Admin → Plugins → Add New → Upload Plugin**
3. Choose zip → **Install Now → Activate**

### 2. Stripe (free account — no monthly fee)

1. Sign up at [stripe.com](https://stripe.com)
2. **Developers → API keys**
3. Copy **Publishable** and **Secret** keys (use **Test** keys first)

### 3. Plugin settings

**WP Admin → PA Booking → Settings**

| Field | Value |
|-------|--------|
| Notification email | `jordan@pamedia.art` |
| Deposit | e.g. `150` or `250` |
| Stripe keys | paste test keys |
| Services | one per line (Photo, Video, etc.) |

**Save settings.**

### 4. Success page

1. **Pages → Add New** — title: `Booking Confirmed`
2. Content: shortcode only:

```
[pa_booking_success]
```

3. Publish
4. **PA Booking → Settings** → Success page → select **Booking Confirmed**

### 5. Homepage

**Pages → Home → Edit**

At the **top**, add a **Shortcode** block:

```
[pa_booking]
```

Update page.

### 6. Navigation (optional)

**Appearance → Editor → Navigation** → add **Book** → `https://pamedia.art/#pa-book`

### 7. Block your busy dates

**PA Booking → Block Dates** → pick date → **Block this date**

Approved bookings auto-block that date too.

---

## Daily workflow

1. Customer picks date → pays deposit on Stripe → lands on success page  
2. You get email: *New booking request (deposit paid)*  
3. **PA Booking** → **Approve** (date held) or **Reject** (customer emailed)  

---

## Go live

1. Stripe dashboard → turn off **Test mode**  
2. Paste **Live** API keys in plugin settings  
3. Run one real $1 test deposit, then refund in Stripe  

---

## Costs (honest)

| Item | Cost |
|------|------|
| This plugin | **$0** |
| WordPress hosting | You already pay GoDaddy |
| Stripe | **Per transaction only** — no subscription |
| Email | Uses WordPress `wp_mail` (GoDaddy) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “Booking is being set up” | Add Stripe keys in Settings |
| No admin email | Check spam; install **WP Mail SMTP** if GoDaddy blocks mail |
| Calendar empty / error | Permalinks → Save (flushes REST API) |
| Payment works, no approval email | Check **PA Booking** dashboard — booking may still be there |

---

## Uninstall

Deactivate plugin in **Plugins**. Booking data stays in WordPress until you delete posts manually.
