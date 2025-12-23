# Quick Start - Production Deployment

Your app is production-ready. Here's the quickest path to Vercel.

## In 3 Steps

### Step 1: Get Supabase Credentials (10 minutes)

1. Go to https://supabase.com → Sign up/Login
2. Create new project (name: `wot-kamikaze`)
3. Wait 2-3 minutes for initialization
4. Go to Settings → API → Copy:
   - `Project URL` → Save as `VITE_SUPABASE_URL`
   - `Anon Key` → Save as `VITE_SUPABASE_ANON_KEY`

5. Go to SQL Editor → Run this:
```sql
-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  readable_id TEXT UNIQUE NOT NULL,
  sme_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  price_total NUMERIC NOT NULL,
  status TEXT DEFAULT 'NEW',
  rider_id UUID,
  rider_phone TEXT,
  rider_token TEXT,
  rider_lat NUMERIC,
  rider_lng NUMERIC,
  csat_score INTEGER,
  csat_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = sme_id);

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = sme_id);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = sme_id);

CREATE POLICY "Users can delete their own orders"
  ON orders FOR DELETE
  USING (auth.uid() = sme_id);

CREATE INDEX idx_orders_sme_id ON orders(sme_id);
CREATE INDEX idx_orders_status ON orders(status);
```

6. Go to Authentication → URL Configuration → Add Redirect URLs:
   - `https://your-vercel-domain.vercel.app`
   - `https://your-vercel-domain.vercel.app/auth/callback`

### Step 2: Push to GitHub (2 minutes)

```bash
cd c:\Users\user\Documents\wot\wot-kamikaze
git add .
git commit -m "Production: Supabase and email verification ready for Vercel"
git push origin main
```

### Step 3: Deploy to Vercel (5 minutes)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select framework: `Other` (Vite will be detected)
4. Click "Import"
5. Go to Settings → Environment Variables
6. Add these variables:

```
VITE_SUPABASE_URL=<your supabase url>
VITE_SUPABASE_ANON_KEY=<your supabase anon key>
VITE_API_URL=https://<your-vercel-domain>.vercel.app
TWILIO_ACCOUNT_SID=<your twilio sid, if using WhatsApp>
TWILIO_AUTH_TOKEN=<your twilio token, if using WhatsApp>
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890 (if using WhatsApp)
FRONTEND_URL=https://<your-vercel-domain>.vercel.app
NODE_ENV=production
```

7. Click "Deploy"
8. Wait 2-3 minutes for build
9. Done! Your app is live

## Test It Works

1. Go to your Vercel URL
2. Sign up with test email
3. Check email for verification link
4. Click link
5. Should auto-login to dashboard

## What You Get

✓ Real-time order updates
✓ WhatsApp messaging
✓ Email verification
✓ Secure authentication
✓ Mobile responsive
✓ Professional UI
✓ 0 downtime
✓ Auto-scaling

## Troubleshooting

**"Missing environment variables"**
→ Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel settings

**"Email verification link not working"**
→ Ensure Redirect URLs in Supabase include your Vercel domain

**"Can't sign up"**
→ Check browser console for errors, review Supabase logs

**"Build failed"**
→ Check Vercel build logs, try `npm run build` locally first

## Need Help?

See detailed guides:
- `docs/PRODUCTION_DEPLOYMENT.md` - Complete Supabase setup
- `docs/VERCEL_DEPLOYMENT_CHECKLIST.md` - Full deployment checklist
- `README.md` - General documentation

## Key URLs

- Supabase: https://supabase.com
- Vercel: https://vercel.com
- Your App: https://your-domain.vercel.app
- Admin: https://your-domain.vercel.app/auth

## Important Notes

- Keep Supabase credentials secret
- Set environment variables in Vercel, not in code
- Verify email setup works before going public
- Monitor logs after deployment
- Test all features in production

---

That's it! Your production deployment is complete.

Questions? Check the documentation in the `docs/` folder.
