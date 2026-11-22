# VOLTA Android release readiness — 2026-11-22

## Verified
- Web production build succeeds (`bun run build`) on `ahmed-almusali`.
- 17 Vitest tests pass; ESLint has zero errors and eight warnings after formatting fixes.
- Native Android Kotlin WebView shell exists in `android/` (package `com.muslly.volta`, compile SDK 35, target SDK 35).

## Critical limitations
1. `MainActivity.kt` loads `https://volta.muslly.com` over HTTPS. The APK is a remote WebView shell, **not a standalone offline application**. If the domain is unavailable, users cannot access the field-sales UI.
2. `src/lib/offline/queue.ts` stores pending operations in IndexedDB but explicitly has **no synchronization worker**. Do not promise offline writes will reach Supabase, or enable automatic replay before server-side idempotency and RLS have been tested.
3. Android SDK, Java/JDK and Gradle wrapper were not found in the initial device checks. A Java 17 installation was initiated but not yet verified as completed. Android APK build has **not** passed.
4. A browser publishable key must be configured for the existing Supabase project `dymxnmpaaobxoaowksoc`, schema `field_sales`. Never commit service-role credentials.

## Required release gates
- Install and verify JDK 17, Android command-line tools, platform 35 and build-tools 35; add a verified Gradle wrapper; run `:app:assembleDebug` and inspect APK output.
- Confirm `volta.muslly.com` resolves and serves the intended version over valid HTTPS before testing WebView.
- Implement and test an offline-first application shell and transactional sync protocol with idempotency keys, conflict resolution, user/tenant scoping, retries, and RLS.
- Test offline for 12 hours, app restart, concurrent retries, location permissions, and real Android device behavior.
- Audit authentication, financial totals, data export, and backups before production release.

Do not merge or deploy this branch solely on the basis of the passing web build.
