plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Release signing credentials are injected at build time, never committed.
// With no credentials, debug builds remain available and release builds are unsigned.
// The release workflow refuses to publish artifacts unless signing is verified.
val releaseStorePath = providers.environmentVariable("VOLTA_RELEASE_KEYSTORE_FILE").orNull
val releaseStorePassword = providers.environmentVariable("VOLTA_RELEASE_STORE_PASSWORD").orNull
val releaseAlias = providers.environmentVariable("VOLTA_RELEASE_KEY_ALIAS").orNull
val releaseKeyPassword = providers.environmentVariable("VOLTA_RELEASE_KEY_PASSWORD").orNull
val releaseSigningReady = listOf(
    releaseStorePath,
    releaseStorePassword,
    releaseAlias,
    releaseKeyPassword
).all { !it.isNullOrBlank() }

android {
    namespace = "com.muslly.volta"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.muslly.volta"
        minSdk = 24
        targetSdk = 35
        versionCode = 2
        versionName = "0.2.0"
    }

    // Keep javac and Kotlin bytecode targets aligned.
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    signingConfigs {
        if (releaseSigningReady) {
            create("voltaRelease") {
                storeFile = file(requireNotNull(releaseStorePath))
                storePassword = releaseStorePassword
                keyAlias = releaseAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        getByName("release") {
            isDebuggable = false
            if (releaseSigningReady) {
                signingConfig = signingConfigs.getByName("voltaRelease")
            }
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.10.0")
}
