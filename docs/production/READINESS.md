# VOLTA Production Readiness

**Project:** Lahj Oil Field Sales  
**Source:** `dahsamtransport-source/volta`  
**Working branch:** `fix/volta-reliability-20261108`  
**Vercel project:** `volta-lahj-field-sales`  
**Domain:** `volta.muslly.com`  
**Supabase project:** `dymxnmpaaobxoaowksoc`, schema `field_sales`

## Confirmed infrastructure

- The existing Supabase project reports `ACTIVE_HEALTHY`.
- The `field_sales` schema and its existing migration history are present.
- RLS is enabled on the inspected business tables.
- The Supabase publishable key configured on the primary Vercel project was verified to match an active publishable key for this project. No service-role key is used by the browser.
- The Vercel domain `volta.muslly.com` is verified and attached to the primary VOLTA project.
- The repository source is currently public. Make it private in GitHub repository Settings before adding proprietary or customer data to the repository.

## Implemented in this hardening branch

- Align Android Java and Kotlin bytecode compilation to JVM 17.
- Pin the Android build to Gradle 8.9, matching Android Gradle Plugin 8.7.3.
- Add a Web CI workflow for frozen-lockfile install, lint, unit tests, and production build.
- Cache same-origin HTML navigation responses for offline shell fallback, without caching Supabase API traffic or responses marked private/no-store.
- Add local-first visit capture for authenticated users. Visit writes are queued in IndexedDB, bound to the originating auth user, and replayed only after auth restoration through the authenticated Supabase client with per-device idempotency keys. Another user's pending writes are preserved, not transmitted or marked as failed. The local establishment/representative lookup cache is namespaced per user. RLS and database constraints remain authoritative.
- Add iOS Home Screen / PWA install metadata and PNG app icons (180px, 192px, and 512px).
- Restrict Service Worker HTML fallback caching to the public root shell, excluding query-string routes, account-specific pages, Supabase API calls, and private/no-store responses. Precache only static icons, manifest, and offline help.

## Explicit release blockers

- Latest web CI passed on the final tested code commit (`d16a6c16fd95b11e4ac339ae99dd2a22b48c5b99`): dependency install, formatting/ESLint on changed screens, unit tests, and production build. The Android debug APK build passed after JVM target and WebView geolocation fixes on the Android source commit (`5180596ab5d68f14fbb04c3bdb1b05bddcf8fd17`).
- The visit form needs an end-to-end test with an actual representative login, an assigned establishment, and a real device.
- Offline visit capture and replay must be tested across airplane-mode restart, network loss during submit, duplicate retry, logout/login, and database rejection.
- Sales are not offline-writable from the browser. The current database only exposes quote-to-sale conversion through a manager-authorized transactional RPC. Do not bypass it or queue raw `sales` table inserts.
- No Supabase Edge Function exists for generic sync ingestion. The existing `sync_events` table deliberately denies direct client writes; do not weaken its RLS policy.
- A verified domain is not a production deployment. The Vercel project reports `live: false`; the latest confirmed ready preview predates the final hardening commit. A new Vercel deployment API request was rejected because the team exceeded the free daily deployment quota (100/day); wait for quota renewal or resolve the plan/team limit before promoting the latest commit. No production alias or DNS was changed.
- The Android app remains a debug APK pipeline until signing, release keystore custody, and Play distribution decisions are configured. A verified debug APK artifact exists; it is not a signed production release.
- The connected GitHub account currently exposes `dahsamtransport-source/volta` as its VOLTA repository. No GitHub repository named `volta-lahj-field-sales` was present in the authenticated account listing. `volta-lahj-field-sales` is a separate Vercel project name. Keep the duplicate Vercel project (`volta`) as a non-primary/retained copy; its preview deployments were disabled rather than deleting it.

## Database protection

Do not reset the project, recreate the schema, seed demo transactions into production, or alter existing RLS policies as a shortcut. Schema changes require a reviewed migration and backup/rollback plan.
