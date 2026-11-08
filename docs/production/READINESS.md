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
- Add local-first visit capture for authenticated users. Visit writes are queued in IndexedDB and replayed through the authenticated Supabase client with per-device idempotency keys. RLS and database constraints remain authoritative.

## Explicit release blockers

- This branch must pass GitHub Actions (web CI and Android APK build) before merge.
- The visit form needs an end-to-end test with an actual representative login, an assigned establishment, and a real device.
- Offline visit capture and replay must be tested across airplane-mode restart, network loss during submit, duplicate retry, logout/login, and database rejection.
- Sales are not offline-writable from the browser. The current database only exposes quote-to-sale conversion through a manager-authorized transactional RPC. Do not bypass it or queue raw `sales` table inserts.
- No Supabase Edge Function exists for generic sync ingestion. The existing `sync_events` table deliberately denies direct client writes; do not weaken its RLS policy.
- A verified domain is not a production deployment. Production is not approved until tests pass and the target release commit is reviewed.
- The Android app remains a debug APK pipeline until signing, release keystore custody, and Play distribution decisions are configured.

## Database protection

Do not reset the project, recreate the schema, seed demo transactions into production, or alter existing RLS policies as a shortcut. Schema changes require a reviewed migration and backup/rollback plan.
