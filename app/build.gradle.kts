plugins {
    id("com.android.application")
}

android {
    namespace = "com.eldarfit.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.eldarfit.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 5
        versionName = "1.3.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
}
