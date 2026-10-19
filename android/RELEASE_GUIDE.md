# FinTrack Android Production Release Guide

This document outlines the official release artifacts, digital signing configuration, and Google Play Store deployment steps for **FinTrack v2.0.0** (`com.fintrack.app`).

---

## 1. Production Release Artifacts

Both production packages have been built and digitally signed using RSA-2048 with SHA-256:

| Artifact | File Path | Size | Distribution Channel |
| :--- | :--- | :--- | :--- |
| **Android App Bundle (.aab)** | `android/app/build/outputs/bundle/release/app-release.aab` | **3.21 MB** | **Google Play Store** (Optimized dynamic feature delivery) |
| **Signed Release APK (.apk)** | `android/app/build/outputs/apk/release/app-release.apk` | **3.38 MB** | Direct Sideloading, Enterprise MDM, Alternative App Stores |

---

## 2. Digital Signing Configuration

The application is digitally signed with both **v1 (JAR signing)** and **v2 (Full APK signature scheme)**:

- **Keystore Location**: `android/app/fintrack-release.keystore`
- **Key Alias**: `fintrack`
- **Algorithm**: RSA 2048-bit with SHA256withRSA
- **Serial Number**: `5753258e`
- **Certificate Validity**: Valid through **March 7, 2054**
- **SHA-256 Fingerprint**:
  ```
  FA:F7:56:7F:4F:82:EA:38:02:3A:1F:A3:4D:11:E0:5C:9C:AE:E7:E7:3B:C7:F6:CD:06:45:EA:75:E6:D4:F3:E6
  ```
- **SHA-1 Fingerprint**:
  ```
  A7:B5:6C:63:7C:F3:16:47:26:94:97:D8:17:6F:BE:B6:7A:FB:21:20
  ```

### CI/CD Environment Variable Overrides
In automated pipelines (GitHub Actions, Bitrise, Fastlane), you can inject custom secrets:
- `FINTRACK_KEYSTORE_PASSWORD`: Keystore master password
- `FINTRACK_KEY_ALIAS`: Private key alias (default: `fintrack`)
- `FINTRACK_KEY_PASSWORD`: Private key password

---

## 3. How to Build Release Artifacts

Whenever web assets are updated, rebuild the production bundle with:

```bash
# 1. Build optimized web application
cd fintrack
npm run build

# 2. Sync web assets into Android project
npx cap sync android

# 3. Generate signed Google Play Bundle (.aab)
cd android
.\gradlew.bat bundleRelease

# 4. Generate signed release APK (.apk)
.\gradlew.bat assembleRelease
```

---

## 4. Google Play Console Upload Checklist

1. **Access Google Play Console**: Log in at [play.google.com/console](https://play.google.com/console).
2. **App Creation / Selection**:
   - App Name: `FinTrack - Personal Finance & Budget Tracker`
   - Package Name: `com.fintrack.app`
   - Default Language: English (United States / India)
   - App Type: App / Free
3. **App Integrity**: Google Play App Signing will match the generated key signature or use it as an upload key.
4. **Upload AAB**:
   - Navigate to **Release > Production** (or **Closed Testing** for preliminary flighting).
   - Drag and drop `app-release.aab`.
   - Release name: `2.0.0 (2)`.
   - Release notes: *“FinTrack 2.0 introduces client-side SHA-256 PIN privacy lock, autonomous AI Financial Health Index, printable PDF statement exports, and live multi-currency FX conversions.”*
5. **Data Safety Declarations**:
   - Data stored locally with client-side SHA-256 obfuscation.
   - No financial data shared with third parties or external data brokers.
6. **Submit for Review**: Complete the store listing graphics (app icon, phone & tablet screenshots) and roll out.
