/**
 * Antibiotics CRM Expiry Reminder System
 * Logic for 1-Month Prior Expiry Alerts, Search, Calendar Sync & Excel Management
 */

// Application State
let crmData = [];
let activeFilter = 'all';
let searchQuery = '';
let selectedStorage = '';
let currentSort = 'expiry_asc';
let currentView = 'table';
let reminderThresholdDays = 30; // 1 month before expiry
let audioContext = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  renderDashboard();
  checkAndNotifyReminders(false);
});

// Load Data from LocalStorage or preloaded initial crm_data.js
function loadData() {
  const saved = localStorage.getItem('antibiotics_crm_data_v1');
  if (saved) {
    try {
      crmData = JSON.parse(saved);
      // Merge bundled CoA metadata (e.g. Sarafloxacin Certificate of Analysis)
      if (typeof INITIAL_CRM_DATA !== 'undefined') {
        INITIAL_CRM_DATA.forEach(initItem => {
          if (initItem.coaUrl) {
            const match = crmData.find(c => c.id === initItem.id || (c.code === initItem.code && c.batchNo === initItem.batchNo));
            if (match) {
              match.coaUrl = initItem.coaUrl;
              match.coaFileName = initItem.coaFileName;
            }
          }
        });
      }
    } catch (e) {
      console.error('Error loading saved data:', e);
      crmData = [...INITIAL_CRM_DATA];
    }
  } else if (typeof INITIAL_CRM_DATA !== 'undefined') {
    crmData = [...INITIAL_CRM_DATA];
  } else {
    crmData = [];
  }

  // Ensure all items have computed dates
  refreshCalculations();
}

function saveData() {
  localStorage.setItem('antibiotics_crm_data_v1', JSON.stringify(crmData));
  refreshCalculations();
  renderDashboard();
}

// Robust Date Parsing
function parseDateString(rawVal) {
  if (!rawVal) return null;
  const s = String(rawVal).trim();
  
  // Excel Serial Number check (e.g. 47489)
  if (/^\d{4,5}$/.test(s)) {
    const serial = parseFloat(s);
    if (serial > 30000 && serial < 60000) {
      const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return d.toISOString().split('T')[0];
    }
  }

  // Normalize delimiters (space, slash, dash to dot)
  const norm = s.replace(/\s+/g, '.').replace(/[\/-]/g, '.');

  // Match DD.MM.YYYY or D.M.YYYY
  let m = norm.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }

  // Match DD.MM.YY (2-digit year)
  m = norm.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    let y = parseInt(m[3], 10);
    y = y < 50 ? 2000 + y : 1900 + y;
    return `${y}-${mo}-${d}`;
  }

  // Match YYYY-MM-DD
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }

  return null;
}

// Recompute days left, 1-month reminder date, and status category for each item
function refreshCalculations() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  crmData.forEach(item => {
    // Standardize ISO expiry date
    if (!item.expiryDate && item.rawExpiry) {
      item.expiryDate = parseDateString(item.rawExpiry);
    }

    if (item.expiryDate) {
      const expDate = new Date(item.expiryDate + 'T00:00:00');
      
      // Calculate 1 month prior reminder date (subtract 1 month or 30 days)
      const remDate = new Date(expDate);
      remDate.setMonth(remDate.getMonth() - 1);
      item.reminderDate = remDate.toISOString().split('T')[0];

      // Diff in days from today to Expiry Date
      const diffMs = expDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      item.daysLeft = daysLeft;

      // Classify status
      if (daysLeft < 0) {
        item.status = 'expired';
        item.statusLabel = 'Expired';
      } else if (daysLeft <= reminderThresholdDays) {
        item.status = 'urgent';
        item.statusLabel = 'Reminder Active (< 30d)';
      } else if (daysLeft <= 60) {
        item.status = 'upcoming';
        item.statusLabel = 'Next Month (31-60d)';
      } else {
        item.status = 'safe';
        item.statusLabel = 'Valid / Safe';
      }
    } else {
      item.daysLeft = null;
      item.status = 'unknown';
      item.statusLabel = 'No Date';
    }
  });
}

// Render Dashboard View
function renderDashboard() {
  updateStatsCounters();
  renderAlertBanner();
  renderItemsList();
  document.getElementById('footerTotal').textContent = crmData.length;
}

// Compute counts and update KPI cards & tabs
function updateStatsCounters() {
  const counts = {
    all: crmData.length,
    urgent: 0,
    upcoming: 0,
    expired: 0,
    safe: 0
  };

  crmData.forEach(item => {
    if (item.status === 'urgent') counts.urgent++;
    else if (item.status === 'upcoming') counts.upcoming++;
    else if (item.status === 'expired') counts.expired++;
    else if (item.status === 'safe') counts.safe++;
  });

  document.getElementById('statTotal').textContent = counts.all;
  document.getElementById('statUrgent').textContent = counts.urgent;
  document.getElementById('statUpcoming').textContent = counts.upcoming;
  document.getElementById('statExpired').textContent = counts.expired;
  document.getElementById('statSafe').textContent = counts.safe;

  document.getElementById('tabCountAll').textContent = counts.all;
  document.getElementById('tabCountUrgent').textContent = counts.urgent;
  document.getElementById('tabCountUpcoming').textContent = counts.upcoming;
  document.getElementById('tabCountExpired').textContent = counts.expired;
  document.getElementById('tabCountSafe').textContent = counts.safe;
}

// Alert Banner logic
function renderAlertBanner() {
  const banner = document.getElementById('reminderBanner');
  const bannerTitle = document.getElementById('bannerTitle');
  const bannerDesc = document.getElementById('bannerDesc');
  const bannerIcon = document.getElementById('bannerIcon');
  const bannerAction = document.getElementById('btnBannerAction');

  const urgentCount = crmData.filter(i => i.status === 'urgent').length;
  const expiredCount = crmData.filter(i => i.status === 'expired').length;

  if (urgentCount > 0) {
    banner.style.display = 'flex';
    banner.className = 'reminder-banner';
    bannerIcon.textContent = '⚠️';
    bannerTitle.textContent = `Immediate Attention: ${urgentCount} Antibiotic CRM Standards within 1-Month Expiry Window!`;
    bannerDesc.textContent = `Action required: arrange re-qualification, testing, or procurement before expiration.`;
    bannerAction.textContent = `View ${urgentCount} Due Items`;
    bannerAction.onclick = () => setFilter('urgent');
  } else if (expiredCount > 0) {
    banner.style.display = 'flex';
    banner.className = 'reminder-banner danger';
    bannerIcon.textContent = '🚨';
    bannerTitle.textContent = `Notice: ${expiredCount} Antibiotic CRM Standards are Expired`;
    bannerDesc.textContent = `Review and quarantine expired reference materials to ensure laboratory compliance.`;
    bannerAction.textContent = `Review ${expiredCount} Expired Standards`;
    bannerAction.onclick = () => setFilter('expired');
  } else {
    banner.style.display = 'none';
  }
}

// Filter and Sort Items
function getFilteredItems() {
  return crmData.filter(item => {
    // Filter by tab / status
    if (activeFilter === 'urgent' && item.status !== 'urgent') return false;
    if (activeFilter === 'upcoming' && item.status !== 'upcoming') return false;
    if (activeFilter === 'expired' && item.status !== 'expired') return false;
    if (activeFilter === 'safe' && item.status !== 'safe') return false;

    // Filter by storage
    if (selectedStorage) {
      const storageStr = (item.storage || '').toLowerCase();
      if (!storageStr.includes(selectedStorage)) return false;
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const code = (item.code || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const cas = (item.casNo || '').toLowerCase();
      const batch = (item.batchNo || '').toLowerCase();
      const make = (item.make || '').toLowerCase();
      const cat = (item.catalogNo || '').toLowerCase();
      if (!code.includes(q) && !name.includes(q) && !cas.includes(q) && !batch.includes(q) && !make.includes(q) && !cat.includes(q)) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    switch (currentSort) {
      case 'expiry_asc':
        return (a.expiryDate || '9999') > (b.expiryDate || '9999') ? 1 : -1;
      case 'expiry_desc':
        return (a.expiryDate || '0000') < (b.expiryDate || '0000') ? 1 : -1;
      case 'days_asc':
        return (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999);
      case 'name_asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'code_asc':
        return (a.code || '').localeCompare(b.code || '');
      default:
        return 0;
    }
  });
}

// Render Table and Card Views
function renderItemsList() {
  const items = getFilteredItems();
  const tableBody = document.getElementById('crmTableBody');
  const cardsContainer = document.getElementById('cardsViewContainer');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('tableViewContainer');

  if (items.length === 0) {
    emptyState.style.display = 'block';
    tableContainer.style.display = 'none';
    cardsContainer.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';

  if (currentView === 'table') {
    tableContainer.style.display = 'block';
    cardsContainer.style.display = 'none';
    renderTableView(items, tableBody);
  } else {
    tableContainer.style.display = 'none';
    cardsContainer.style.display = 'grid';
    renderCardsView(items, cardsContainer);
  }
}

// Table View Renderer
function renderTableView(items, tbody) {
  tbody.innerHTML = '';

  items.forEach(item => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = (e) => {
      if (e.target.closest('button')) return;
      showItemDetails(item);
    };

    let badgeClass = 'badge-safe';
    let badgeIcon = '🟢';
    if (item.status === 'expired') {
      badgeClass = 'badge-expired';
      badgeIcon = '🚨';
    } else if (item.status === 'urgent') {
      badgeClass = 'badge-urgent';
      badgeIcon = '⚠️';
    } else if (item.status === 'upcoming') {
      badgeClass = 'badge-upcoming';
      badgeIcon = '⏳';
    }

    let daysText = '';
    if (item.daysLeft !== null) {
      if (item.daysLeft < 0) {
        daysText = `<span style="color:#dc2626; font-weight:700;">${Math.abs(item.daysLeft)} days ago</span>`;
      } else if (item.daysLeft === 0) {
        daysText = `<span style="color:#ea580c; font-weight:700;">Expires Today!</span>`;
      } else {
        daysText = `<span class="days-count">${item.daysLeft} days left</span>`;
      }
    }

    tr.innerHTML = `
      <td><span class="item-code">${item.code || '-'}</span></td>
      <td>
        <div class="item-name">${escapeHtml(item.name || 'Unnamed Standard')}</div>
        <div class="item-formula">${escapeHtml(item.formula || '')} ${item.mw ? `&bull; MW ${item.mw}` : ''}</div>
        ${item.coaUrl ? `
          <div style="margin-top: 3px;">
            <a href="${item.coaUrl}" target="_blank" rel="noopener noreferrer" class="coa-table-tag" onclick="event.stopPropagation();" title="Open Certificate of Analysis (CoA) PDF Preview on OneDrive" style="display:inline-flex; align-items:center; gap:4px; font-size:0.73rem; color:#1d4ed8; background:#eff6ff; border:1px solid #bfdbfe; padding:1px 6px; border-radius:4px; font-weight:600; text-decoration:none;">
              📜 CoA Preview
            </a>
          </div>
        ` : ''}
      </td>
      <td><code style="font-size:0.8rem; color:#475569;">${escapeHtml(item.casNo || '-')}</code></td>
      <td>
        <div style="font-weight:600; font-size:0.82rem;">${escapeHtml(item.make || '-')}</div>
        <div style="font-size:0.75rem; color:#64748b;">Lot: ${escapeHtml(item.batchNo || '-')}</div>
      </td>
      <td><span class="temp-tag">${escapeHtml(item.storage || 'Room Temp')}</span></td>
      <td>
        <div style="font-weight:600; color:#b45309; font-size:0.83rem;">🔔 ${item.reminderDate || '-'}</div>
        <div style="font-size:0.72rem; color:#92400e;">1 Mo. Notice</div>
      </td>
      <td>
        <div style="font-weight:700; font-size:0.86rem; color:#0f172a;">${item.expiryDate || item.rawExpiry || '-'}</div>
      </td>
      <td>
        <div class="badge ${badgeClass}">${badgeIcon} ${item.statusLabel}</div>
        <div style="font-size:0.75rem; margin-top:2px;">${daysText}</div>
      </td>
      <td style="text-align: right; white-space: nowrap;">
        ${item.coaUrl ? `<a href="${item.coaUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="padding: 0.3rem 0.55rem; font-size: 0.78rem; color:#1d4ed8; border-color:#93c5fd; background:#eff6ff; text-decoration:none; margin-right:4px;" title="Open Certificate of Analysis (CoA) PDF Preview" onclick="event.stopPropagation();">📜 CoA</a>` : ''}
        <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="showItemDetailsById(${item.id})">Details</button>
        <button class="btn btn-outline" style="padding: 0.3rem 0.5rem; font-size: 0.78rem;" title="Download Calendar Reminder (.ics)" onclick="exportSingleEvent(${item.id})">📅</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Cards View Renderer
function renderCardsView(items, container) {
  container.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = `crm-card border-${item.status}`;
    card.onclick = (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      showItemDetails(item);
    };

    let badgeClass = 'badge-safe';
    let badgeIcon = '🟢';
    if (item.status === 'expired') { badgeClass = 'badge-expired'; badgeIcon = '🚨'; }
    else if (item.status === 'urgent') { badgeClass = 'badge-urgent'; badgeIcon = '⚠️'; }
    else if (item.status === 'upcoming') { badgeClass = 'badge-upcoming'; badgeIcon = '⏳'; }

    let daysText = item.daysLeft !== null 
      ? (item.daysLeft < 0 ? `Expired ${Math.abs(item.daysLeft)}d ago` : `${item.daysLeft} days remaining`) 
      : 'No date';

    card.innerHTML = `
      <div class="crm-card-header">
        <span class="item-code">${item.code || '-'}</span>
        <div class="badge ${badgeClass}">${badgeIcon} ${item.statusLabel}</div>
      </div>
      <div class="crm-card-title">${escapeHtml(item.name || 'Unnamed')}</div>
      <div class="crm-card-body">
        <div class="card-row">
          <span>CAS No:</span>
          <strong>${escapeHtml(item.casNo || '-')}</strong>
        </div>
        <div class="card-row">
          <span>Make / Lot:</span>
          <strong>${escapeHtml(item.make || '-')} (${escapeHtml(item.batchNo || '-')})</strong>
        </div>
        <div class="card-row">
          <span>Storage:</span>
          <span class="temp-tag">${escapeHtml(item.storage || 'Room')}</span>
        </div>
        ${item.coaUrl ? `
          <div style="margin-top:0.4rem;">
            <a href="${item.coaUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="width:100%; display:inline-flex; justify-content:center; align-items:center; gap:5px; padding:0.32rem 0.6rem; font-size:0.77rem; color:#1d4ed8; border-color:#93c5fd; background:#eff6ff; text-decoration:none; font-weight:600;" onclick="event.stopPropagation();" title="Open Certificate of Analysis (CoA) PDF Preview">
              📜 Certificate of Analysis (PDF)
            </a>
          </div>
        ` : ''}
      </div>
      <div class="reminder-highlight-box">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:3px;">
          <span style="color:#78350f; font-weight:600;">🔔 1-Mo. Reminder:</span>
          <strong>${item.reminderDate || '-'}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700;">
          <span>Expiry Date:</span>
          <span>${item.expiryDate || item.rawExpiry || '-'}</span>
        </div>
        <div style="text-align:right; font-size:0.75rem; color:#64748b; margin-top:2px;">
          ${daysText}
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.4rem; margin-top:0.75rem;">
        <button class="btn btn-outline" style="padding:0.25rem 0.55rem; font-size:0.76rem;" onclick="exportSingleEvent(${item.id})">📅 .ics</button>
        <button class="btn btn-outline" style="padding:0.25rem 0.55rem; font-size:0.76rem;" onclick="showItemDetailsById(${item.id})">Details &rarr;</button>
      </div>
    `;

    container.appendChild(card);
  });
}

// Event Listeners Setup
function setupEventListeners() {
  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderItemsList();
  });

  // Storage Filter
  document.getElementById('storageFilter').addEventListener('change', (e) => {
    selectedStorage = e.target.value;
    renderItemsList();
  });

  // Sort
  document.getElementById('sortBy').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderItemsList();
  });

  // Tab navigation
  document.querySelectorAll('.tab-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      setFilter(pill.dataset.tab);
    });
  });

  // KPI Card clicks
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      setFilter(card.dataset.filter);
    });
  });

  // View switcher
  document.getElementById('btnViewTable').addEventListener('click', () => {
    currentView = 'table';
    document.getElementById('btnViewTable').classList.add('active');
    document.getElementById('btnViewCards').classList.remove('active');
    renderItemsList();
  });

  document.getElementById('btnViewCards').addEventListener('click', () => {
    currentView = 'cards';
    document.getElementById('btnViewCards').classList.add('active');
    document.getElementById('btnViewTable').classList.remove('active');
    renderItemsList();
  });

  // Notification Button
  document.getElementById('btnEnableNotifications').addEventListener('click', requestNotificationPermission);

  // Calendar Sync Button
  document.getElementById('btnExportCalendar').addEventListener('click', exportAllCalendarEvents);

  // Excel Import Button
  document.getElementById('btnImportExcel').addEventListener('click', () => {
    document.getElementById('importModal').classList.add('open');
  });
  document.getElementById('closeImportModal').addEventListener('click', () => {
    document.getElementById('importModal').classList.remove('open');
  });
  document.getElementById('btnCancelImport').addEventListener('click', () => {
    document.getElementById('importModal').classList.remove('open');
  });

  // Excel Export Button
  document.getElementById('btnExportExcel').addEventListener('click', exportToExcel);

  // App Updates Button
  const btnCheckUpdates = document.getElementById('btnCheckUpdates');
  if (btnCheckUpdates) {
    btnCheckUpdates.addEventListener('click', () => {
      if (window.AndroidBridge && window.AndroidBridge.openUpdateScreen) {
        window.AndroidBridge.openUpdateScreen();
      } else {
        window.open('https://github.com/mettexlab/app/releases', '_blank');
      }
    });
  }

  // Print Report Button
  document.getElementById('btnPrintReport').addEventListener('click', () => {
    window.print();
  });

  // Add Item Button
  document.getElementById('btnAddItem').addEventListener('click', () => {
    openAddEditModal();
  });
  document.getElementById('closeAddModal').addEventListener('click', () => {
    document.getElementById('addModal').classList.remove('open');
  });
  document.getElementById('btnCancelAdd').addEventListener('click', () => {
    document.getElementById('addModal').classList.remove('open');
  });

  // Form Submission
  document.getElementById('crmForm').addEventListener('submit', handleFormSubmit);

  // Detail Modal Controls
  document.getElementById('closeDetailModal').addEventListener('click', () => {
    document.getElementById('detailModal').classList.remove('open');
  });
  document.getElementById('btnModalClose').addEventListener('click', () => {
    document.getElementById('detailModal').classList.remove('open');
  });

  // Drag and drop Excel upload
  setupDragAndDrop();

  // Reset default data
  document.getElementById('btnResetDefaultData').addEventListener('click', () => {
    if (confirm('Reset inventory back to original bundled 178 Antibiotic CRM standards?')) {
      localStorage.removeItem('antibiotics_crm_data_v1');
      loadData();
      renderDashboard();
      document.getElementById('importModal').classList.remove('open');
      showToast('Reset to original CRM dataset successfully!', 'toast-success');
    }
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    }
  });
}

function setFilter(filterKey) {
  activeFilter = filterKey;

  // Update tabs active state
  document.querySelectorAll('.tab-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.tab === filterKey);
  });

  // Update KPI cards active state
  document.querySelectorAll('.stat-card').forEach(card => {
    card.classList.toggle('active', card.dataset.filter === filterKey);
  });

  renderItemsList();
}

// Drag & Drop / File Input for Excel
function setupDragAndDrop() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('excelFileInput');

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      processExcelFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      processExcelFile(e.target.files[0]);
    }
  });
}

// Parse uploaded Excel with SheetJS
function processExcelFile(file) {
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    showToast('Please upload a valid Excel (.xlsx / .xls) file.', 'toast-danger');
    return;
  }

  showToast(`Parsing ${file.name}...`, 'toast-warning');

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rawRows.length < 2) {
        showToast('The uploaded sheet is empty or has no data rows.', 'toast-danger');
        return;
      }

      // Map headers from row 0
      const headerRow = rawRows[0] || [];
      let codeCol = 0, nameCol = 1, casCol = 2, qtyCol = 3, makeCol = 4;
      let catCol = 5, batchCol = 6, mwCol = 7, formulaCol = 8, purityCol = 9;
      let expCol = 10, storageCol = 11, recDateCol = 12, remarkCol = 13;

      // Smart header detector
      headerRow.forEach((h, idx) => {
        const text = String(h || '').trim().toLowerCase();
        if (text.includes('code')) codeCol = idx;
        else if (text.includes('name')) nameCol = idx;
        else if (text.includes('cas')) casCol = idx;
        else if (text.includes('expir')) expCol = idx;
        else if (text.includes('make')) makeCol = idx;
        else if (text.includes('batch') || text.includes('lot')) batchCol = idx;
        else if (text.includes('catalog') || text.includes('product')) catCol = idx;
        else if (text.includes('storage')) storageCol = idx;
        else if (text.includes('purity')) purityCol = idx;
      });

      const parsedItems = [];
      let idCounter = 1;

      for (let r = 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0) continue;

        const code = String(row[codeCol] || '').trim();
        const name = String(row[nameCol] || '').trim();
        const rawExp = String(row[expCol] || '').trim();

        if (!code && !name && !rawExp) continue;

        parsedItems.push({
          id: idCounter++,
          code: code,
          name: name,
          casNo: String(row[casCol] || '').trim(),
          quantity: String(row[qtyCol] || '').trim(),
          make: String(row[makeCol] || '').trim(),
          catalogNo: String(row[catCol] || '').trim(),
          batchNo: String(row[batchCol] || '').trim(),
          mw: String(row[mwCol] || '').trim(),
          formula: String(row[formulaCol] || '').trim(),
          purity: String(row[purityCol] || '').trim(),
          rawExpiry: rawExp,
          expiryDate: parseDateString(rawExp),
          storage: String(row[storageCol] || '').trim(),
          receivedDate: String(row[recDateCol] || '').trim(),
          remark: String(row[remarkCol] || '').trim()
        });
      }

      if (parsedItems.length === 0) {
        showToast('No valid antibiotic records found in Excel file.', 'toast-danger');
        return;
      }

      crmData = parsedItems;
      saveData();
      document.getElementById('importModal').classList.remove('open');
      showToast(`Successfully imported ${parsedItems.length} Antibiotics CRM standards!`, 'toast-success');
      playNotificationSound();
      checkAndNotifyReminders(true);

    } catch (err) {
      console.error(err);
      showToast(`Error reading Excel: ${err.message}`, 'toast-danger');
    }
  };
  reader.readAsArrayBuffer(file);
}

// Show Item Details Modal
function showItemDetailsById(id) {
  const item = crmData.find(i => i.id === id);
  if (item) showItemDetails(item);
}

function showItemDetails(item) {
  document.getElementById('modalCode').textContent = item.code || 'NO CODE';
  document.getElementById('modalName').textContent = item.name || 'Unnamed Standard';
  document.getElementById('modalReceivedDate').textContent = item.receivedDate || 'Recorded';
  document.getElementById('modalReminderDate').textContent = item.reminderDate || 'N/A';
  document.getElementById('modalExpiryDate').textContent = item.expiryDate || item.rawExpiry || 'N/A';

  const expStep = document.getElementById('modalTimelineExpStep');
  if (item.status === 'expired') {
    expStep.className = 'timeline-step completed';
  } else {
    expStep.className = 'timeline-step';
  }

  // Status alert box in modal
  const alertBox = document.getElementById('modalStatusAlert');
  if (item.status === 'urgent') {
    alertBox.style.display = 'block';
    alertBox.style.background = '#fffbeb';
    alertBox.style.border = '1px solid #fcd34d';
    alertBox.style.color = '#92400e';
    alertBox.innerHTML = `<strong>⚠️ 1-Month Reminder Active:</strong> This reference standard expires in <strong>${item.daysLeft} days</strong>. Initiate re-ordering or validation immediately.`;
  } else if (item.status === 'expired') {
    alertBox.style.display = 'block';
    alertBox.style.background = '#fef2f2';
    alertBox.style.border = '1px solid #fca5a5';
    alertBox.style.color = '#991b1b';
    alertBox.innerHTML = `<strong>🚨 Expired:</strong> Expired on ${item.expiryDate}. Do not use for certified quantitation without re-certification.`;
  } else {
    alertBox.style.display = 'block';
    alertBox.style.background = '#ecfdf5';
    alertBox.style.border = '1px solid #6ee7b7';
    alertBox.style.color = '#065f46';
    alertBox.innerHTML = `<strong>🟢 Standard Valid:</strong> ${item.daysLeft} days of shelf-life remaining until ${item.expiryDate}.`;
  }

  document.getElementById('modalCas').textContent = item.casNo || '-';
  document.getElementById('modalQuantity').textContent = item.quantity || '-';
  document.getElementById('modalMake').textContent = item.make || '-';
  document.getElementById('modalCatalogNo').textContent = item.catalogNo || '-';
  document.getElementById('modalBatchNo').textContent = item.batchNo || '-';
  document.getElementById('modalMw').textContent = item.mw || '-';
  document.getElementById('modalFormula').textContent = item.formula || '-';
  document.getElementById('modalPurity').textContent = item.purity ? `${item.purity}%` : '-';
  document.getElementById('modalStorage').textContent = item.storage || 'Room Temperature';
  document.getElementById('modalRemark').textContent = item.remark || 'None';

  // Certificate of Analysis (CoA)
  const coaSection = document.getElementById('modalCoaSection');
  const coaLink = document.getElementById('modalCoaLink');
  const btnModalViewCoa = document.getElementById('btnModalViewCoa');
  const modalCoaSubtitle = document.getElementById('modalCoaSubtitle');
  if (item.coaUrl) {
    if (coaSection) coaSection.style.display = 'block';
    if (coaLink) coaLink.href = item.coaUrl;
    if (btnModalViewCoa) {
      btnModalViewCoa.style.display = 'inline-flex';
      btnModalViewCoa.href = item.coaUrl;
    }
    if (modalCoaSubtitle) {
      modalCoaSubtitle.textContent = `Verified PDF: ${item.coaFileName || 'Sarafloxacin.pdf'} (OneDrive: App/coa)`;
    }
  } else {
    if (coaSection) coaSection.style.display = 'none';
    if (btnModalViewCoa) btnModalViewCoa.style.display = 'none';
  }

  document.getElementById('btnModalAddSingleCal').onclick = () => exportSingleEvent(item.id);
  document.getElementById('btnModalEdit').onclick = () => {
    document.getElementById('detailModal').classList.remove('open');
    openAddEditModal(item);
  };

  document.getElementById('detailModal').classList.add('open');
}

// Add / Edit Modal
function openAddEditModal(item = null) {
  const form = document.getElementById('crmForm');
  form.reset();

  if (item) {
    document.getElementById('addModalTitle').textContent = `Edit CRM: ${item.code || item.name}`;
    document.getElementById('formId').value = item.id;
    document.getElementById('formCode').value = item.code || '';
    document.getElementById('formName').value = item.name || '';
    document.getElementById('formExpiryDate').value = item.expiryDate || '';
    document.getElementById('formCas').value = item.casNo || '';
    document.getElementById('formMake').value = item.make || '';
    document.getElementById('formBatch').value = item.batchNo || '';
    document.getElementById('formStorage').value = item.storage || '';
    document.getElementById('formPurity').value = item.purity || '';
    document.getElementById('formRemark').value = item.remark || '';
  } else {
    document.getElementById('addModalTitle').textContent = 'Add Antibiotic CRM Standard';
    document.getElementById('formId').value = '';
  }

  document.getElementById('addModal').classList.add('open');
}

function handleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('formId').value;
  const expVal = document.getElementById('formExpiryDate').value;

  const itemData = {
    code: document.getElementById('formCode').value.trim(),
    name: document.getElementById('formName').value.trim(),
    rawExpiry: expVal,
    expiryDate: expVal,
    casNo: document.getElementById('formCas').value.trim(),
    make: document.getElementById('formMake').value.trim(),
    batchNo: document.getElementById('formBatch').value.trim(),
    storage: document.getElementById('formStorage').value.trim(),
    purity: document.getElementById('formPurity').value.trim(),
    remark: document.getElementById('formRemark').value.trim()
  };

  if (id) {
    // Update existing
    const existingIndex = crmData.findIndex(i => i.id === parseInt(id, 10));
    if (existingIndex !== -1) {
      crmData[existingIndex] = { ...crmData[existingIndex], ...itemData };
      showToast('Antibiotic CRM standard updated successfully!', 'toast-success');
    }
  } else {
    // Add new
    const newId = crmData.length > 0 ? Math.max(...crmData.map(i => i.id || 0)) + 1 : 1;
    crmData.push({ id: newId, ...itemData });
    showToast('New Antibiotic CRM standard added!', 'toast-success');
  }

  saveData();
  document.getElementById('addModal').classList.remove('open');
}

// Browser Push Notification Engine
function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Web Notifications are not supported in this browser.', 'toast-warning');
    return;
  }

  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      document.getElementById('notificationBtnText').textContent = 'Alerts Active';
      showToast('Notifications enabled! You will be alerted for 1-month expirations.', 'toast-success');
      playNotificationSound();
      checkAndNotifyReminders(true);
    } else {
      showToast('Notification permission was denied.', 'toast-warning');
    }
  });
}

function checkAndNotifyReminders(forceShow = false) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const urgentItems = crmData.filter(i => i.status === 'urgent');
  if (urgentItems.length === 0 && !forceShow) return;

  if (urgentItems.length > 0) {
    const title = `⚠️ Antibiotics CRM Expiry Reminder (${urgentItems.length} Items)`;
    const body = `${urgentItems.length} antibiotic reference standards are expiring within 30 days! Top: ${urgentItems.slice(0, 3).map(i => i.name).join(', ')}`;

    new Notification(title, {
      body: body,
      icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="30" fill="%23f59e0b"/><text x="32" y="44" font-size="34" text-anchor="middle" fill="white">!</text></svg>'
    });
  } else if (forceShow) {
    new Notification('Antibiotics CRM Reminder Status', {
      body: 'All active standards have more than 30 days of shelf life. Zero urgent actions currently required.'
    });
  }
}

// Web Audio API Pleasant Reminder Tone
function playNotificationSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('AudioContext suppressed before interaction');
  }
}

// iCalendar (.ics) Exporter for Reminders
function exportAllCalendarEvents() {
  if (crmData.length === 0) {
    showToast('No items available to export.', 'toast-warning');
    return;
  }

  // Filter items that have a valid reminder date
  const itemsWithReminders = crmData.filter(i => i.reminderDate && i.expiryDate);
  if (itemsWithReminders.length === 0) {
    showToast('No valid reminder dates found.', 'toast-warning');
    return;
  }

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Antibiotics CRM Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Antibiotics CRM Expiry Reminders'
  ];

  itemsWithReminders.forEach(item => {
    icsContent.push(generateIcsVEvent(item));
  });

  icsContent.push('END:VCALENDAR');

  downloadFile('Antibiotics_CRM_1Month_Reminders.ics', 'text/calendar;charset=utf-8', icsContent.join('\r\n'));
  showToast(`Exported ${itemsWithReminders.length} reminder events to calendar file!`, 'toast-success');
}

function exportSingleEvent(id) {
  const item = crmData.find(i => i.id === id);
  if (!item || !item.reminderDate) {
    showToast('Invalid reminder date for this item.', 'toast-warning');
    return;
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Antibiotics CRM Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:CRM Reminder - ${item.name}`,
    generateIcsVEvent(item),
    'END:VCALENDAR'
  ].join('\r\n');

  downloadFile(`CRM_Reminder_${item.code || 'Item'}.ics`, 'text/calendar;charset=utf-8', icsContent);
  showToast(`Calendar reminder exported for ${item.name}!`, 'toast-success');
}

function generateIcsVEvent(item) {
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const remDateStr = item.reminderDate.replace(/-/g, '');
  const expDateStr = item.expiryDate.replace(/-/g, '');

  const summary = `CRM 1-Month Reminder: ${item.name} (${item.code || 'No Code'})`;
  const desc = `Certified Reference Material Expiry Alert\\nItem: ${item.name}\\nCode: ${item.code || '-'}\\nCAS No: ${item.casNo || '-'}\\nMake: ${item.make || '-'}\\nBatch/Lot: ${item.batchNo || '-'}\\nStorage: ${item.storage || '-'}\\n\\nEXPIRES ON: ${item.expiryDate}\\nOne Month Advance Notice to prepare re-ordering or recertification.`;

  return [
    'BEGIN:VEVENT',
    `UID:crm-reminder-${item.id}-${remDateStr}@antibiotics-crm.app`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${remDateStr}`,
    `DTEND;VALUE=DATE:${remDateStr}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:CRM Expiry Notice: ${item.name} expires on ${item.expiryDate}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT'
  ].join('\r\n');
}

// Export to Excel (.xlsx) using SheetJS
function exportToExcel() {
  const items = getFilteredItems();
  if (items.length === 0) {
    showToast('No items to export.', 'toast-warning');
    return;
  }

  const excelRows = items.map(item => ({
    'Code': item.code || '',
    'Antibiotic Name': item.name || '',
    'CAS No.': item.casNo || '',
    'Quantity': item.quantity || '',
    'Make': item.make || '',
    'Catalog No.': item.catalogNo || '',
    'Batch / Lot No.': item.batchNo || '',
    'MW': item.mw || '',
    'Molecular Formula': item.formula || '',
    'Purity %': item.purity || '',
    'EXPIRED DATE': item.expiryDate || item.rawExpiry || '',
    '1-MONTH REMINDER DATE': item.reminderDate || '',
    'Status': item.statusLabel || '',
    'Days Remaining': item.daysLeft ?? '',
    'Storage': item.storage || '',
    'Remark': item.remark || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CRM Reminders');

  XLSX.writeFile(workbook, `Antibiotics_CRM_Expiry_Reminders_${new Date().toISOString().split('T')[0]}.xlsx`);
  showToast(`Exported ${items.length} records to Excel!`, 'toast-success');
}

// File Downloader Helper
function downloadFile(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Toast Notifications
function showToast(message, type = 'toast-info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
