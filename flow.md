# Flow Aplikasi Dashboard IT Project Management

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│                                                          │
│  dashboard.html ──► js/config.js (URL GAS)               │
│                 ──► js/sheets-api.js (fetch ke GAS)       │
│                 ──► js/tasks.js, kpi.js, evm.js, dll.     │
│                 ──► js/utils.js (formatting)              │
│                 ──► js/dashboard.js (overview charts)     │
│                                                           │
│  index.html = Welcome/Landing page → link ke dashboard    │
│  Semua CRUD via SheetsAPI → fetch(CONFIG.GAS_URL)         │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP GET / POST
                       ▼
┌─────────────────────────────────────────────────────────┐
│           GOOGLE APPS SCRIPT (Web App)                   │
│                                                          │
│  gas-script.js:                                          │
│    doGet(e)  → action=getData → getData()                │
│    doPost(e) → addRow / updateRow / deleteRow            │
│    autoCalculate() → auto Skor, Status, dll.             │
│                                                          │
│  seed-data.js → seedAllData() (isi data sample)          │
└──────────────────────┬──────────────────────────────────┘
                       │ Google Sheets API
                       ▼
┌─────────────────────────────────────────────────────────┐
│              GOOGLE SPREADSHEET                          │
│                                                          │
│  Sheet: Tasks | KPI | EVM | Risk | Budget | Milestone    │
│  Baris 1 = Header, Baris 2+ = Data                      │
└─────────────────────────────────────────────────────────┘
```

## Flow CRUD (Create / Read / Update / Delete)

### READ (Load Data)
```
User buka dashboard.html
  → DashboardController.init()
    → DashboardController.loadAllModules()
      → Promise.all([TasksModule.load(), KPIModule.load(), ...])
        → SheetsAPI.readSheet('Tasks')
          → GET https://script.google.com/macros/s/xxx/exec?action=getData&sheet=Tasks
            → GAS doGet(e) → getData('Tasks')
              → SpreadsheetApp.openById(SPREADSHEET_ID)
              → sheet.getDataRange().getValues()
              → sheetToObjects() → convert rows ke array of objects
              → Return JSON { success: true, data: [...] }
          → Return array of objects
        → TasksModule.render() → render table + charts
```

### CREATE (Tambah Data)
```
User klik "Tambah" → form modal muncul (openAddModal)
  → User isi form → klik "Simpan"
    → handleFormSubmit()
      → SheetsAPI.appendRow('Tasks', { ID: 'T-101', Nama: '...', ... })
        → POST https://script.google.com/macros/s/xxx/exec
          → Body (JSON): { action: 'addRow', sheet: 'Tasks', data: {...} }
          → Content-Type: text/plain;charset=utf-8
            → GAS doPost(e) → JSON.parse(e.postData.contents)
            → addRow('Tasks', rowData)
              → autoCalculate() → hitung field otomatis (Skor, Status, dll)
              → sheet.appendRow(rowValues)
              → Return { success: true }
        → DashboardController.loadAllModules() → refresh semua data
```

### UPDATE (Edit Data)
```
User klik "Edit" → form modal muncul dengan data existing (openEditModal)
  → User ubah form → klik "Simpan"
    → handleFormSubmit()
      → SheetsAPI.updateRow('Tasks', 'T-101', { Progress: '0.80', Status: 'Dalam Proses' })
        → POST https://script.google.com/macros/s/xxx/exec
          → Body (JSON): { action: 'updateRow', sheet: 'Tasks', rowId: 'T-101', data: {...} }
          → Content-Type: text/plain;charset=utf-8
            → GAS doPost(e) → JSON.parse(e.postData.contents)
            → updateRow('Tasks', 'T-101', rowData)
              → autoCalculate() → hitung field otomatis
              → findRowIndex() → cari baris berdasarkan ID column
              → sheet.getRange(rowIndex, colIndex + 1).setValue() → update per kolom
              → Return { success: true }
        → DashboardController.loadAllModules() → refresh semua data
```

### DELETE (Hapus Data)
```
User klik "Hapus" → confirm dialog
  → deleteItem('Tasks', 'T-101')
    → SheetsAPI.deleteRow('Tasks', 'T-101')
      → POST https://script.google.com/macros/s/xxx/exec
        → Body (JSON): { action: 'deleteRow', sheet: 'Tasks', rowId: 'T-101' }
        → Content-Type: text/plain;charset=utf-8
          → GAS doPost(e) → JSON.parse(e.postData.contents)
          → deleteRow('Tasks', 'T-101')
            → findRowIndex() → cari baris berdasarkan ID column
            → sheet.deleteRow(rowIndex)
            → Return { success: true }
      → DashboardController.loadAllModules() → refresh semua data
```

## Cara Kerja Komunikasi Frontend ↔ Google Sheets

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND (Browser)                                          │
│                                                              │
│  READ:  GET  {GAS_URL}?action=getData&sheet=Tasks            │
│  WRITE: POST {GAS_URL}                                       │
│         Body: { action: 'addRow'|'updateRow'|'deleteRow',    │
│                 sheet: 'SheetName',                           │
│                 data: {...},     ← untuk add/update           │
│                 rowId: 'ID' }    ← untuk update/delete       │
│         Header: Content-Type: text/plain;charset=utf-8       │
│                                                              │
│  ⚠️ GAS Web App TIDAK support Content-Type: application/json │
│     Gunakan text/plain;charset=utf-8 lalu parse di GAS       │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  GOOGLE APPS SCRIPT (Web App)                                │
│                                                              │
│  doGet(e)  → e.parameter.action === 'getData'                │
│            → getData(e.parameter.sheet)                      │
│            → Return JSON via ContentService                  │
│                                                              │
│  doPost(e) → JSON.parse(e.postData.contents)                 │
│            → action: 'addRow'    → addRow(sheet, data)       │
│            → action: 'updateRow' → updateRow(sheet, id, data)│
│            → action: 'deleteRow' → deleteRow(sheet, id)      │
│            → Return JSON via ContentService                  │
│                                                              │
│  autoCalculate() → Skor, Status, dll (server-side)           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  GOOGLE SPREADSHEET                                          │
│                                                              │
│  Sheet: Tasks | KPI | EVM | Risk | Budget | Milestone        │
│  Baris 1 = Header, Baris 2+ = Data                           │
└──────────────────────────────────────────────────────────────┘
```

## Mapping Sheet → Module → Kolom

| Sheet     | Module        | Kolom Header                                          | ID Column   |
|-----------|---------------|-------------------------------------------------------|-------------|
| Tasks     | TasksModule   | ID, Nama, Progress, Status, PIC                       | ID          |
| KPI       | KPIModule     | ID, Nama, Target, Aktual, Status                      | ID          |
| EVM       | EVMModule     | ID, PV, EV, AC, Tanggal                               | ID          |
| Risk      | RiskModule    | ID, Risiko, Likelihood, Impact, Skor, Mitigasi        | ID          |
| Budget    | BudgetModule  | Kategori, Planned, Actual, Status                      | Kategori    |
| Milestone | MilestoneModule | Milestone, Target, Realisasi, Status                | Milestone   |

## Auto-Calculate (Server-side di GAS)

Beberapa field dihitung otomatis oleh GAS saat add/update:

| Sheet    | Field Otomatis | Rumus                                                    |
|----------|----------------|----------------------------------------------------------|
| Risk     | Skor           | Likelihood × Impact                                       |
| Budget   | Status         | actual > planned → Overbudget, actual > 90% → Warning, else Normal |
| KPI      | Status         | aktual/target ≥ 1.0 → On Track, ≥ 0.9 → At Risk, else Critical |
| Milestone| Status         | realisasi ≤ target → On Track, ≤7 hari → Delay, else Critical Delay |

## Cara Setup

### 1. Buat Google Spreadsheet
- Buat spreadsheet baru di Google Sheets
- Buat 6 sheet: **Tasks**, **KPI**, **EVM**, **Risk**, **Budget**, **Milestone**
- Isi baris pertama (header) sesuai kolom di tabel mapping di atas

### 2. Deploy Google Apps Script
1. Buka https://script.google.com
2. Klik **New Project**
3. Hapus kode default, paste isi `gas-script.js`
4. Ganti `YOUR_SPREADSHEET_ID` dengan ID spreadsheet Anda
   (ID ada di URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`)
5. Klik **Deploy** → **New deployment**
6. Pilih type: **Web app**
7. Execute as: **Me**
8. Who has access: **Anyone**
9. Klik **Deploy**, salin URL yang muncul

### 3. Isi Data Sample (Seeder)
1. Buka project GAS yang sama
2. Paste isi `seed-data.js` di bawah kode gas-script.js
3. Jalankan fungsi **seedAllData()** dari editor GAS
   - Pilih fungsi `seedAllData` di dropdown → klik Run
   - Berikan izin saat diminta (pertama kali saja)
4. Hapus kode seeder setelah selesai (copy-paste ke file terpisah jika perlu)

### 4. Konfigurasi Frontend
1. Buka `js/config.js`
2. Ganti `YOUR_GAS_URL` dengan URL deployment GAS Anda
3. Buka `index.html` di browser

### 5. Struktur File
```
itpm_apps/
├── index.html              ← Halaman welcome/landing page
├── dashboard.html          ← Dashboard utama (gabungan semua modul)
├── gas-script.js           ← Kode GAS untuk deploy ke script.google.com
├── seed-data.js            ← Seeder data sample (paste ke GAS, jalankan, lalu hapus)
├── flow.md                 ← Dokumentasi flow ini
├── css/
│   └── style.css           ← Style aplikasi
└── js/
    ├── config.js           ← Konfigurasi (GAS_URL, SHEETS mapping)
    ├── sheets-api.js       ← API layer (fetch ke GAS)
    ├── utils.js            ← Utility functions
    ├── tasks.js            ← Module Tasks
    ├── kpi.js              ← Module KPI
    ├── evm.js              ← Module EVM
    ├── risk.js             ← Module Risk
    ├── budget.js           ← Module Budget
    ├── milestone.js        ← Module Milestone
    └── dashboard.js        ← Module Dashboard Overview
```

## Flow Navigasi Aplikasi

```
index.html (load) → User klik "Buka Dashboard"
  → dashboard.html (load)
    → DashboardController.init()
    → DashboardController.loadAllModules()
      ├── TasksModule.load() → render table + chart
      ├── KPIModule.load() → render table + chart
      ├── EVMModule.load() → render table + chart
      ├── RiskModule.load() → render table + heatmap
      ├── BudgetModule.load() → render table + chart
      └── MilestoneModule.load() → render table + chart
    → DashboardController.render()
      ├── Ringkasan Status Proyek
      ├── Progress Tasks (pie chart)
      ├── Budget Summary
      ├── Risk Level
      └── Milestone Timeline
```

## Flow Error Handling

```
SheetsAPI.readSheet(sheetName)
  → fetch gagal / GAS error
    → alert('Gagal mengambil data dari Google Sheets')
    → Return getMockData(sheetName) → fallback ke mock data lokal

SheetsAPI.appendRow() / updateRow() / deleteRow()
  → fetch gagal
    → alert('Gagal menghubungi server')
    → appendRow: saveLocalBackup() → simpan ke localStorage
  → fetch berhasil, success: false
    → alert(message dari GAS)
  → fetch berhasil, success: true
    → Return true
    → DashboardController.loadAllModules() → refresh semua data