# VOLTA Android debug APK

The native project is in `android/` and currently hosts the remote site `https://volta.muslly.com` in an Android WebView.

## CI build

The workflow `.github/workflows/android-debug-apk.yml` installs Temurin JDK 17, Android SDK 35 and Gradle 8.9 on an Ubuntu runner and invokes `gradle --no-daemon :app:assembleDebug` from `android/`.

On a successful workflow run, retrieve the `volta-debug-apk` artifact from GitHub Actions. The debug APK is intended for internal testing only and must not be distributed as a production-ready offline application.

## Release blockers

- Verify the Gradle build passes and the APK installs on a real Android device.
- Confirm `https://volta.muslly.com` returns the intended application over HTTPS. A previous check from the development PC returned HTTP 402.
- Implement server-side idempotent offline sync and client retry/acknowledgement before relying on offline financial or inventory mutations.
- Review location permission behavior and authentication lifecycle.
