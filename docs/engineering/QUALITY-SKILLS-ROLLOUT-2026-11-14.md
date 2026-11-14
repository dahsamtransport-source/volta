# VOLTA quality and skills rollout — 2026-11-14

## Current observed source
- Existing Android Gradle project with a debug APK workflow, rather than a newly generated APK.
- Existing public/sw.js shell caching and src/lib/offline/queue.ts with IndexedDB and idempotency-key storage. Existing visit-capture replay code is a separate path; observe it before altering it.
- Existing Vitest/unit build commands and .agents/skills for RLS, offline synchronization, Arabic/RTL UI and release gates.
- The production readiness document explicitly says sales cannot be written offline from the browser, and the latest published app is not proven to contain the hardening commit. Do not bypass manager-authorized sales RPCs.
- Source is linked to Lovable; AGENTS.md prohibits direct changes to managed schema/migrations and rewriting published history.

## Implemented on this review branch
- Web CI now runs on pushes to main, has a manual trigger, and uses prettier --check rather than mutating the checked-out source with prettier --write.
- Android debug build is checked on pull requests targeting main when Android files change.
- Agent toolkit guard now runs on pushes to main.
- Copilot instructions require test-first changes, evidence-backed releases, and privacy-safe telemetry.

## Recommended but NOT integrated by this branch
- Superpowers: connected in ChatGPT; repository-side agent behavior should use local skills and instructions, with red/green test evidence.
- Context7: optional, verify installation and data boundaries before enabling for code agents.
- PostHog: not instrumented in VOLTA. Events may eventually include app_open, visit_draft_saved, visit_sync_retry, visit_sync_success, visit_sync_rejected, and offline_queue_size, with no exact customer GPS coordinates, customer identity, notes, authentication secrets, prices, bank details or invoice payloads. Start only after privacy review.
- Dexie/Workbox: **do not replace** existing indexedDB and service worker solely to add another library; test and retain current implementation unless a measured gap demands migration.
- Playwright: add browser regression after confirming test harness and representative sign-in fixtures. Test login, assigned establishment, offline queue and recovery without real customer data.
- k6: design staging load tests for the authenticated server API and replay idempotency; no destructive runs against live tenant data.
- Semgrep/Trivy: evaluate pinned CI tools in a report-only trial and gate on confirmed critical findings after triage.
- Capacitor: evaluate only if native APIs/offline packaging are demonstrably missing; the existing Android project and Lovable history take precedence.
- Figma, MagicPath, TanStack Table and shadcn: use for an accessible mobile-first dashboard redesign; preserve Arabic RTL and fast field input.

## Required acceptance matrix
- [ ] Frozen install, unit tests and production build on a fresh PR CI run.
- [ ] Confirm the existing visit replay preserves originating user and never submits a second user's writes.
- [ ] Test airplane mode, app restart, duplicate submits, expired sessions, clock drift, and network loss mid-request.
- [ ] Verify server-side idempotency; local-only keys do not prove deduplication on the server.
- [ ] No PII/GPS/financial data in telemetry; third-party analytics are OFF unless explicitly approved and configured.
- [ ] Android: debug artifact is not a production signed release; verify signing, keystore custody, package identity and target API before shipping.
- [ ] Signed build and on-device QA; inspect actual APK rather than assuming workflow success equals a release.
- [ ] Confirm current Vercel deployment, branch, health, custom domain and rollback before changing alias or DNS.
- [ ] Never directly write manager-authorized sales table entries from an offline client.

## Priorities
P0 offline visit replay and server dedupe tests; P0 Android device smoke; P1 release signing and current deployment validation; P2 analytics and broader UI refinement.

No production database, active Vercel deployment, Lovable generated file or customer record is changed by this branch.

## CI root-cause analysis and source repair
- Initial read-only Prettier failed on `src/components/data/VisitCapture.tsx` because the source was not formatted. Previously, CI ran `prettier --write` on the checked-out source and silently repaired it only inside the runner, leaving the repository unchanged.
- Next, ESLint failed on the same legacy formatting debt because the `prettier/prettier` rule is enabled.
- The isolated review branch now contains the actual Prettier-generated formatting commit for `VisitCapture.tsx`. The one-time formatter workflow used solely to produce that commit was removed after the source update.
- `.github/workflows/web-ci.yml` is restored to **blocking** `prettier --check` and full ESLint on both screens, without `continue-on-error` or any rule override. Any success statement must wait for a fresh full CI run at the final PR head.
- Android Debug APK builds have previously passed on the branch; this does not establish release signing or device readiness.
- GitHub currently reports a failed Vercel status with an account-deployment-blocked link for `volta-lahj-field-sales`. The connected Pro team's project reports `live: false` even though historical Preview deployments are READY. Domain verification is not production publication. Investigate deployment eligibility, team ownership, duplicate project connections and production branch mapping before publishing.
