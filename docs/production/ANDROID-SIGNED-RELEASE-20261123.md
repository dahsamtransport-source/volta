# VOLTA — Signed Android Release and Operational Blockers (2026-11-23)

## Signed Release: produced and cryptographically verified
- App: `com.muslly.volta`, versionName `0.2.0`, versionCode `2`; minSdk `24`, targetSdk `35`.
- Source: `dahsamtransport-source/volta`, changes already included in merge PR #18. Local `assembleRelease` finished with `BUILD SUCCESSFUL`.
- `apksigner verify --verbose --print-certs` succeeded; APK Signature Scheme v2 verified true. Signature uses an owner-controlled RSA 3072-bit certificate.
- APK SHA-256: `274EE825215AB3A9743A40C9C3D80D0C6D0F4E2F060CDF1B7790A4DF197D5BC5`.
- Signing certificate SHA-256: `48B8D34E81E76AD4D84583FDE20558B1018C33B89E4D7FF5F177AB7A5999880C`.
- On owner PC: `D:\VOLTA-DELIVERY\2026-11-23\VOLTA-v0.2.0-signed-release.apk` and `D:\VOLTA-DELIVERY\VOLTA-v0.2.0-signed-TESTING-20261123.zip` (containing public certificate, checksums, installation note, **no private key or passwords**).
- Signed build is **testing-only**; installation on an Android phone, update compatibility, GPS, Google Play Protect and true offline operation remain unverified.

## Actual Vercel blocker — confirmed by production API
- Target project: `volta-lahj-field-sales`, project ID `prj_UcD9fVQUJRG9Fhg6cs730F8N9HOO`. Domain: `volta.muslly.com` verified and DNS CNAME resolves to Vercel.
- Production and project Vercel subdomain both return HTTP **402** and `X-Vercel-Error: DEPLOYMENT_DISABLED`.
- Attempting a Git-linked **preview-only** deployment within the original project returned API error `resource_creation_blocked` / HTTP 402: **Your team has an overdue balance. Please add a valid payment method to reactivate your account.**
- An `unpause_project` request did not change the response. The authorized user's billing action is required; do not attempt circumvention by duplicate projects, DNS changes, or other deployment accounts.
- Vercel CLI is absent on the development computer; the project is not linked locally. No alternative authorized CLI path was available.

## Offline reliability work
- `OfflineQueue.enqueue()` previously checked existing keys with a separate read followed by `put`, creating a read-modify-write race under concurrent attempts.
- `MemoryQueueStorage` now supports `addIfAbsent` and `IndexedDbQueueStorage` uses atomic `IDBObjectStore.add()`, returning false on a duplicate-key `ConstraintError` while preserving the original record.
- Integration tests using `fake-indexeddb` simulate two concurrent queue instances and verify only one record exists, conflict updates persist, and removal affects only the selected mutation.
- Local unit tests: **21/21 PASS**; TypeScript `tsc --noEmit` PASS, ESLint 0 errors (8 existing warnings), Web build PASS. The new GitHub CI run must be checked on the PR's head commit.

## Unresolved release gates
1. Owner resolves overdue Vercel balance; recheck project state, HTTPS site response, actual deployed Git commit and smoke tests.
2. Connect a real Android device via ADB (or owner-directed installation), verify install/update against Play Protect, GPS permission and WebView loading. Do not disable Play Protect.
3. Run a device-level offline test including airplane mode, 12-hour duration, process restart, safe replay, idempotency, and user-switch isolation with test accounts, NOT live sales.
4. Verify actual field sales, quotations and RLS denials in a separate test environment, then prepare an operator acceptance report.
5. Preserve an off-device recovery copy of release signing credentials under owner custody; avoid sharing JKS/passwords with repositories or public services.

**No paid transaction, alternate hosting, Supabase production writes, DNS change, or Android production distribution was performed.**