# VOLTA: Vercel -> Cloudflare Workers migration (prepared, not deployed)

## Destination and preserved assets

- Source of truth: `dahsamtransport-source/volta`, `main` only after branch CI.
- Hosting target: Cloudflare Workers, new staging Worker **`volta-lahj-staging`**, followed by reviewed production Worker and domain cutover.
- Same public domain after successful cutover: `https://volta.muslly.com`. Android WebView pins this host.
- **DO NOT** touch `muslly.com` storefront, YmPharma, ISS Modern, Oracle, or existing Supabase `dymxnmpaaobxoaowksoc/field_sales`.
- The original Vercel project has an outstanding-balance hold; migration does **not** cancel or settle that obligation.

## Verified platform state 2026-11-23

The current Vite/Nitro pipeline outputs `.output/server/wrangler.json` with module worker `index.mjs`, Node.js compatibility flag and static assets. These are generated during `bun run build`. The build target is `cloudflare-module`.
Current Ahmed PC lacks authenticated Wrangler session and `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` environment settings. **Do not claim that a Worker is deployed without a Cloudflare-issued URL and 2xx smoke test.**

## Safely reproducible commands — development branch

```powershell
cd D:\VOLTA-DEV\volta
bun install --frozen-lockfile
bun run test
bun x tsc --noEmit
bun run build
bun run cf:dry-run
```

No Cloudflare authorization is needed for a local dry run. It only packages/validates Worker output.

## Owner-managed staging deployment

1. Sign into the correct Cloudflare account, ensure the desired zone/Workers account exists, and authorize Wrangler via `bun x wrangler login` **on your own desktop** or provide a scoped token through secure environment variables (never chat/Git).
2. Provide build-time `VITE_FIELD_SALES_PUBLISHABLE_KEY` for the **same** Supabase project. This must be an active publishable/anon key, **not** a service-role or secret key. It is consumed during Vite build, not copied from Vercel private secrets.
3. Rebuild and deploy an isolated staging Worker **only after authorization**, e.g.:

```powershell
bun run build
bun x wrangler deploy --config .output/server/wrangler.json --name volta-lahj-staging
```

4. Capture the actual `*.workers.dev` URL and test root/auth, mobile RTL, assets, cache, GPS permission and offline behavior against an isolated test account. Public preview may require Supabase Auth redirect allowlisting and must never be tested with real production sales.
5. Review access policies, log retention, security headers, worker invocation costs and account ownership. Set correct production Worker name only after owner approval and a tested rollback plan.

## Domain cutover — explicit final gate, NOT automatic

- Verify authoritative control of `muslly.com` DNS and Cloudflare custom-domain eligibility. Preserve unrelated DNS records.
- Confirm Workers production endpoint is healthy and has the right Supabase publishable key and allowed auth redirect.
- Review DNS TTL/certificate issuance; change only `volta.muslly.com` routing, not the apex `muslly.com`.
- Recheck Android signed APK under the **same** official domain, with actual Play Protect/GPS/offline tests.
- If endpoint fails, restore the previously verified destination; currently Vercel responds HTTP 402, so do not describe it as a healthy rollback target.

## Strict release gate

Do not upload a private JKS/DPAPI file, replace Supabase, mutate production data, create a second VOLTA business database, or claim launch readiness from a build or an AI suggestion.
