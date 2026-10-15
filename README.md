# Chennai Mettex Lab Pvt. Ltd. {Guindy} - Antibiotics CRM Expiry Reminder System

A comprehensive laboratory reference standard management and automated pre-expiry alert application based on `Antibiotics-CRM.xlsx`.

---

## 🎯 Purpose & Reminder Protocol

In analytical chemistry, pharmaceutical testing, and food safety quality assurance, **Certified Reference Materials (CRM)** require strict expiration tracking to maintain **ISO/IEC 17025** compliance and analytical precision.

This system implements an automated **1-Month Advance Warning Protocol**:
- **Target Column:** `EXPIRED DATE` (Column 11 in sheet `ANTIBIOTIC_Code_AB 11.05.2024`).
- **Reminder Date Trigger:** Computed as exactly **1 calendar month prior to expiration** (`Expiry Date - 30 days`).
- **Alert Status Classification:**
  - 🚨 **EXPIRED:** Standards whose expiry date has passed (`Days < 0`).
  - ⚠️ **1-MONTH REMINDER ACTIVE (Action Required):** Standards expiring within the next 30 days (`0 ≤ Days ≤ 30`). Triggers notifications to re-order, re-qualify, or replace.
  - ⏳ **UPCOMING (31–60 Days):** Standards due for warning next month.
  - 🟢 **VALID / SAFE (> 60 Days):** Standards with healthy shelf-life.

---

## 📦 System Modules & Components

### 1. 📱 Native Android App (`app/` & `CRM-Reminder-Antibiotics.apk`)
- **Precompiled Standalone APK:** [`CRM-Reminder-Antibiotics.apk`](CRM-Reminder-Antibiotics.apk)
- **Android Studio Project Module:** [`app/`](app/) (Configured for Android 15/16 SDK 36, targetSdk 35, minSdk 26).
- **Background Worker (`ReminderWorker`):** Runs daily background checks via Android `WorkManager` and displays high-priority system notifications with sound and vibrations whenever any antibiotic enters the 1-month reminder window.
- **Boot Receiver (`BootReceiver`):** Automatically reschedules daily reminder checks when the device reboots.
- **Detailed Documentation:** See [`app/README.md`](app/README.md).

### 2. 💻 Interactive Web & PWA App (`CRM-Reminder-Web/`)
- **Direct Launch:** Open [`CRM-Reminder-Web/index.html`](CRM-Reminder-Web/index.html) or run [`run_crm_reminder.bat`](run_crm_reminder.bat).
- **178 Preloaded CRM Standards:** Instantly available offline via `crm_data.js` without requiring an active internet connection or local web server.
- **Live Search & Filter:** Instant search by name, code (`AA_01`, `AC_06`), CAS number, make, batch/lot.
- **Filter Tabs:** All (178), Reminder Active (< 30d), Upcoming (31-60d), Expired, Safe.
- **Browser System Notifications:** Web Notification API desktop alerts.
- **Calendar Sync (.ics):** Export all 1-month reminder events into an `.ics` file compatible with Google Calendar, Microsoft Outlook, and Apple Calendar.
- **Excel Drag & Drop Importer:** Built-in SheetJS engine to upload new or updated `.xlsx` files anytime.
- **Detailed Documentation:** See [`CRM-Reminder-Web/README.md`](CRM-Reminder-Web/README.md).

### 3. 🖥️ Windows Desktop Launcher & Background Reminder
- **Launcher:** [`run_crm_reminder.bat`](run_crm_reminder.bat)
  - Opens the app in your default browser and runs an instant CLI reminder check.
- **PowerShell Script:** [`check_crm_reminders.ps1`](check_crm_reminders.ps1)
  - Scans inventory, outputs a formatted status table in the console, and triggers Windows system tray toast/balloon alerts. Can be scheduled via Windows Task Scheduler.

---

## 📊 Summary of Catalogued Antibiotic CRMs

| Category | Count | Status Description |
| :--- | :---: | :--- |
| **Total Catalogued Standards** | **178** | Complete reference inventory from `Antibiotics-CRM.xlsx` |
| ⚠️ **1-Month Reminder Active** | **0** | No items expiring in the next 30 days as of current date |
| ⏳ **Upcoming (31–60 Days)** | **5** | Expiring in Dec 2026 (Chlortetracycline, Leuco-Malachite green-D5, Malachite green oxalate salt, Semicarbazide-13C-15N2.HCl, Gatifloxacin) |
| 🚨 **Expired Items** | **37** | Passed expiration date (need quarantine or disposal) |
| 🟢 **Valid / Safe (> 60 Days)** | **136** | Sufficient shelf-life (> 2 months to multiple years) |

---

## 📂 Project Directory Structure

```text
mettex/
├── .gitignore                      # Git ignore rules for Android, Gradle, and OS files
├── README.md                       # Main project documentation
├── Antibiotics-CRM.xlsx            # Master CRM inventory spreadsheet
├── antibiotics_crm.json            # Parsed JSON dataset (178 CRM entries)
├── CRM-Reminder-Antibiotics.apk    # Standalone precompiled Android APK
├── check_crm_reminders.ps1         # Windows PowerShell inventory scanner & notifier
├── run_crm_reminder.bat            # Windows 1-click batch launcher
├── build.gradle                    # Top-level Gradle build script
├── settings.gradle                 # Gradle settings (modules: app)
├── gradle.properties               # JVM & Gradle build optimization properties
├── gradlew / gradlew.bat           # Gradle wrapper scripts
├── gradle/wrapper/                 # Gradle wrapper binaries & configuration
├── coa/                            # Certificates of Analysis (CoA) documents
│   └── Sarafloxacin.pdf            # Certificate of Analysis for Sarafloxacin HCl
├── app/                            # Android native application module
│   ├── README.md                   # Android module documentation
│   ├── build.gradle                # App-level build configuration
│   ├── proguard-rules.pro          # ProGuard obfuscation rules
│   └── src/main/
│       ├── AndroidManifest.xml     # Permissions, activity, and receivers
│       ├── java/com/crm/reminder/  # Kotlin source code
│       │   ├── MainActivity.kt     # WebView container & JS bridge
│       │   ├── ReminderWorker.kt   # Daily WorkManager background scanner
│       │   └── BootReceiver.kt     # Boot completed receiver
│       ├── assets/                 # Embedded web assets for offline WebView
│       └── res/                    # App icons, layouts, themes, strings
└── CRM-Reminder-Web/               # Standalone Web application
    ├── README.md                   # Web module documentation
    ├── index.html                  # Responsive Web & PWA interface
    ├── app.js                      # Search, filter, export, and notification logic
    ├── styles.css                  # UI styling and responsive design
    ├── crm_data.js                 # Offline JS dataset (bypasses CORS)
    ├── antibiotics_crm.json        # CRM database in JSON format
    ├── Antibiotics-CRM.xlsx        # Excel inventory copy
    ├── xlsx.full.min.js            # SheetJS library for in-browser Excel parsing
    ├── run_web_app.bat             # Batch launcher for web interface
    └── test_parse.js               # Parser verification test script
```

---

## 📜 Certificate of Analysis (CoA) Cloud Integration

To ensure full ISO/IEC 17025 audit compliance, reference material Certificates of Analysis (CoA) can be linked directly to CRM inventory entries.

- **Current Uploaded Standard:** Sarafloxacin (`Sarafloxacin.pdf`)
- **OneDrive Location:** `App/coa/Sarafloxacin.pdf` (under account `mettexqsm@outlook.com`)
- **Direct Preview Sharing Link:** [`https://1drv.ms/b/c/5046768c7fc1fb69/IQChF7RABKSgQImZmahljvGAAePTbaIxTFbkeX2pL4gL6JE?e=W3k2ve`](https://1drv.ms/b/c/5046768c7fc1fb69/IQChF7RABKSgQImZmahljvGAAePTbaIxTFbkeX2pL4gL6JE?e=W3k2ve)
- **Application Integration:**
  - **Table View:** Click the `📜 CoA Preview` tag or `📜 CoA` action button on the Sarafloxacin row to open the verified PDF preview in OneDrive.
  - **Cards View:** Click `📜 Certificate of Analysis (PDF)` on the Sarafloxacin card.
  - **Details Modal:** Displays the CoA verification banner with direct one-click preview button.


---

## 🚀 How to Run

### 1. On Windows (Web & CLI Check)
- Double-click [`run_crm_reminder.bat`](run_crm_reminder.bat) to launch the web dashboard and execute a console reminder check simultaneously.
- Or open [`CRM-Reminder-Web/index.html`](CRM-Reminder-Web/index.html) directly in any browser.

### 2. On Android / Windows Subsystem for Android (WSA)
- Install the standalone APK using ADB:
  ```bash
  adb install -r CRM-Reminder-Antibiotics.apk
  ```
- Or open Android Studio in this folder and deploy to a connected physical device or emulator.

---

## ⚡ Custom PowerShell Command: `git_upload`

A custom automation command has been configured in your PowerShell profile to automate the 5 fundamental Git upload commands in one step:

```powershell
# Usage in any PowerShell terminal:
git_upload "your commit message here"

# Or simply:
git_upload
```

### The 5 Automated Commands:
1. `git status` — Inspect working directory status
2. `git add .` — Stage all new and modified files
3. `git commit -m "<message>"` — Commit changes with timestamp or custom message
4. `git branch -M main` — Set default branch to `main`
5. `git push -u origin main` — Push changes to the remote repository

#   a p p  
 