# MJC Cabinet Design Solutions — Landing Page

Premium conversion-focused landing page for MJC Cabinets (Orlando, FL) built for Meta Ads and Google Ads traffic.

## Stack
- Vanilla HTML + CSS + JS (zero build step, deploys anywhere)
- Supabase (Postgres) for lead storage + admin auth via RPC password
- Fonts: Playfair Display + DM Sans
- Schema.org LocalBusiness markup
- Meta Pixel + Google Tag ready (just paste IDs)

## Files
| File | Purpose |
|---|---|
| `index.html` | Public landing page with form |
| `admin.html` | Password-protected leads dashboard |
| `thankyou.html` | Post-submit page (fires conversion events) |
| `privacy.html` | Privacy Policy (required for Meta Ads) |
| `terms.html` | Terms of Use |
| `robots.txt` | Crawler directives |
| `sitemap.xml` | Sitemap for Google indexing |
| `config.js` | Runtime config (Supabase URL/key, Pixel IDs, admin password) |
| `vercel.json` | Vercel deployment config (cache headers, redirects, noindex admin) |
| `images/` | Project photos, logo variants |

## SEO (JSON-LD schemas embedded in index.html)
- **HomeAndConstructionBusiness** — business info, hours, geo, aggregate rating
- **Service** (x4) — Kitchen cabinets, Remodel, Bathroom, Closet with price range
- **FAQPage** — 8 Q&As that surface as rich snippets
- **Review** (x4) — individual testimonials with star ratings

Plus: canonical URL, OG image (1200x630 declared), preload hero/logo for LCP, robots.txt, sitemap.xml, geo tags.

## URLs (after deploy)
| Path | Purpose |
|---|---|
| `/` | Landing page |
| `/thankyou` | Post-submit thank-you |
| `/admin` | Leads dashboard (password: `mjccab123`) |

---

## 🚀 Deploy to Vercel

```bash
cd /Users/joao/Documents/CLAUDE\ CODE\ N8N/MJC-CABINETS-LP

# If you don't have Vercel CLI:
npm i -g vercel

# First deploy (interactive)
vercel

# Production deploy
vercel --prod
```

Or via UI:
1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import repo
3. No build command, no output dir — just deploy
4. After deploy, Vercel gives you a `.vercel.app` URL

**Custom domain (later):** Add `lp.mjckitchen.com` in Vercel Project → Settings → Domains. Point a CNAME from your DNS to `cname.vercel-dns.com`.

---

## 🗄️ Supabase (already configured)

- Project: `qvkfcvcqlfamyzgqgnrq.supabase.co`
- Table: `public.mjc_leads`
- Admin access via RPC `mjc_admin_get_leads(admin_secret)` — password `mjccab123` validated server-side

### Change admin password

Password is hardcoded in `public.mjc_verify_admin()`. To rotate:

```sql
CREATE OR REPLACE FUNCTION public.mjc_verify_admin(admin_secret text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN RETURN admin_secret = 'NEW_PASSWORD_HERE'; END;
$$;
```

Then update `ADMIN_PASSWORD` in `config.js` to match.

### Schema

```
mjc_leads
├── id (uuid, pk)
├── created_at, updated_at (timestamptz)
├── first_name, last_name, phone, email (text)
├── project, budget, timeline, notes (text)
├── utm_source, utm_medium, utm_campaign, utm_content, utm_term
├── referrer, landing_page, user_agent
└── status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost'
```

RLS:
- `anon` role can INSERT (form submissions) but NOT select/update/delete
- Admin reads go through `mjc_admin_*` RPCs with password check

---

## 📊 Ad tracking setup

Edit `config.js`:

```js
META_PIXEL_ID: '123456789012345',    // from Meta Events Manager
GOOGLE_GTAG_ID: 'AW-1234567890',      // from Google Ads
GOOGLE_CONVERSION_LABEL: 'AbC-D_efG', // from conversion action setup
```

**Events fired (tracking.js centraliza tudo):**

| Event | Where | GTM dataLayer | Meta Pixel |
|---|---|---|---|
| `PageView` | every page | ✅ | `PageView` |
| `session_context` | on load | ✅ (utm/device/referrer) | - |
| `scroll_depth` | 25/50/75/90% | ✅ `{depth}` | `ViewContent` @50%, `ScrollDeep90` @90% |
| `time_on_page` | 15/30/60/120/300s | ✅ | - |
| `engaged_user` | >30s OR >50% scroll | ✅ | `EngagedUser` |
| `section_view` | hero, portfolio, faq, etc. | ✅ `{section}` | - |
| `cta_click` | any primary CTA | ✅ `{cta_text, cta_location}` | - |
| `phone_click` | tel: links | ✅ | `Contact {method:phone}` |
| `whatsapp_click` | wa.me links | ✅ | `Contact {method:whatsapp}` |
| `sms_click`, `email_click` | sms:/mailto: | ✅ | `Contact` |
| `form_start` | first focus | ✅ | `InitiateCheckout` |
| `form_field_focus` | each field | ✅ `{field}` | - |
| `form_field_complete` | each field | ✅ `{field}` | - |
| `form_submit_attempt` | on submit | ✅ | - |
| `form_abandon` | started, didn't submit | ✅ `{fields_completed}` | `FormAbandon` |
| `generate_lead` | form success | ✅ | `Lead` + **Advanced Matching (SHA-256)** |
| `conversion` | thank-you page | ✅ | `Lead` |
| `faq_expand` | each FAQ open | ✅ `{question}` | - |
| `portfolio_filter` | category tab click | ✅ `{filter}` | - |
| `video_play/pause/ended` | any `<video>` | ✅ | - |
| `testimonial_nav` | carousel prev/next | ✅ `{dir}` | - |
| `web_vitals` | on pagehide | ✅ `{lcp_ms, cls}` | - |
| `outbound_click` | external links | ✅ `{url}` | - |
| `js_error` | runtime errors | ✅ `{message, source}` | - |

**Advanced Matching:** email, phone, first/last name, city, state, country are SHA-256 hashed client-side before `fbq('init')` fires. This improves match rate in Meta Ads Manager without leaking PII.

**UTM capture:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid` are persisted to `localStorage` on landing and sent with every event via `session_context`.

**UTM capture:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` are persisted to `localStorage` on landing and sent with the lead. Admin sees them in the Source column.

---

## 🧪 Local testing

Open `index.html` directly in browser works for most things. For Supabase submissions to work locally, serve via any static server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000/` and `http://localhost:8000/admin.html`.

---

## ✅ Before launch checklist

- [ ] Fill `META_PIXEL_ID` in `config.js`
- [ ] Fill `GOOGLE_GTAG_ID` + `GOOGLE_CONVERSION_LABEL` in `config.js`
- [ ] Replace fake testimonials in `index.html` with real Google Reviews
- [ ] Verify address, phone, email in footer + schema
- [ ] Submit a test lead, check it appears in `/admin`
- [ ] Test form on mobile (phone mask, sticky CTA)
- [ ] Run PageSpeed Insights — target 90+ on mobile
- [ ] Verify Meta Pixel fires via Meta Events Manager test browser
- [ ] Verify Google Ads conversion fires via Tag Assistant
- [ ] Set up Vercel custom domain (`lp.mjckitchen.com`)
- [ ] Update Schema.org `url` to production domain

---

## 🎨 Brand

| | Hex |
|---|---|
| Gold (primary) | `#c9a14b` |
| Gold (bright) | `#e6af5d` |
| Navy (primary) | `#0c2a54` |
| Navy (deep) | `#081f40` |
| Cream | `#faf8f3` |

Logos:
- `logo-mjc.png` — gold + navy (for light bgs: nav)
- `logo-mjc-gold.png` — all-gold (for dark bgs: footer, thank-you)

## 📞 Contact

- MJC Cabinet Design Solutions
- 5014 Forsyth Commerce Rd, Orlando, FL 32807
- Phone: (239) 296-0689
- Email: mjckitchencabinet@gmail.com
- Instagram: @mjccabinets.orlando
