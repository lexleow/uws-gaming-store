# UWS GAMING GAME STORE — Phase 1

**Next.js 15 + Supabase + Vercel**. Chinese storefront, games & software only, gold/dark design, guest checkout (no mandatory customer account), and authenticated admin orders dashboard.

## Status / Important constraints

- Storefront works in demo mode without any cloud services. Demo products are **not** real merchandise.
- **No real payment processing yet**: creating an order leaves it `unpaid`. Staff must verify receipt of payment externally before marking it paid. No card details are collected.
- **No automated digital credential delivery** yet. The schema records `delivery_mode`, but fulfillment only changes status after an admin confirms manual delivery. For automatic delivery implement inventory and encrypted credential delivery *only after a verified payment webhook*. Never expose account passwords or service-role credentials.
- Example products in SQL are intentionally **inactive** until actual licensed goods have been verified, configured, and published.
- There is no customer membership requirement. Admin authentication is mandatory.
- Do not sell accounts/software unless you are authorized to transfer or resell them under the provider's terms.

## Local run

1. `npm install`
2. `cp .env.example .env.local` (Windows PowerShell: `Copy-Item .env.example .env.local`)
3. `npm run dev` -> visit `http://localhost:3000`.

Without `.env.local` it runs a catalog-only demo. Orders disabled until Supabase is configured.

## Free cloud setup (requires owner's authorization and login)

1. Create a **Supabase** project at https://supabase.com/dashboard; in SQL editor execute `supabase/schema.sql`.
2. In Supabase Settings > API, copy **Project URL** and **anon/public key**. Copy the **service_role key** **only** into local `.env.local` and Vercel Server Environment Variables; never place it in NEXT_PUBLIC variables, chat, screenshots or git.
3. Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
4. Supabase Authentication > Users: create or invite a privileged admin using your own secure email and password, preferably MFA. Find the admin user's UUID and execute `insert into public.admin_users(user_id) values ('YOUR-REAL-UUID');` in SQL editor.
5. Add **real, owned or resale-authorized** products to `products` and set `active=true` after verifying descriptions, entitlements, prices, availability, support/returns terms. Example rows are inactive and should be deleted/replaced.
6. Put this folder in a new **private GitHub** repository (never include `.env.local`).
7. Import GitHub repository at https://vercel.com/new, select Next.js, set the same three Environment Variables, deploy.
8. Visit `/admin` to authenticate and review customer orders.
9. Connect a custom domain in Vercel (optional, domains usually cost money); verify DNS/HTTPS; submit `sitemap.xml` to Google Search Console after content/policies are published.

## Guest checkout behavior

- Customer provides name/email, not password, and order is saved server-side.
- Server independently loads product pricing and checks active status and stock.
- Order is marked `unpaid`, fulfillment `pending`.
- The admin can mark payment `paid` **only after independently confirming an actual payment**, then mark fulfilled. No payment is charged by this app.

## Before opening sales

Add: payment provider approval and signed webhook verification, transactional email, rate limiting (edge/WAF plus server), CAPTCHA/bot defense, email verification/confirmation of guest orders, privacy policy/PDPA compliance, refund/terms pages, product metadata (region, license scope, term, allowed resale), atomic inventory reservation and payment idempotency, logging/monitoring, backup and recovery, admin MFA. Review Supabase/hosting plan limits for production.

## Files

- `app/page.tsx` homepage / catalog backed by Supabase products
- `components/Store.tsx` storefront, cart, product details, guest checkout
- `app/api/orders/route.ts` create pending guest orders
- `app/admin/page.tsx` admin sign-in and order dashboard
- `app/api/admin/orders/route.ts` admin-only order API
- `supabase/schema.sql` PostgreSQL schema + RLS

**This is a deployable Phase 1 foundation, not a complete production-ready paid storefront.**
