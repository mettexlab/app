# CRM Reminder Web Application

Standalone offline-first Web & PWA application for **Chennai Mettex Lab Pvt. Ltd. {Guindy}** Antibiotics Certified Reference Materials (CRM) Expiry Reminder System.

---

## 🌟 Key Features

1. **Zero-Server Offline Execution:**
   - Preloaded with 178 reference standards via [`crm_data.js`](crm_data.js).
   - Works immediately when opened directly in any modern browser (`Chrome`, `Edge`, `Firefox`) without requiring a local web server (no CORS issues with `file://`).

2. **1-Month Advance Expiry Warning Protocol:**
   - Computes reminder trigger date as **1 calendar month prior to expiration** (`Expiry Date - 30 days`).
   - Categorizes standards into:
     - 🚨 **Expired:** Standards past expiration date.
     - ⚠️ **1-Month Reminder Active:** Standards expiring within 30 days.
     - ⏳ **Upcoming (31–60 Days):** Standards due for warning next month.
     - 🟢 **Valid / Safe (> 60 Days):** Standards with long shelf-life.

3. **Live Search & Quick Filters:**
   - Instant search across standard name, internal code (`AA_01`, `AC_06`, etc.), CAS number, batch/lot number, manufacturer, and storage conditions.
   - Status counter cards that filter table with one click.

4. **Calendar Sync (.ics):**
   - Generates an RFC 5545 `.ics` file containing pre-expiry reminder alarms.
   - Compatible with Google Calendar, Microsoft Outlook, and Apple Calendar.

5. **Excel Import & Export (SheetJS):**
   - Drag-and-drop or upload updated `.xlsx` files directly in-browser using [`xlsx.full.min.js`](xlsx.full.min.js).
   - Export filtered or full reports to Excel spreadsheet.

6. **Browser Desktop Notifications:**
   - Supports Web Notification API with sound alert capabilities.

7. **Certificate of Analysis (CoA) Cloud Preview:**
   - Reference standards like **Sarafloxacin** link directly to authenticated OneDrive PDF previews (`App/coa/Sarafloxacin.pdf`).
   - Integrated with instant preview buttons in Table View, Cards View, and the Details Modal.

---

## 📁 File Structure

| File | Description |
| :--- | :--- |
| [`index.html`](index.html) | Main HTML interface with metrics dashboard, action bar, search, and inventory table |
| [`app.js`](app.js) | Application controller, event handlers, status computations, calendar & Excel export |
| [`styles.css`](styles.css) | Custom responsive styling, status badges, modal styles, and print layout |
| [`crm_data.js`](crm_data.js) | Offline JavaScript dataset containing the 178 catalogued antibiotic standards |
| [`antibiotics_crm.json`](antibiotics_crm.json) | JSON formatted dataset extracted from the original Excel sheet |
| [`Antibiotics-CRM.xlsx`](Antibiotics-CRM.xlsx) | Master Excel inventory sheet |
| [`xlsx.full.min.js`](xlsx.full.min.js) | Standalone SheetJS library for client-side Excel parsing |
| [`run_web_app.bat`](run_web_app.bat) | Windows batch file to launch `index.html` in default browser |
| [`test_parse.js`](test_parse.js) | Verification script for data parsing validation |

---

## 🚀 How to Run

- **Windows Batch File:** Double click [`run_web_app.bat`](run_web_app.bat).
- **Direct Browser:** Right-click [`index.html`](index.html) and select **Open with** -> **Google Chrome** or **Microsoft Edge**.
