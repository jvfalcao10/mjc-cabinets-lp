// MJC Landing Page — runtime config
window.MJC_CONFIG = {
  // Supabase
  SUPABASE_URL: 'https://qvkfcvcqlfamyzgqgnrq.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2a2ZjdmNxbGZhbXl6Z3FnbnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzI1MzYsImV4cCI6MjA2MzYwODUzNn0.VDLMK6z9yynpHRp5o8uULdOlX6ZmRi95kZJdte1oaLM',
  LEADS_TABLE: 'mjc_leads',

  // Admin password (validated server-side via RPC mjc_verify_admin)
  ADMIN_PASSWORD: 'mjccab123',

  // Ad tracking (fill with your real IDs)
  META_PIXEL_ID: '',       // e.g. '123456789012345'
  GOOGLE_GTAG_ID: '',      // e.g. 'AW-123456789'
  GOOGLE_CONVERSION_LABEL: '', // e.g. 'AbC-D_efG123'

  // Routing
  THANK_YOU_URL: 'thankyou.html',
};
