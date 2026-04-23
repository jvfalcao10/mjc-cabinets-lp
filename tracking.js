/* MJC Tracking Layer
 * Unified tracking for GTM dataLayer + Meta Pixel + Google gtag
 * Fires: scroll depth, time on page, section views, CTA clicks,
 * form start/progress/abandon, FAQ expand, portfolio filter, Web Vitals
 */
(function () {
  'use strict';

  // ===== Core helpers =====
  window.dataLayer = window.dataLayer || [];
  var CFG = window.MJC_CONFIG || {};

  function track(event, params) {
    params = params || {};
    try { window.dataLayer.push(Object.assign({ event: event }, params)); } catch (e) {}
    // Also forward generic events to Meta custom if desired
    if (window.fbq && params._fb) {
      try { fbq('trackCustom', event, params); } catch (e) {}
    }
    if (window.gtag && params._gt) {
      try { gtag('event', event, params); } catch (e) {}
    }
  }
  function fbPixel(evt, params) { if (window.fbq) try { fbq('track', evt, params || {}); } catch (e) {} }
  function fbCustom(evt, params) { if (window.fbq) try { fbq('trackCustom', evt, params || {}); } catch (e) {} }

  // ===== Device + viewport + UTM snapshot =====
  function getUTM(k) {
    try {
      var q = new URLSearchParams(location.search).get(k);
      if (q) { localStorage.setItem('mjc_' + k, q); return q; }
      return localStorage.getItem('mjc_' + k) || '';
    } catch (e) { return ''; }
  }
  var device = {
    device_type: /Mobi|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
    screen_w: screen.width,
    screen_h: screen.height,
    lang: navigator.language,
    referrer: document.referrer || '(direct)',
  };
  // Seed dataLayer with session context so every event carries it
  window.dataLayer.push({
    event: 'session_context',
    utm_source: getUTM('utm_source'),
    utm_medium: getUTM('utm_medium'),
    utm_campaign: getUTM('utm_campaign'),
    utm_content: getUTM('utm_content'),
    utm_term: getUTM('utm_term'),
    fbclid: getUTM('fbclid'),
    gclid: getUTM('gclid'),
    device_type: device.device_type,
    viewport_w: device.viewport_w,
    lang: device.lang,
    referrer: device.referrer,
    landing_page: location.pathname,
  });

  // ===== Scroll depth (25/50/75/90) =====
  var scrollMarks = [25, 50, 75, 90];
  var firedScroll = {};
  function onScroll() {
    var h = document.documentElement;
    var pct = Math.round(((h.scrollTop + window.innerHeight) / h.scrollHeight) * 100);
    scrollMarks.forEach(function (m) {
      if (pct >= m && !firedScroll[m]) {
        firedScroll[m] = true;
        track('scroll_depth', { depth: m, depth_pct: pct });
        if (m === 50) fbPixel('ViewContent', { content_name: 'scroll_50' });
        if (m === 90) fbCustom('ScrollDeep90');
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ===== Time on page (15s, 30s, 60s, 120s, 300s) =====
  [15, 30, 60, 120, 300].forEach(function (sec) {
    setTimeout(function () { track('time_on_page', { seconds: sec }); }, sec * 1000);
  });

  // ===== Engagement score (composite) =====
  var engaged = false;
  function markEngaged() {
    if (engaged) return;
    engaged = true;
    track('engaged_user');
    fbCustom('EngagedUser');
  }
  setTimeout(markEngaged, 30000); // 30s on page = engaged
  window.addEventListener('scroll', function () {
    var h = document.documentElement;
    if (((h.scrollTop + window.innerHeight) / h.scrollHeight) > 0.5) markEngaged();
  }, { passive: true, once: false });

  // ===== Section views (IntersectionObserver) =====
  document.addEventListener('DOMContentLoaded', function () {
    var sections = document.querySelectorAll('section[id], section[class*="hero"], section[class*="port"], section[class*="faq"], section[class*="testi"], section[class*="proc"], section[class*="why"], section[class*="heritage"], section[class*="contact"]');
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id || e.target.className.split(' ')[0] || 'unknown';
        if (seen[id]) return;
        seen[id] = true;
        track('section_view', { section: id });
      });
    }, { threshold: 0.4 });
    sections.forEach(function (s) { io.observe(s); });
  });

  // ===== CTA clicks (delegated) =====
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a, button');
    if (!a) return;

    // Phone
    if (a.matches('a[href^="tel:"]')) {
      track('phone_click', { phone: a.getAttribute('href').replace('tel:', '') });
      fbPixel('Contact', { method: 'phone' });
      return;
    }
    // WhatsApp
    if (a.matches('a[href*="wa.me"], a[href*="whatsapp"]')) {
      track('whatsapp_click');
      fbPixel('Contact', { method: 'whatsapp' });
      return;
    }
    // SMS
    if (a.matches('a[href^="sms:"]')) {
      track('sms_click');
      fbPixel('Contact', { method: 'sms' });
      return;
    }
    // Email
    if (a.matches('a[href^="mailto:"]')) {
      track('email_click');
      fbPixel('Contact', { method: 'email' });
      return;
    }
    // Primary CTAs (anything that leads to #quote or submit)
    var ctaClasses = ['cta-btn', 'hcta', 'cta-dark', 'btn-primary', 'm-call', 'm-wa', 'wa-fab', 'submit-btn'];
    var cls = (a.className || '').toString();
    var isCta = ctaClasses.some(function (c) { return cls.indexOf(c) !== -1; });
    if (isCta || (a.getAttribute('href') || '').indexOf('#quote') === 0) {
      track('cta_click', {
        cta_text: (a.innerText || a.textContent || '').trim().slice(0, 60),
        cta_location: a.closest('section')?.id || a.closest('header,footer,nav')?.tagName || 'unknown',
        cta_href: a.getAttribute('href') || '',
      });
    }
    // Outbound links (social)
    if (a.matches('a[target="_blank"]') && !a.matches('a[href*="wa.me"]')) {
      track('outbound_click', { url: a.href });
    }
  }, { capture: true });

  // ===== Form: start / progress / abandon / submit tracking =====
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('quoteForm') || document.getElementById('lead-form');
    if (!form) return;

    var started = false, submitted = false;
    var completedFields = {};

    function markStarted() {
      if (started) return;
      started = true;
      track('form_start', { form_id: form.id });
      fbPixel('InitiateCheckout', { content_category: 'lead_form' });
    }

    form.addEventListener('focusin', function (e) {
      if (!e.target.matches('input,select,textarea')) return;
      markStarted();
      if (!completedFields[e.target.name || e.target.id]) {
        track('form_field_focus', { field: e.target.name || e.target.id });
      }
    });
    form.addEventListener('change', function (e) {
      if (!e.target.matches('input,select,textarea') || !e.target.value) return;
      var key = e.target.name || e.target.id;
      if (completedFields[key]) return;
      completedFields[key] = true;
      track('form_field_complete', { field: key });
    });

    form.addEventListener('submit', function () {
      submitted = true;
      track('form_submit_attempt', { form_id: form.id });
    });

    // Abandonment — started but did not submit
    window.addEventListener('pagehide', function () {
      if (started && !submitted) {
        var completed = Object.keys(completedFields).length;
        track('form_abandon', { fields_completed: completed, form_id: form.id });
        fbCustom('FormAbandon', { fields_completed: completed });
      }
    });
  });

  // ===== FAQ expand tracking =====
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('details.faq-item, .faq-item').forEach(function (el) {
      if (el.tagName === 'DETAILS') {
        el.addEventListener('toggle', function () {
          if (el.open) {
            var q = (el.querySelector('summary, .faq-q') || {}).innerText || '';
            track('faq_expand', { question: q.trim().slice(0, 120) });
          }
        });
      } else {
        el.addEventListener('click', function () {
          if (el.classList.contains('open')) {
            var q = (el.querySelector('.faq-q, summary') || {}).innerText || '';
            track('faq_expand', { question: q.trim().slice(0, 120) });
          }
        });
      }
    });
  });

  // ===== Portfolio filter / tab tracking =====
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tab, .f-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var label = btn.dataset.filter || btn.innerText || '';
        track('portfolio_filter', { filter: label.trim().slice(0, 40) });
      });
    });
  });

  // ===== Video / carousel interaction (if present) =====
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('video').forEach(function (v, i) {
      ['play', 'pause', 'ended'].forEach(function (ev) {
        v.addEventListener(ev, function () { track('video_' + ev, { index: i, src: v.currentSrc }); });
      });
    });
    var prev = document.getElementById('tprev'), next = document.getElementById('tnext');
    if (prev) prev.addEventListener('click', function () { track('testimonial_nav', { dir: 'prev' }); });
    if (next) next.addEventListener('click', function () { track('testimonial_nav', { dir: 'next' }); });
  });

  // ===== Web Vitals (LCP + CLS + INP lite) =====
  try {
    if ('PerformanceObserver' in window) {
      var lcp = 0;
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (e) { lcp = e.startTime; });
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      var cls = 0;
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (e) { if (!e.hadRecentInput) cls += e.value; });
      }).observe({ type: 'layout-shift', buffered: true });

      addEventListener('pagehide', function () {
        track('web_vitals', {
          lcp_ms: Math.round(lcp),
          cls: Math.round(cls * 1000) / 1000,
        });
      }, { once: true });
    }
  } catch (e) {}

  // ===== Advanced Matching helper — SHA-256 hash for PII =====
  async function sha256(str) {
    if (!str) return '';
    try {
      var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(str).toLowerCase().trim()));
      return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    } catch (e) { return ''; }
  }

  // Expose globals for page scripts
  window.MJC_TRACK = {
    track: track,
    fbPixel: fbPixel,
    fbCustom: fbCustom,
    sha256: sha256,
    // Helper used on form submit to fire Lead with Advanced Matching
    fireLead: async function (data) {
      data = data || {};
      try {
        if (window.fbq && CFG.META_PIXEL_ID) {
          fbq('init', CFG.META_PIXEL_ID, {
            em: await sha256(data.email || ''),
            ph: await sha256((data.phone || '').replace(/\D/g, '')),
            fn: await sha256(data.first_name || ''),
            ln: await sha256(data.last_name || ''),
            ct: await sha256(data.city || 'orlando'),
            st: await sha256('fl'),
            country: await sha256('us'),
          });
          fbq('track', 'Lead', {
            content_category: data.project || '',
            content_name: data.budget || '',
            value: 1,
            currency: 'USD',
          });
        }
        track('generate_lead', {
          project: data.project,
          budget: data.budget,
          timeline: data.timeline,
          value: 1,
          currency: 'USD',
        });
      } catch (e) { console.warn('fireLead failed', e); }
    },
  };

  // ===== Print errors to dataLayer =====
  window.addEventListener('error', function (e) {
    track('js_error', { message: (e.message || '').slice(0, 200), source: (e.filename || '').slice(0, 120), line: e.lineno });
  });
})();
