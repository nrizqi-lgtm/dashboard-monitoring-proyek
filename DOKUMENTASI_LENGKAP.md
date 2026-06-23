# 📘 Dokumentasi Lengkap Aplikasi Dashboard Monitoring Proyek Smart Campus

---

## 1. Ringkasan Aplikasi

Aplikasi ini adalah **Dashboard Monitoring Proyek** berbasis web yang digunakan untuk memantau dan mengelola proyek implementasi **Smart Campus**. Aplikasi menyajikan visualisasi data proyek secara *real-time* meliputi task tracking, KPI akademik, Earned Value Management (EVM), manajemen risiko, anggaran, dan milestone — semuanya terhubung ke **Google Spreadsheet** sebagai database melalui **Google Apps Script (GAS)** sebagai backend API.

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│              BROWSER (Frontend)                       │
│  index.html → Landing page                            │
│  dashboard.html → Dashboard utama (6 modul)           │
│  css/style.css → Styling                              │
│  js/*.js → Logic per modul                            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP GET (JSONP) / POST
                       ▼
┌─────────────────────────────────────────────────────┐
│          GOOGLE APPS SCRIPT (Backend API)             │
│  gas-script.js                                        │
│  ─ doGet(e) → READ data dari Spreadsheet              │
│  ─ doPost(e) → CREATE / UPDATE / DELETE               │
│  ─ autoCalculate() → hitung otomatis Skor/Status      │
└──────────────────────┬──────────────────────────────┘
                       │ SpreadsheetApp API
                       ▼
┌─────────────────────────────────────────────────────┐
│          GOOGLE SPREADSHEET (Database)                │
│  6 Sheet: Tasks | KPI | EVM | Risk | Budget | Milestone │
│  Baris 1 = Header, Baris 2+ = Data                    │
└─────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer | Teknologi | Versi / Detail |
|-------|-----------|----------------|
| **Frontend** | HTML5 + CSS3 + Vanilla JavaScript | No framework; pure JS + Google Charts |
| **Chart Library** | Google Charts (loader.js) | `corechart`, `gauge`, `timeline` packages |
| **Backend API** | Google Apps Script (GAS) | JavaScript-based, deployed as Web App |
| **Database** | Google Spreadsheet | 6 sheets, no SQL |
| **Komunikasi** | JSONP (GET) & POST (text/plain) | CORS bypass via `<script>` tag injection |
| **Hosting Frontend** | Static file (bisa GitHub Pages / local) | Tidak perlu server |
| **Version Control** | Git + GitHub | `origin: github.com/nrizqi-lgtm/dashboard-monitoring-proyek.git` |

### 3.1 Bahasa Pemrograman

- **Frontend:** JavaScript (ES6+), HTML5, CSS3
- **Backend:** Google Apps Script (syntax mirip JavaScript/ES5)
- **Data Format:** JSON (komunikasi), Spreadsheet rows (storage)

### 3.2 File Structure

```
itpm_apps/
├── index.html              ← Landing page / welcome
├── dashboard.html          ← Dashboard utama (6 tab modul)
├── gas-script.js           ← Backend GAS (deploy ke Google Script)
├── seed-data.js            ← Data sample seeder
├── flow.md                 ← Dokumentasi flow lama
├── DOKUMENTASI_DASHBOARD.md ← Dokumentasi dashboard detail
├── css/
│   └── style.css           ← Semua styling aplikasi
└── js/
    ├── config.js           ← Konfigurasi (GAS_URL, nama sheet)
    ├── sheets-api.js       ← Layer API: fetch/JSONP ke GAS
    ├── utils.js            ← Utility functions (format rupiah, tanggal, dll)
    ├── tasks.js            ← Module Tasks (CRUD + render table/chart)
    ├── kpi.js              ← Module KPI (CRUD + render)
    ├── evm.js              ← Module EVM (CRUD + kalkulasi SV/CV/SPI/CPI/EAC)
    ├── risk.js             ← Module Risk (CRUD + heatmap)
    ├── budget.js           ← Module Budget (CRUD + chart)
    ├── milestone.js        ← Module Milestone (CRUD + timeline)
    └── dashboard.js        ← Controller utama dashboard
```

---

## 4. Alur Data & Komunikasi

### 4.1 Flow Aplikasi

```
index.html (load)
  → User klik "Buka Dashboard"
    → dashboard.html (load)
      → DashboardController.init()
        → setupEventListeners()
        → google.charts.load()
        → loadAllModules()
          → Promise.all([TasksModule.load(), KPIModule.load(), ...])
            → setiap module panggil SheetsAPI.readSheet(sheetName)
              → GET GAS_URL?action=getData&sheet=Tasks
                → GAS baca Spreadsheet → return JSON array
              → Module.data[] terisi
              → Module.render() → render table + chart
        → renderOverallProgressGauge()
      → auto-refresh setiap 60 detik
```

### 4.2 CRUD Operations

| Operasi | Method | Endpoint | Deskripsi |
|---------|--------|----------|-----------|
| **READ** | GET (JSONP) | `?action=getData&sheet=NamaSheet` | Ambil semua data dari sheet |
| **CREATE** | POST | Body `{action:'addRow', sheet, data}` | Tambah baris baru |
| **UPDATE** | POST | Body `{action:'updateRow', sheet, rowId, data}` | Update baris berdasarkan ID |
| **DELETE** | POST | Body `{action:'deleteRow', sheet, rowId}` | Hapus baris berdasarkan ID |

### 4.3 Error Handling

- Jika fetch gagal → fallback ke **mock data lokal** (getMockData)
- Jika write gagal → simpan backup ke **localStorage**
- Status koneksi ditampilkan di top-bar badge (Connected / Offline Mode)

---

## 5. Siapa User & Siapa Input

### 5.1 User / Pengguna Aplikasi

| Peran | Deskripsi |
|-------|-----------|
| **Project Manager** | User utama. Melihat overview proyek, memantau progress task, EVM, budget, risiko, milestone. |
| **Tim Pengembang** | Melihat task assignment, update progress task mereka. |
| **Manajemen/Stakeholder** | Melihat KPI akademik, laporan budget, timeline proyek. |

> Aplikasi ini **tidak memiliki sistem autentikasi/login** — siapapun yang memiliki akses ke URL dashboard bisa melihat data. (Ini karena sifat frontend statis + GAS Web App yang public.)

### 5.2 Siapa yang Input Data?

| Modul | Yang Input | Cara Input |
|-------|-----------|------------|
| **Tasks** | Project Manager / Tim | Form modal "Tambah Task" di tab Tasks |
| **KPI** | Admin / Manajemen | Form modal "Tambah KPI" di tab KPI Akademik |
| **EVM** | Project Manager | Form modal "Input Data EVM" di tab EVM (nilai PV, EV, AC per bulan) |
| **Risk** | Risk Manager / PM | Form modal "Tambah Risiko" di tab Manajemen Risiko |
| **Budget** | Finance / PM | Form modal "Tambah Alokasi Budget" di tab Budget |
| **Milestone** | Project Manager | Form modal "Tambah Milestone" di tab Milestones |

Semua input dilakukan **langsung dari browser** → data dikirim ke Google Spreadsheet via GAS API.

---

## 6. Halaman per Halaman (Per-Page Content)

---

### 6.1 Halaman: `index.html` — Landing Page / Portal Utama

**Isi:**
- Logo aplikasi (ikon buku)
- Judul: "Smart Campus Monitoring"
- Subtitle: menjelaskan sistem monitoring terintegrasi berbasis web
- 4 feature cards (icon + judul + deskripsi):
  - EVM Analysis
  - Risk Management
  - Budget Tracking
  - Milestones
- Tombol "Buka Dashboard" → navigasi ke `dashboard.html`

**Fungsi:** Halaman selamat datang / portal masuk ke dashboard.

**Sumber data:** Tidak ada (hanya HTML statis).

---

### 6.2 Halaman: `dashboard.html` — Dashboard Utama

#### 6.2.1 Struktur Layout

```
┌────────────┬────────────────────────────────────────┐
│  SIDEBAR   │            TOP BAR                      │
│            │  [Hamburger] [Page Title] [Badge][Refresh] │
│  Navigation ├────────────────────────────────────────┤
│  Links:    │         DASHBOARD CONTENT               │
│  Overview  │     (Tab-based, 7 tabs)                 │
│  Tasks     │                                         │
│  KPI       │  Active tab content:                    │
│  EVM       │  - Overview (default)                   │
│  Risk      │  - Tasks                                │
│  Budget    │  - KPI Akademik                         │
│  Milestones│  - EVM Performa                         │
│            │  - Manajemen Risiko                     │
│  Footer:   │  - Budget Analysis                      │
│  v1.0.0    │  - Milestones                           │
└────────────┴────────────────────────────────────────┘
```

**Fungsi:** Halaman utama aplikasi. Menampilkan semua data proyek dalam 7 tab section. Auto-refresh setiap 60 detik. Dilengkapi CRUD modal untuk tambah/edit/hapus data.

---

#### 6.2.2 Tab: **Overview** (Default)

**Isi:**
1. **Overall Progress (Gauge Ring)**
   - Tampilan: SVG ring/donut gauge dengan nilai persentase di tengah
   - Sumber data: Sheet `Tasks` → field `Progress` semua task
   - Perhitungan: `rata-rata(Progress semua task) × 100%`
   - Warna: Hijau ≥80%, Kuning ≥50%, Merah <50%
   - Fungsi: Menunjukkan persentase penyelesaian seluruh tugas proyek

2. **Total Anggaran (Planned)**
   - Tampilan: Nilai total planned budget dalam Rupiah
   - Sumber data: Sheet `Budget` → field `Planned` semua kategori
   - Perhitungan: `SUM(Planned semua kategori)`
   - Fungsi: Menampilkan total alokasi anggaran proyek

3. **Schedule Variance (SV)**
   - Tampilan: Nilai SV (Earned Value - Planned Value) dalam Rupiah
   - Sumber data: Sheet `EVM` → baris terakhir → PV, EV
   - Perhitungan: `SV = EV - PV`
   - Fungsi: Menunjukkan status jadwal (positif = di depan jadwal, negatif = terlambat)

4. **Risk Level Utama**
   - Tampilan: Level risiko tertinggi beserta skornya, misal "High (Max: 16)"
   - Sumber data: Sheet `Risk` → semua data risiko
   - Perhitungan: Cari risiko dengan `Skor = Likelihood × Impact` tertinggi
   - Fungsi: Menunjukkan kondisi risiko dominan saat ini

5. **Performance Index (SPI & CPI) Chart**
   - Tampilan: Bar chart SPI dan CPI dengan threshold garis di 1.0
   - Sumber data: Sheet `EVM` → baris terakhir
   - Perhitungan: `SPI = EV/PV`, `CPI = EV/AC`
   - Fungsi: Menunjukkan performa jadwal (SPI) dan biaya (CPI)

6. **Proyeksi Pengeluaran (EAC vs BAC) Chart**
   - Tampilan: Column chart perbandingan BAC vs EAC
   - Sumber data: Sheet `EVM` → PV max (BAC), CPI
   - Perhitungan: `EAC = BAC / CPI`
   - Fungsi: Menunjukkan proyeksi total biaya akhir proyek

---

#### 6.2.3 Tab: **Tasks**

**Isi:**
- Tabel daftar tasks dengan kolom: Task ID, Nama Task, Progress, Status, PIC, Aksi (Edit/Hapus)
- Tombol "Tambah Task" → modal form CRUD

**Sumber data:** Sheet `Tasks` → kolom: ID, Nama, Progress, Status, PIC

**Fungsi:** Melacak dan mengelola tugas-tugas proyek, melihat progress masing-masing task.

---

#### 6.2.4 Tab: **KPI Akademik**

**Isi:**
- Cards container (ringkasan KPI dengan badge warna)
- Tabel KPI dengan kolom: KPI ID, Nama Indicator, Target, Aktual, Status, Aksi
- Bar chart horizontal Target vs Aktual (Google Charts)
- Tombol "Tambah KPI"

**Sumber data:** Sheet `KPI` → kolom: ID, Nama, Target, Aktual, Status

**Perhitungan:**
- Status diinput manual oleh user (On Track / At Risk / Critical)
- Display formatting otomatis: jika nama mengandung "rate" atau "availability" → format persen, selain itu → format ms

**Fungsi:** Memonitor Key Performance Indicators akademik kampus.

---

#### 6.2.5 Tab: **EVM Performa**

**Isi:**
1. **EVM Trend Chart** (line chart): PV, EV, AC dari waktu ke waktu
2. **Ringkasan Nilai EVM** (tabel): SV, CV, SPI, CPI, EAC dengan nilai dan penjelasan
3. Tombol "Input Data EVM"

**Sumber data:** Sheet `EVM` → semua baris data (untuk trend) + baris terakhir (untuk metrik terkini)

**Kalkulasi (dari `evm.js` → `calculateMetrics()`):**
| Metrik | Rumus | Interpretasi |
|--------|-------|--------------|
| SV (Schedule Variance) | EV - PV | Positif = di depan jadwal ✅ |
| CV (Cost Variance) | EV - AC | Positif = hemat ✅ |
| SPI (Schedule Performance Index) | EV / PV | ≥1.0 = on schedule ✅ |
| CPI (Cost Performance Index) | EV / AC | ≥1.0 = under budget ✅ |
| BAC (Budget at Completion) | max(PV) | Total anggaran |
| EAC (Estimate at Completion) | BAC / CPI | Proyeksi biaya akhir |

**Fungsi:** Menganalisis performa proyek menggunakan metodologi Earned Value Management.

---

#### 6.2.6 Tab: **Manajemen Risiko**

**Isi:**
1. **Matriks Risiko (Heatmap)** — grid 5×5 Likelihood × Impact
   - Setiap cell: warna merah (≥12), kuning (≥6), hijau (<6) + jumlah risiko di koordinat itu
2. **Tabel Daftar Risiko** — kolom: ID, Risiko, Likelihood, Impact, Skor, Mitigasi, Aksi
3. Tombol "Tambah Risiko"

**Sumber data:** Sheet `Risk` → kolom: ID, Risiko, Likelihood, Impact, Mitigasi

**Perhitungan (otomatis di GAS saat add/update):**
- `Skor = Likelihood × Impact`
- `Level: Skor ≥12 = High 🔴, ≥6 = Medium 🟡, <6 = Low 🟢`

**Fungsi:** Mengidentifikasi, menilai, dan memvisualisasikan risiko proyek dalam bentuk heatmap.

---

#### 6.2.7 Tab: **Budget Analysis**

**Isi:**
1. **Planned vs Actual Cost Chart** (column chart per kategori)
2. **Tabel Rincian Budget** — kolom: Kategori, Planned Budget, Actual Cost, Variance, Status, Aksi
3. Tombol "Tambah Alokasi Budget"

**Sumber data:** Sheet `Budget` → kolom: Kategori, Planned, Actual

**Perhitungan:**
- `Variance = Planned - Actual` (positif = sisa/hemat, negatif = over)
- Status otomatis: actual>planned → Overbudget, actual>90% planned → Warning, else Normal

**Fungsi:** Melacak dan menganalisis anggaran proyek per kategori.

---

#### 6.2.8 Tab: **Milestones**

**Isi:**
1. **Implementation Timeline** — timeline chart vertikal
2. **Tabel Milestones** — kolom: Milestone, Target Selesai, Realisasi, Status, Aksi
3. Tombol "Tambah Milestone"

**Sumber data:** Sheet `Milestone` → kolom: Milestone, Target, Realisasi

**Perhitungan Status (otomatis di GAS):**
- Realisasi ≤ Target → `Tercapai ✅` (hijau)
- Realisasi > Target → `Terlambat ⚠️` (merah)
- Realisasi kosong & Target > hari ini → `Belum Tercapai 🔵` (abu-abu)
- Realisasi kosong & Target ≤ hari ini → `Terlambat 🔴` (merah)

**Fungsi:** Menampilkan jadwal proyek dan tracking pencapaian milestone.

---

## 7. Ringkasan Sheet → Modul → Data

| Sheet | Modul JS | ID Column | Kolom Data | Field Otomatis |
|-------|----------|-----------|------------|----------------|
| Tasks | tasks.js | ID | ID, Nama, Progress, Status, PIC | — |
| KPI | kpi.js | ID | ID, Nama, Target, Aktual, Status | — (input manual) |
| EVM | evm.js | ID | ID, Tanggal, PV, EV, AC | — |
| Risk | risk.js | ID | ID, Risiko, Likelihood, Impact, Mitigasi | Skor = L × I |
| Budget | budget.js | Kategori | Kategori, Planned, Actual | Status (Overbudget/Warning/Normal) |
| Milestone | milestone.js | Milestone | Milestone, Target, Realisasi | Status (Tercapai/Terlambat/Belum) |

---

## 8. Setup & Deployment (Ringkasan)

1. **Buat Google Spreadsheet** dengan 6 sheet: Tasks, KPI, EVM, Risk, Budget, Milestone
2. **Buat Google Apps Script**, paste `gas-script.js`, set SPREADSHEET_ID
3. **Deploy sebagai Web App** (Execute as: Me, Access: Anyone)
4. **Jalankan `seedAllData()`** dari `seed-data.js` untuk data sample
5. **Update `js/config.js`** dengan GAS_URL
6. **Buka `index.html`** atau deploy ke hosting statis

---

## 9. Catatan Penting

- ⚠️ **Tidak ada autentikasi** — Siapapun dengan URL bisa akses
- ⚠️ **Menggunakan JSONP** untuk bypass CORS (karena GAS Web App)
- ⚠️ **Content-Type harus `text/plain`** saat POST (GAS tidak support `application/json`)
- 🔄 **Auto-refresh** setiap 60 detik
- 📱 **Responsive** — support mobile dengan hamburger menu sidebar
- 🎨 **Dark theme** — UI menggunakan skema warna gelap dengan aksen neon purple