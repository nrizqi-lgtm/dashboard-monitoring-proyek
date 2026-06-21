// ============================================================
// SEEDER - Isi Google Spreadsheet dengan data sample
// ============================================================
// CARA PAKAI:
// 1. Buka https://script.google.com
// 2. Buka project GAS yang sudah deploy
// 3. Paste kode ini di bawah kode gas-script.js (atau buat file baru)
// 4. Jalankan fungsi: seedAllData()
// 5. Hapus kode seeder setelah selesai (agar tidak menumpuk)
// ============================================================

// ============ DATA SAMPLE ============

const SEED_TASKS = [
  { ID: 'T-101', Nama: 'Rancangan Database Kampus', Progress: '1.0', Status: 'Selesai', PIC: 'Budi' },
  { ID: 'T-102', Nama: 'Integrasi API Dashboard', Progress: '0.45', Status: 'Dalam Proses', PIC: 'Siti' },
  { ID: 'T-103', Nama: 'Modul Presensi Mahasiswa', Progress: '0.0', Status: 'Belum Mulai', PIC: 'Andi' },
  { ID: 'T-104', Nama: 'Sistem Autentikasi SSO', Progress: '0.80', Status: 'Dalam Proses', PIC: 'Dewi' },
  { ID: 'T-105', Nama: 'Dashboard Monitoring Real-time', Progress: '0.30', Status: 'Dalam Proses', PIC: 'Rina' },
  { ID: 'T-106', Nama: 'Modul Laporan Akademik', Progress: '0.0', Status: 'Belum Mulai', PIC: 'Andi' },
  { ID: 'T-107', Nama: 'Integrasi Google Calendar', Progress: '0.60', Status: 'Dalam Proses', PIC: 'Siti' },
  { ID: 'T-108', Nama: 'Testing & QA Sistem', Progress: '0.0', Status: 'Belum Mulai', PIC: 'Budi' },
  { ID: 'T-109', Nama: 'Deploy ke Production Server', Progress: '0.0', Status: 'Belum Mulai', PIC: 'Dewi' },
  { ID: 'T-110', Nama: 'Dokumentasi & Training User', Progress: '0.10', Status: 'Dalam Proses', PIC: 'Rina' }
];

const SEED_KPI = [
  { ID: 'K-01', Nama: 'Student Attendance Rate', Target: '0.90', Aktual: '0.88', Status: 'At Risk' },
  { ID: 'K-02', Nama: 'System Availability', Target: '0.99', Aktual: '0.995', Status: 'On Track' },
  { ID: 'K-03', Nama: 'Data Processing Latency', Target: '1.5', Aktual: '2.4', Status: 'Critical' },
  { ID: 'K-04', Nama: 'User Satisfaction Score', Target: '4.5', Aktual: '4.2', Status: 'At Risk' },
  { ID: 'K-05', Nama: 'Course Completion Rate', Target: '0.85', Aktual: '0.87', Status: 'On Track' },
  { ID: 'K-06', Nama: 'System Response Time (ms)', Target: '200', Aktual: '180', Status: 'On Track' },
  { ID: 'K-07', Nama: 'Data Accuracy Rate', Target: '0.98', Aktual: '0.95', Status: 'At Risk' },
  { ID: 'K-08', Nama: 'Monthly Active Users', Target: '5000', Aktual: '3200', Status: 'Critical' }
];

const SEED_EVM = [
  { ID: 'E-01', PV: '120000000', EV: '100000000', AC: '115000000', Tanggal: '2026-01-31' },
  { ID: 'E-02', PV: '240000000', EV: '210000000', AC: '215000000', Tanggal: '2026-02-28' },
  { ID: 'E-03', PV: '360000000', EV: '320000000', AC: '340000000', Tanggal: '2026-03-31' },
  { ID: 'E-04', PV: '480000000', EV: '430000000', AC: '420000000', Tanggal: '2026-04-30' },
  { ID: 'E-05', PV: '600000000', EV: '520000000', AC: '510000000', Tanggal: '2026-05-31' },
  { ID: 'E-06', PV: '720000000', EV: '600000000', AC: '580000000', Tanggal: '2026-06-21' }
];

const SEED_RISK = [
  { ID: 'R-01', Risiko: 'Keterlambatan integrasi data API', Likelihood: '4', Impact: '4', Mitigasi: 'Backup API local cache & fallback mechanism' },
  { ID: 'R-02', Risiko: 'Kapasitas server tidak mencukupi', Likelihood: '2', Impact: '5', Mitigasi: 'Auto-scaling infrastruktur cloud' },
  { ID: 'R-03', Risiko: 'Kendala izin admin spreadsheet', Likelihood: '3', Impact: '3', Mitigasi: 'Delegasi API user service account' },
  { ID: 'R-04', Risiko: 'Serangan keamanan siber', Likelihood: '2', Impact: '5', Mitigasi: 'Enripsi data & audit log berkala' },
  { ID: 'R-05', Risiko: 'Perubahan kebijakan Google API', Likelihood: '3', Impact: '4', Mitigasi: 'Monitoring changelog & backup export' },
  { ID: 'R-06', Risiko: 'Kurangnya SDM pengembang', Likelihood: '4', Impact: '3', Mitigasi: 'Training cross-functional & dokumentasi' },
  { ID: 'R-07', Risiko: 'Gangguan jaringan internet', Likelihood: '3', Impact: '4', Mitigasi: 'Offline mode & local data sync' },
  { ID: 'R-08', Risiko: 'Bug pada modul akademik', Likelihood: '4', Impact: '3', Mitigasi: 'Unit testing & code review rutin' }
];

const SEED_BUDGET = [
  { Kategori: 'Infrastruktur Cloud', Planned: '150000000', Actual: '142000000' },
  { Kategori: 'Lisensi Google Workspace', Planned: '80000000', Actual: '85000000' },
  { Kategori: 'Biaya Pengembang', Planned: '250000000', Actual: '250000000' },
  { Kategori: 'Training & Sertifikasi', Planned: '50000000', Actual: '35000000' },
  { Kategori: 'Hardware & Perangkat', Planned: '120000000', Actual: '130000000' },
  { Kategori: 'Konsultan & Advisory', Planned: '75000000', Actual: '60000000' },
  { Kategori: 'Marketing & Sosialisasi', Planned: '40000000', Actual: '42000000' },
  { Kategori: 'Kontingensi (Cadangan)', Planned: '60000000', Actual: '15000000' }
];

const SEED_MILESTONES = [
  { Milestone: 'System Architecture Blueprint', Target: '2026-01-15', Realisasi: '2026-01-12' },
  { Milestone: 'Database Schema Design', Target: '2026-02-01', Realisasi: '2026-01-28' },
  { Milestone: 'Prototype Web App Launch', Target: '2026-03-15', Realisasi: '2026-03-20' },
  { Milestone: 'Integrasi Google Sheets API', Target: '2026-04-30', Realisasi: '2026-05-05' },
  { Milestone: 'Modul Presensi Selesai', Target: '2026-05-31', Realisasi: '2026-06-05' },
  { Milestone: 'UAT (User Acceptance Testing)', Target: '2026-06-30', Realisasi: '' },
  { Milestone: 'Go-Live Production', Target: '2026-07-15', Realisasi: '' },
  { Milestone: 'Post-Launch Review', Target: '2026-08-01', Realisasi: '' }
];

// ============ FUNGSI SEEDER ============

function seedAllData() {
  const results = [];

  try {
    seedSheet('Tasks', SEED_TASKS);
    results.push('✅ Tasks: ' + SEED_TASKS.length + ' baris');
  } catch (e) {
    results.push('❌ Tasks: ' + e.message);
  }

  try {
    seedSheet('KPI', SEED_KPI);
    results.push('✅ KPI: ' + SEED_KPI.length + ' baris');
  } catch (e) {
    results.push('❌ KPI: ' + e.message);
  }

  try {
    seedSheet('EVM', SEED_EVM);
    results.push('✅ EVM: ' + SEED_EVM.length + ' baris');
  } catch (e) {
    results.push('❌ EVM: ' + e.message);
  }

  try {
    seedSheet('Risk', SEED_RISK);
    results.push('✅ Risk: ' + SEED_RISK.length + ' baris');
  } catch (e) {
    results.push('❌ Risk: ' + e.message);
  }

  try {
    seedSheet('Budget', SEED_BUDGET);
    results.push('✅ Budget: ' + SEED_BUDGET.length + ' baris');
  } catch (e) {
    results.push('❌ Budget: ' + e.message);
  }

  try {
    seedSheet('Milestone', SEED_MILESTONES);
    results.push('✅ Milestone: ' + SEED_MILESTONES.length + ' baris');
  } catch (e) {
    results.push('❌ Milestone: ' + e.message);
  }

  Logger.log('=== SEED COMPLETE ===\n' + results.join('\n'));
  SpreadsheetApp.getUi().alert('Seed Selesai!\n\n' + results.join('\n'));
}

function seedSheet(sheetName, data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);

  // Buat sheet jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Bersihkan data lama (kecuali header)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }

  // Tulis header dari keys objek pertama
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Tulis data
    const rows = data.map(item => headers.map(h => item[h] || ''));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  Logger.log(sheetName + ': ' + data.length + ' baris berhasil ditulis');
}

function clearAllData() {
  const sheets = ['Tasks', 'KPI', 'EVM', 'Risk', 'Budget', 'Milestone'];
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  sheets.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
  });

  Logger.log('Semua data dibersihkan');
  SpreadsheetApp.getUi().alert('Semua data sudah dibersihkan!');
}

// ============ HEADER REFERENCE (untuk manual setup) ============
// Jika ingin membuat sheet manual, buat sheet dengan header berikut:
//
// Tasks:     ID | Nama | Progress | Status | PIC
// KPI:       ID | Nama | Target | Aktual | Status
// EVM:       ID | PV | EV | AC | Tanggal
// Risk:      ID | Risiko | Likelihood | Impact | Skor | Mitigasi
// Budget:    Kategori | Planned | Actual | Status
// Milestone: Milestone | Target | Realisasi | Status