# CRM Reminder Android App Module

Native Android application module for **Chennai Mettex Lab Pvt. Ltd. {Guindy}** Antibiotics CRM Expiry Reminder System.

---

## 📱 Technical Overview

- **Namespace / Package:** `com.crm.reminder`
- **Application ID:** `com.crm.reminder`
- **Compile SDK:** 36 (Android 15 / 16)
- **Target SDK:** 35
- **Min SDK:** 26 (Android 8.0 Oreo)
- **Language / Runtime:** Kotlin & Java 17

---

## 🧩 Architecture & Components

1. **`MainActivity.kt`:**
   - Fullscreen `WebView` loading assets bundled in `file:///android_asset/index.html`.
   - JavaScript Bridge (`AndroidBridge`) allowing bidirectional communication between the web frontend and Android native features.
   - Enforces runtime permission checks for `POST_NOTIFICATIONS` (Android 13+).
   - Initializes daily background reminder scheduling via `WorkManager`.

2. **`ReminderWorker.kt` (`androidx.work.CoroutineWorker`):**
   - Scheduled as a periodic background task (runs daily).
   - Parses `antibiotics_crm.json` from assets.
   - Scans all reference standards against current device date.
   - Triggers native Android system notifications with alert sound and vibration if any standard is within the 1-month reminder window (0 ≤ Days Left ≤ 30).

3. **`BootReceiver.kt` (`android.content.BroadcastReceiver`):**
   - Catches `android.intent.action.BOOT_COMPLETED`.
   - Ensures the daily `WorkManager` background reminder worker is scheduled immediately upon device reboot.

4. **Bundled Assets (`src/main/assets/`):**
   - Offline web application (`index.html`, `styles.css`, `app.js`, `crm_data.js`, `antibiotics_crm.json`, `xlsx.full.min.js`) embedded directly inside the APK for high performance and offline independence.

---

## 🛠️ Build & Installation Instructions

### Build with Gradle Wrapper
From the root directory of the project:
```bash
# Debug build
gradlew assembleDebug

# Release build
gradlew assembleRelease
```
The compiled APK will be generated at:
`app/build/outputs/apk/debug/app-debug.apk`

### Install on Device / Emulator / WSA
```bash
# Via ADB (Android Debug Bridge)
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
Or install the pre-compiled APK located at the project root:
```bash
adb install -r CRM-Reminder-Antibiotics.apk
```
