Finalize Watermarked Delivery + Monitoring

Migrations
- If supabase/migrations is read-only in this environment, run the SQL in supabase/sql/20250809_image_page_access.sql via Supabase SQL editor.

Edge Functions
- get-chapter-page already inserts non-blocking rows into public.image_page_access using SUPABASE_SERVICE_ROLE_KEY.

Admin UI
- /admin/security/watermark-settings shows last 200 logs (20/page) and includes test URL + leak checker tools.

Sign Up Flow
- Navbar Sign Up opens the auth modal on the Sign Up tab. Validation: email, password, confirm; uses Supabase signUp; toasts on success/error.

Env (Edge Functions)
- ALLOWED_ORIGIN, IMAGE_SIGNING_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SITE_NAME

Env (Client)
- VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

QA
- Open a chapter image: signed GET returns WebP/JPEG with watermark; expired links 403 then refresh/regenerate works; logs appear; Sign Up works end-to-end.