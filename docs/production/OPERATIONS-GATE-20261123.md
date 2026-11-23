# VOLTA release and field-operations gate — 2026-11-23

## Scope and evidence
- Source: `dahsamtransport-source/volta`, production branch `main` (baseline `e8ead222691eb43c2afab1cf78b0ebd98cd7f91e`).
- Production Vercel project: `volta-lahj-field-sales` only; domain `https://volta.muslly.com`.
- Supabase project `dymxnmpaaobxoaowksoc`; inspect only `field_sales`.
- No production deployment, schema changes, live test transactions, DNS edits or bypasses are authorized by this report.

## Confirmed
- Graphify local structural extraction of the VOLTA repository after the latest TypeScript fixes: **896 nodes, 1,801 edges and 63 communities** across 108 classified source files, generated using pinned `graphifyy[sql]==0.9.108`. Report: local ignored `graphify-out/GRAPH_REPORT.md`; this is NOT the hosted Graphify index.
- Supabase reports `ACTIVE_HEALTHY`; 19 business tables in `field_sales` have RLS enabled. Snapshot includes **1 establishment, 1 representative, 0 visits, 0 sales**; zero recorded rows are not evidence of zero physical activity.
- Windows development device is reachable. Android release signing keystore and DPAPI-protected signing credentials exist outside Git; file hash matches saved metadata. No independent off-device recovery has been proven.
- New offline IndexedDB change waits for transaction completion/abort before acknowledging persistence; memory-queue tests cover conflict retention and selective acknowledgement. Test execution: 19 Vitest tests passed locally (2026-11-23).
- The Release workflow is manually dispatched from `main` and does not deploy to Google Play or the website.

## Critical blocked / unproven gates
1. **Production domain:** DNS resolves to Vercel, but a direct request from the development machine returned HTTP **402** with `X-Vercel-Error: DEPLOYMENT_DISABLED`. Vercel project reports `live: false`. Latest confirmed READY production deployment is based on older `30ab758`. Owner must review Vercel billing/project disable state before restoring service; do not change DNS as a workaround.
2. **Signed APK:** Running `assembleRelease` and verifying it with `apksigner`, certificate SHA-256 and an install test are mandatory. An existing debug APK is NOT a release. Never disable Play Protect to bypass an installation block.
3. **Security:** Supabase Auth Security Advisor warns that leaked-password protection is disabled. Confirm the account's allowed configuration and review before change.
4. **Data:** No actual field visits or sales are documented in live database; no real assigned representative/end-to-end authenticated visit test was performed. Source Excel candidates need manual identity and location verification, not automatic promotion.
5. **Offline:** Code implements visit queueing, local lookups and user-bound retry, but 12-hour offline behavior, airplane-mode restart, concurrent retry, RLS rejection, and account-switch isolation still require device/end-to-end evidence. The Android app is a remote HTTPS WebView shell, not proof of standalone offline UI.
6. **Sales:** No live commercial transaction tests; do not use production to simulate sales or bypass the manager-authorized quote-to-sale RPC.
7. **Graphify hosted:** VOLTA is not yet indexed in the connected Graphify workspace; only local offline structural analysis was performed.
8. **Android device:** No USB/ADB Android device was attached at review time. Installation, update-signature continuity, GPS permission, Play Protect status and offline replay remain untested.

## Release acceptance matrix
| Area | Status | Exit evidence |
|---|---|---|
| Web unit tests | PASS (19 tests) | Local Vitest and PR #18 CI success |
| Strict TypeScript | PASS | `bun x tsc --noEmit` locally and GitHub CI run 45078506493 |
| Full lint and web build | PASS (0 errors / 8 warnings) | GitHub CI run 45078506493 on 3a1381f |
| Android debug | PASS (historical PR #17) | GitHub run 45029208660 |
| Android signed release | PENDING | `apksigner verify`, release SHA-256 and retained signature fingerprint |
| Vercel production/domain | FAIL | Re-enabled and responding with correct content over HTTPS |
| Supabase schema health | PASS (structure only) | Project status and RLS summary; role-isolation E2E remains |
| Offline field operation | NOT TESTED end-to-end | Device logs for airplane-mode, restart, sync/idempotency and user isolation |
| Real Android device | NOT TESTED | Installation, update, GPS and Play Protect screenshots/logs |
| Operational launch | BLOCKED | All required gates approved and field data validated |

## Explicit next actions
- Owner: resolve Vercel `DEPLOYMENT_DISABLED` from the existing project's billing/access controls, **no duplicate project**.
- Engineering: reproduce signed Release locally without exposing credentials, validate APK signature, preserve offline recovery material in a separate owner-controlled backup.
- QA: run device E2E with authenticated test accounts against a dedicated safe environment (not production transactions). Run deny tests for RLS and sync replay, plus data quality review.
- Graphify: owner may index `dahsamtransport-source/volta` in https://app.graphify.com; local extraction is already available on development computer.

## Evidence
- PR #17: https://github.com/dahsamtransport-source/volta/pull/17
- Local source map: `.agents/skills/graphify/SKILL.md`; `graphify-out/GRAPH_REPORT.md` (ignored)
- Vercel project: https://vercel.com/dr-mohammed-almusaali/volta-lahj-field-sales
- Database: https://supabase.com/dashboard/project/dymxnmpaaobxoaowksoc
- Google Play Protect developer guidance: https://developers.google.com/android/play-protect/warning-dev-guidance
