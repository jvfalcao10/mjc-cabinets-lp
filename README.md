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
| `config.js` | Runtime config (Supabase URL/key, Pixel IDs, admin password) |
| `vercel.json` | Vercel deployment config (cache headers, redirects, noindex admin) |
| `images/` | Project photos, logo variants |

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

**Events fired:**
| Event | Where | Platform |
|---|---|---|
| `PageView` | every page | Meta + Google |
| `Lead` | form submit success | Meta |
| `Lead` + `PageView` | thank-you page | Meta |
| `conversion` | thank-you page | Google Ads |
| `Contact` | phone/WhatsApp click | Meta |
| `phone_click`, `whatsapp_click` | phone/WhatsApp click | Google |

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
