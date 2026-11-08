plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

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
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.10.0")
}
