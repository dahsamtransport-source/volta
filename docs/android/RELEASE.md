# VOLTA — Android signed release gate

This is a **separate, manually triggered** release build. The debug APK from `.github/workflows/android-apk.yml` must never be distributed as the field release.

## Repository and policy
- Source: `dahsamtransport-source/volta`. Run `Build signed VOLTA Android release` from trusted `main` only.
- Production origin is fixed in `MainActivity.kt` to `https://volta.muslly.com`.
- This workflow **does not** publish to Google Play, Vercel, or Supabase.
- Do not commit a keystore, its base64 representation, or its passwords. Keep a separately backed-up offline copy with controlled ownership. Losing the signing key can prevent compatible APK updates.

## Required GitHub Actions repository secrets
1. `VOLTA_ANDROID_KEYSTORE_BASE64` — base64 of the owner-approved binary **release** .jks file; never use Android's debug.keystore.
2. `VOLTA_RELEASE_STORE_PASSWORD` — password to open the release keystore.
3. `VOLTA_RELEASE_KEY_ALIAS` — alias of the release signing key.
4. `VOLTA_RELEASE_KEY_PASSWORD` — password of that key.

The Android Gradle build reads only `VOLTA_RELEASE_KEYSTORE_FILE`, `VOLTA_RELEASE_STORE_PASSWORD`, `VOLTA_RELEASE_KEY_ALIAS`, and `VOLTA_RELEASE_KEY_PASSWORD` from its environment. If credentials are missing, the manual workflow fails before building.

## Acceptance before distribution
- Confirm `assembleRelease`, `apksigner verify --verbose --print-certs`, APK v2 signature, and SHA-256 checks pass.
- Record signing certificate SHA-256 (public fingerprint only) and verify it remains unchanged across updates.
- Check `android:debuggable=false`, required permissions only (internet, precise/approximate location), no cleartext HTTP, and no SSL-error bypasses.
- On an actual test phone: install, upgrade without losing local work, login, GPS permission/accuracy, official HTTPS domain, airplane-mode behavior, offline visit retry/idempotency, logout/user isolation, and return online.
- Check Play Protect classification. **Signed release alone cannot guarantee removal of an Uncommon-developer warning.** Use the Google Play developer verification/testing/distribution path, or appeal if Google flags a clean app incorrectly: https://developers.google.com/android/play-protect/warning-dev-guidance
- Do **not** disable Play Protect or send an unverified APK to field staff.

## Status
The pipeline is configured, not a verified production release. It cannot run without an owner-approved and safely stored release signing key and four GitHub secrets. Build and device-install test evidence must be attached before marking ready.
