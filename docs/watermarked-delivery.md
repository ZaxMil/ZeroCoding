Watermarked Delivery + Monitoring

Env variables (Edge Functions)
- ALLOWED_ORIGIN=https://your-domain.com
- IMAGE_SIGNING_SECRET=32+ char random secret
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (logging inserts)
- SITE_NAME=YourBrand

Env variables (Client)
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Test steps
1) Generate a signed URL (Admin > Security & Monitoring > Watermark Settings) and open it; image returns WebP (or JPEG if negotiated) with faint diagonal watermark; ETag and Cache-Control present.
2) Expire link and retry: first 403, refresh/sign again loads.
3) Access logs appear in the table (admin only), paginated up to last 200.
4) Sign Up from navbar opens modal on Sign Up tab; submit valid email/password -> shows "Check your email"; errors are surfaced.