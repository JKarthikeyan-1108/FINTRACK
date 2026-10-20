# FinTrack Android APKs

This folder contains the pre-built Android installation packages for FinTrack v2.0 with the Burgundy & Rose design system.

## Available Packages

| Package | Filename | Size | Purpose |
| :--- | :--- | :--- | :--- |
| **Release APK** *(Recommended)* | [`FinTrack-v2.0-Release.apk`](./FinTrack-v2.0-Release.apk) | ~3.45 MB | Optimized, minified release build for everyday use on Android phones and tablets |
| **Debug APK** | [`FinTrack-v2.0-Debug.apk`](./FinTrack-v2.0-Debug.apk) | ~4.41 MB | Unsigned debug build with developer logs and USB debugging enabled |

## Installation Instructions

### Option 1: Direct Download to Android Phone
1. Click on [`FinTrack-v2.0-Release.apk`](./FinTrack-v2.0-Release.apk) on GitHub and click **Download Raw**.
2. Open the downloaded `.apk` file on your device.
3. If prompted, tap **Settings** and enable **"Allow from this source"** for your browser/file manager.
4. Tap **Install** and then **Open**.

### Option 2: Install via ADB
```bash
adb install FinTrack-v2.0-Release.apk
```
