# Fort Knox Exchange - Deployment Checklist

## 1. Environment Variables
Ensure all required environment variables are set in your production environment (e.g., Vercel, AWS, Docker).

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# Authentication (NextAuth / Custom)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secret-key"

# External APIs
MEXC_API_KEY="optional-if-using-private-endpoints"
MEXC_SECRET_KEY="optional-if-using-private-endpoints"
```

## 2. Database Migration
Run Prisma migrations to ensure the production database schema is up to date.

```bash
npx prisma migrate deploy
```

## 3. Build & Optimization
Verify that the build process completes without errors.

```bash
npm run build
```

- Check for any linting errors (`npm run lint`).
- Verify that image optimization is working (using `next/image`).
- Ensure all unused code/imports are removed.

## 4. Security Checks
- [ ] **SSL/TLS**: Ensure HTTPS is enforced.
- [ ] **Headers**: Verify security headers (HSTS, X-Frame-Options, etc.) are set (Next.js handles most defaults).
- [ ] **API Routes**: Ensure all protected API routes check for authentication.
- [ ] **CORS**: Verify CORS settings if API is accessed from other domains.

## 5. SEO & Analytics
- [ ] **Sitemap**: Verify `sitemap.xml` is generated correctly.
- [ ] **Robots.txt**: Verify `robots.txt` blocks sensitive paths (`/admin`, `/api`).
- [ ] **Metadata**: Check Open Graph and Twitter card previews.

## 6. Monitoring & Logging
- [ ] **Error Tracking**: Set up Sentry or similar for frontend/backend error tracking.
- [ ] **Performance**: Monitor Core Web Vitals (Vercel Analytics or Google Analytics).
- [ ] **Logs**: Ensure server-side logs are accessible.

## 7. Final Sanity Check
- [ ] Test Sign Up / Login flow.
- [ ] Test Trading flow (Place Order -> Update Balance).
- [ ] Test WebSocket connection (Live Ticker updates).
- [ ] Test Responsive Design on Mobile.
