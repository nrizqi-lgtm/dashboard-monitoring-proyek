# 📊 Dokumentasi Dashboard Monitoring Proyek Smart Campus

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│  dashboard.html + js/*.js + css/style.css                │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP GET (JSONP)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Google Apps Script (GAS)                    │
│              gas-script.js (Backend API)                 │
└──────────────────────┬──────────────────────────────────┘
                       │ SpreadsheetApp API
                       ▼
┌─────────────────────────────────────────────────────────┐
│           Google Spreadsheet (Database)                  │
│  Sheet: Tasks | KPI | EVM | Risk | Budget | Milestone   │
└─────────────────────────────────────────────────────────┘
```

---

## Alur Data Lengkap

```
1. User buka dashboard.html
2. DashboardModule.init() dipanggil
3. google.charts.load('current') → load Google Charts
4. DashboardModule.loadAllData() → panggil semua module:
   ├── TasksModule.load()     → SheetsAPI.readSheet('Tasks')     → render table + progress
   ├── KPIModule.load()       → SheetsAPI.readSheet('KPI')       → render table + cards
   ├── EVMModule.load()       → SheetsAPI.readSheet('EVM')       → render metrics + charts
   ├── RiskModule.load()      → SheetsAPI.readSheet('Risk')      → render table + heatmap
   ├── BudgetModule.load()    → SheetsAPI.readSheet('Budget')    → render table + chart
   └── MilestoneModule.load() → SheetsAPI.readSheet('Milestone') → render timeline
5. SheetsAPI.readSheet(sheetName):
   ├── Build JSONP URL: {GAS_URL}?action=read&sheet={name}&callback=SheetsAPI.handleResponse
   ├── Inject <script> tag → trigger HTTP request ke GAS
   ├── GAS baca Google Spreadsheet → return JSON array
   └── Callback function terima data → simpan ke Module.data[] → panggil render()
```

---

## 6 Elemen Dashboard & Sumber Data

### 1️⃣ Progress Proyek (Gauge)

**Lokasi di UI:** Tab Overview → Card pertama "Overall Progress" → SVG Gauge Ring

**Sumber Data:** Sheet **`Tasks`** → field **`Progress`**

**Cara Perhitungan (`tasks.js` → `updateOverviewProgress()`):**
```javascript
// Ambil semua task
totalProgress = Σ (parseFloat(task.Progress))  // Progress dalam desimal 0.0 - 1.0
count = jumlah tasks
avgProgress = (totalProgress / count) * 100     // Konversi ke persen

// Update SVG gauge
circumference = 2 * π * r = 2 * π * 52 = 326.73
offset = circumference - (avgProgress / 100) * circumference
gaugeRingFill.style.strokeDashoffset = offset
gaugeRingValue.innerText = Math.round(avgProgress)
```

**Warna gauge:**
- Hijau: progress ≥ 80%
- Kuning: progress ≥ 50%
- Merah: progress < 50%

**Data Sample (dari seed-data.js):**
| Task | Progress |
|------|----------|
| T-101 Rancangan Database Kampus | 1.00 (100%) |
| T-102 Integrasi API Dashboard | 0.45 (45%) |
| T-103 Modul Presensi Mahasiswa | 0.00 (0%) |
| T-104 Sistem Autentikasi SSO | 0.80 (80%) |
| T-105 Dashboard Monitoring Real-time | 0.30 (30%) |
| T-106 Modul Laporan Akademik | 0.00 (0%) |
| T-107 Integrasi Google Calendar | 0.60 (60%) |
| T-108 Testing & QA Sistem | 0.00 (0%) |
| T-109 Deploy ke Production Server | 0.00 (0%) |
| T-110 Dokumentasi & Training User | 0.10 (10%) |

**Hasil:** (1.0+0.45+0.0+0.8+0.3+0.0+0.6+0.0+0.0+0.1) / 10 = **32.5%**

---

### 2️⃣ KPI (Key Performance Indicators)

**Lokasi di UI:** Tab Overview → Card KPI + Tab "KPI Akademik" → Tabel + Bar Chart

**Sumber Data:** Sheet **`KPI`** → field `ID`, `Nama`, `Target`, `Aktual`, `Status`

**Cara Perhitungan (`kpi.js`):**

> ⚠️ **KPI bersifat INPUT MANUAL** — tidak ada kalkulasi otomatis dari field lain. Status ditentukan oleh user saat input data.

**Display formatting (otomatis):**
```javascript
// Jika nama KPI mengandung "rate" atau "availability" → format persen
if (nama.toLowerCase().includes('rate') || nama.toLowerCase().includes('availability')) {
    display = (parseFloat(aktual) * 100).toFixed(1) + '%'
} else {
    // Selain itu → format milidetik (ms)
    display = parseFloat(aktual).toFixed(1) + ' ms'
}
```

**Badge warna berdasarkan field Status:**
| Status | Warna Badge |
|--------|-------------|
| On Track | 🟢 Hijau |
| At Risk | 🟡 Kuning |
| Critical | 🔴 Merah |

**Data Sample:**
| ID | Nama | Target | Aktual | Status | Format Display |
|----|------|--------|--------|--------|----------------|
| K-01 | Student Attendance Rate | 0.90 | 0.88 | At Risk | 88.0% |
| K-02 | System Availability | 0.99 | 0.995 | On Track | 99.5% |
| K-03 | Data Processing Latency | 1.5 | 2.4 | Critical | 2.4 ms |
| K-04 | User Satisfaction Score | 4.5 | 4.2 | At Risk | 4.2 ms |
| K-05 | Course Completion Rate | 0.85 | 0.87 | On Track | 87.0% |
| K-06 | System Response Time (ms) | 200 | 180 | On Track | 180.0 ms |
| K-07 | Data Accuracy Rate | 0.98 | 0.95 | At Risk | 95.0% |
| K-08 | Monthly Active Users | 5000 | 3200 | Critical | 3200.0 ms |

**Visualisasi:** Bar chart horizontal (Google Charts) menampilkan Target vs Aktual per KPI.

---

### 3️⃣ EVM (Earned Value Management)

**Lokasi di UI:** Tab Overview → Card SV + Card SPI/CPI + Card EAC + Tab "EVM Performa" → Tabel + 3 Chart

**Sumber Data:** Sheet **`EVM`** → field `ID`, `Tanggal`, `PV`, `EV`, `AC`

**Cara Perhitungan (`evm.js` → `calculateMetrics()`):**

Mengambil **baris terakhir** sebagai status terkini:
```javascript
latest = data[data.length - 1]  // Baris terbaru

PV = parseFloat(latest.PV)   // Planned Value
EV = parseFloat(latest.EV)   // Earned Value
AC = parseFloat(latest.AC)   // Actual Cost
BAC = max(PV semua baris)    // Budget at Completion = PV tertinggi
```

**Variance (Selisih):**
```
SV (Schedule Variance) = EV - PV
  → Positif = di depan jadwal ✅
  → Negatif = terlambat ⚠️
  → Nol = tepat waktu

CV (Cost Variance) = EV - AC
  → Positif = di bawah anggaran (hemat) ✅
  → Negatif = over budget ⚠️
  → Nol = sesuai anggaran
```

**Performance Index (Rasio):**
```
SPI (Schedule Performance Index) = EV / PV
  → ≥ 1.0 = on schedule / ahead ✅
  → < 1.0 = behind schedule ⚠️

CPI (Cost Performance Index) = EV / AC
  → ≥ 1.0 = under budget (hemat) ✅
  → < 1.0 = over budget ⚠️
```

**Proyeksi Biaya:**
```
EAC (Estimate at Completion) = BAC / CPI
  → Proyeksi total biaya saat proyek selesai
  → Jika CPI < 1.0 → EAC > BAC (biaya membengkak)
  → Jika CPI > 1.0 → EAC < BAC (hemat)
```

**Data Sample & Perhitungan (baris terakhir: E-06):**
```
PV = Rp 720.000.000
EV = Rp 600.000.000
AC = Rp 580.000.000
BAC = Rp 720.000.000 (max PV)

SV = 600M - 720M = -Rp 120.000.000  → ⚠️ Terlambat
CV = 600M - 580M = +Rp 20.000.000   → ✅ Hemat
SPI = 600M / 720M = 0.83             → ⚠️ Behind schedule
CPI = 600M / 580M = 1.03            → ✅ Under budget
EAC = 720M / 1.03 = Rp 699.029.126  → Proyeksi hemat Rp 21M
```

**Visualisasi:**
1. **Trend Chart** (line chart): PV, EV, AC dari waktu ke waktu (6 bulan)
2. **Performance Indices** (bar chart): SPI dan CPI dengan threshold garis di 1.0
3. **Budget Projection** (column chart): BAC vs EAC

---

### 4️⃣ Risk Status

**Lokasi di UI:** Tab Overview → Card Risk Level + Tab "Manajemen Risiko" → Tabel + Heatmap

**Sumber Data:** Sheet **`Risk`** → field `ID`, `Risiko`, `Likelihood`, `Impact`, `Mitigasi`

**Cara Perhitungan (`risk.js`):**
```javascript
// Score = Likelihood × Impact
score = parseInt(Likelihood) × parseInt(Impact)

// Level determination
if (score >= 12) → High   🔴
if (score >= 6)  → Medium 🟡
if (score < 6)   → Low    🟢
```

**Data Sample & Perhitungan:**
| ID | Risiko | L | I | Score | Level |
|----|--------|---|---|-------|-------|
| R-01 | Keterlambatan integrasi data API | 4 | 4 | **16** | 🔴 High |
| R-02 | Kapasitas server tidak mencukupi | 2 | 5 | **10** | 🟡 Medium |
| R-03 | Kendala izin admin spreadsheet | 3 | 3 | **9** | 🟡 Medium |
| R-04 | Serangan keamanan siber | 2 | 5 | **10** | 🟡 Medium |
| R-05 | Perubahan kebijakan Google API | 3 | 4 | **12** | 🔴 High |
| R-06 | Kurangnya SDM pengembang | 4 | 3 | **12** | 🔴 High |
| R-07 | Gangguan jaringan internet | 3 | 4 | **12** | 🔴 High |
| R-08 | Bug pada modul akademik | 4 | 3 | **12** | 🔴 High |

**Overview Card:** Menampilkan risiko dengan **score tertinggi** → `High (Max: 16)`

**Risk Heatmap:**
- Grid 5×5 (Likelihood 1-5 di sumbu X, Impact 1-5 di sumbu Y)
- Setiap cell diwarnai berdasarkan score cell:
  - Score ≥ 12 → merah (`heatmap-cell-high`)
  - Score ≥ 6 → kuning (`heatmap-cell-medium`)
  - Score < 6 → hijau (`heatmap-cell-low`)
- Angka dalam cell = jumlah risiko yang jatuh di koordinat (L,I) tersebut

---

### 5️⃣ Schedule Status (Milestones)

**Lokasi di UI:** Tab Overview → Card Milestones + Tab "Milestones" → Timeline

**Sumber Data:** Sheet **`Milestone`** → field `Milestone`, `Target`, `Realisasi`

**Cara Perhitungan (`milestone.js`):**
```javascript
// Status ditentukan otomatis berdasarkan tanggal
if (Realisasi kosong && Target > hari ini) → Belum Tercapai (abu-abu)
if (Realisasi kosong && Target ≤ hari ini) → Terlambat (merah)
if (Realisasi ≤ Target) → Tercapai (hijau) ✅
if (Realisasi > Target) → Terlambat (merah) ⚠️
```

**Data Sample & Status:**
| Milestone | Target | Realisasi | Status |
|-----------|--------|-----------|--------|
| System Architecture Blueprint | 2026-01-15 | 2026-01-12 | ✅ Tercapai (3 hari cepat) |
| Database Schema Design | 2026-02-01 | 2026-01-28 | ✅ Tercapai (4 hari cepat) |
| Prototype Web App Launch | 2026-03-15 | 2026-03-20 | ⚠️ Terlambat (5 hari) |
| Integrasi Google Sheets API | 2026-04-30 | 2026-05-05 | ⚠️ Terlambat (5 hari) |
| Modul Presensi Selesai | 2026-05-31 | 2026-06-05 | ⚠️ Terlambat (5 hari) |
| UAT (User Acceptance Testing) | 2026-06-30 | — | 🔵 Belum Tercapai |
| Go-Live Production | 2026-07-15 | — | 🔵 Belum Tercapai |
| Post-Launch Review | 2026-08-01 | — | 🔵 Belum Tercapai |

**Visualisasi:** Timeline vertikal dengan garis penghubung antar milestone.

---

### 6️⃣ Budget Status

**Lokasi di UI:** Tab Overview → Card Total Anggaran + Tab "Budget Analysis" → Tabel + Column Chart

**Sumber Data:** Sheet **`Budget`** → field `Kategori`, `Planned`, `Actual`

**Cara Perhitungan (`budget.js`):**
```javascript
// Per kategori
variance = Planned - Actual
  → Positif = sisa budget (hijau) ✅
  → Negatif = over budget (merah) ⚠️

// Total
totalPlanned = Σ Planned
totalActual = Σ Actual
```

**Data Sample & Perhitungan:**
| Kategori | Planned | Actual | Variance | Status |
|----------|---------|--------|----------|--------|
| Infrastruktur Cloud | Rp 150M | Rp 142M | +Rp 8M | ✅ Hemat |
| Lisensi Google Workspace | Rp 80M | Rp 85M | -Rp 5M | ⚠️ Over |
| Biaya Pengembang | Rp 250M | Rp 250M | Rp 0 | ✅ Sesuai |
| Training & Sertifikasi | Rp 50M | Rp 35M | +Rp 15M | ✅ Hemat |
| Hardware & Perangkat | Rp 120M | Rp 130M | -Rp 10M | ⚠️ Over |
| Konsultan & Advisory | Rp 75M | Rp 60M | +Rp 15M | ✅ Hemat |
| Marketing & Sosialisasi | Rp 40M | Rp 42M | -Rp 2M | ⚠️ Over |
| Kontingensi (Cadangan) | Rp 60M | Rp 15M | +Rp 45M | ✅ Hemat |

**Total:** Planned = **Rp 825.000.000** | Actual = **Rp 759.000.000** | Sisa = **Rp 66.000.000**

**Visualisasi:** Column chart perbandingan Planned (biru) vs Actual (merah) per kategori.

---

## Ringkasan: Dari Mana Data Berasal

| Elemen | Sheet | Field yang Digunakan | Kalkulasi |
|--------|-------|---------------------|-----------|
| Progress Proyek | Tasks | Progress | Rata-rata semua task × 100% |
| KPI | KPI | Nama, Target, Aktual, Status | **Manual input** → formatting display saja |
| EVM | EVM | PV, EV, AC | SV=EV-PV, CV=EV-AC, SPI=EV/PV, CPI=EV/AC, EAC=BAC/CPI |
| Risk | Risk | Likelihood, Impact | Score=L×I, Level=threshold |
| Schedule | Milestone | Target, Realisasi | Status=perbandingan tanggal |
| Budget | Budget | Planned, Actual | Variance=Planned-Actual |

---

## Koneksi ke Google Spreadsheet

**Konfigurasi (`config.js`):**
```javascript
CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec',
  SHEETS: {
    TASKS: 'Tasks',
    KPI: 'KPI',
    EVM: 'EVM',
    RISK: 'Risk',
    BUDGET: 'Budget',
    MILESTONE: 'Milestone'
  }
}
```

**API Call (`sheets-api.js`):**
```javascript
// Menggunakan JSONP (JSON with Padding) untuk bypass CORS
url = `${GAS_URL}?action=read&sheet=${sheetName}&callback=${callbackName}`
// Inject <script> tag → browser fetch data dari GAS → callback terima JSON array
```

**Backend (`gas-script.js`):**
```javascript
// Google Apps Script membaca spreadsheet
function doGet(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(e.parameter.sheet);
  const data = sheet.getDataRange().getValues();
  // Convert ke JSON array → return sebagai JSONP response
}