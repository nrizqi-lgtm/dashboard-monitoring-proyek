// Sheets API Wrapper - Komunikasi via Google Apps Script (GAS) Web App
const SheetsAPI = {

  // Cek apakah GAS_URL sudah dikonfigurasi
  isConfigured() {
    return CONFIG.GAS_URL && CONFIG.GAS_URL !== 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
  },

  // ==================== READ ====================
  async readSheet(sheetName) {
    if (!this.isConfigured()) {
      console.warn(`[SheetsAPI] GAS belum dikonfigurasi. Menggunakan mock data untuk sheet: ${sheetName}`);
      return this.getMockData(sheetName);
    }

    try {
      const url = `${CONFIG.GAS_URL}?action=getData&sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`GAS responded with status ${response.status}`);
      const result = await response.json();

      if (result.success === false) {
        throw new Error(result.message || 'Gagal mengambil data');
      }

      return result.data || [];
    } catch (error) {
      console.error(`Error reading sheet ${sheetName}:`, error);
      alert(`Gagal mengambil data dari Google Sheets (${sheetName}). Menggunakan mock data lokal.`);
      return this.getMockData(sheetName);
    }
  },

  // ==================== CREATE (Append Row) ====================
  async appendRow(sheetName, newRowData) {
    console.log(`[SheetsAPI] Append row to ${sheetName}:`, newRowData);
    if (!this.isConfigured()) {
      const mock = this.getMockData(sheetName);
      mock.push(newRowData);
      this.saveMockData(sheetName, mock);
      return true;
    }

    try {
      const response = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'addRow',
          sheet: sheetName,
          data: newRowData
        })
      });
      const result = await response.json();
      if (result.success) return true;
      console.error('GAS addRow error:', result.message);
      alert(`Gagal menambah data: ${result.message}`);
      return false;
    } catch (error) {
      console.error('Error appending row:', error);
      alert('Gagal menghubungi server. Data disimpan lokal.');
      this.saveLocalBackup(sheetName, newRowData);
      return false;
    }
  },

  // ==================== UPDATE Row ====================
  async updateRow(sheetName, rowId, updatedRowData) {
    console.log(`[SheetsAPI] Update row ID ${rowId} in ${sheetName}:`, updatedRowData);
    if (!this.isConfigured()) {
      let mock = this.getMockData(sheetName);
      mock = mock.map(item =>
        (item.id === rowId || item.ID === rowId || item.Kategori === rowId || item.Milestone === rowId)
          ? { ...item, ...updatedRowData }
          : item
      );
      this.saveMockData(sheetName, mock);
      return true;
    }

    try {
      const response = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateRow',
          sheet: sheetName,
          rowId: rowId,
          data: updatedRowData
        })
      });
      const result = await response.json();
      if (result.success) return true;
      console.error('GAS updateRow error:', result.message);
      alert(`Gagal update data: ${result.message}`);
      return false;
    } catch (error) {
      console.error('Error updating row:', error);
      alert('Gagal menghubungi server saat update.');
      return false;
    }
  },

  // ==================== DELETE Row ====================
  async deleteRow(sheetName, rowId) {
    console.log(`[SheetsAPI] Delete row ID ${rowId} in ${sheetName}`);
    if (!this.isConfigured()) {
      let mock = this.getMockData(sheetName);
      mock = mock.filter(item =>
        item.id !== rowId && item.ID !== rowId && item.Kategori !== rowId && item.Milestone !== rowId
      );
      this.saveMockData(sheetName, mock);
      return true;
    }

    try {
      const response = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'deleteRow',
          sheet: sheetName,
          rowId: rowId
        })
      });
      const result = await response.json();
      if (result.success) return true;
      console.error('GAS deleteRow error:', result.message);
      alert(`Gagal menghapus data: ${result.message}`);
      return false;
    } catch (error) {
      console.error('Error deleting row:', error);
      alert('Gagal menghubungi server saat hapus.');
      return false;
    }
  },

  // ==================== MOCK DATA (Fallback) ====================
  getMockData(sheetName) {
    const key = `mock_${sheetName}`;
    const localData = localStorage.getItem(key);
    if (localData) return JSON.parse(localData);

    const defaultMocks = {
      [CONFIG.SHEETS.TASKS]: [
        { ID: 'T-101', Nama: 'Rancangan Database Kampus', Progress: '1.0', Status: 'Selesai', PIC: 'Budi' },
        { ID: 'T-102', Nama: 'Integrasi API Dashboard', Progress: '0.45', Status: 'Dalam Proses', PIC: 'Siti' },
        { ID: 'T-103', Nama: 'Modul Presensi Mahasiswa', Progress: '0.0', Status: 'Belum Mulai', PIC: 'Andi' }
      ],
      [CONFIG.SHEETS.KPI]: [
        { ID: 'K-01', Nama: 'Student Attendance Rate', Target: '0.90', Aktual: '0.88', Status: 'At Risk' },
        { ID: 'K-02', Nama: 'System Availability', Target: '0.99', Aktual: '0.995', Status: 'On Track' },
        { ID: 'K-03', Nama: 'Data Processing Latency', Target: '1.5', Aktual: '2.4', Status: 'Critical' }
      ],
      [CONFIG.SHEETS.EVM]: [
        { ID: 'E-01', PV: '120000000', EV: '100000000', AC: '115000000', Tanggal: '2026-06-01' },
        { ID: 'E-02', PV: '240000000', EV: '210000000', AC: '215000000', Tanggal: '2026-06-15' },
        { ID: 'E-03', PV: '360000000', EV: '320000000', AC: '340000000', Tanggal: '2026-06-21' }
      ],
      [CONFIG.SHEETS.RISK]: [
        { ID: 'R-01', Risiko: 'Keterlambatan integrasi data API', Likelihood: '4', Impact: '4', Skor: '16', Mitigasi: 'Backup API local cache' },
        { ID: 'R-02', Risiko: 'Kapasitas server tidak mencukupi', Likelihood: '2', Impact: '5', Skor: '10', Mitigasi: 'Auto-scaling infrastruktur' },
        { ID: 'R-03', Risiko: 'Kendala izin admin spreadsheet', Likelihood: '3', Impact: '3', Skor: '9', Mitigasi: 'Delegasi API user service account' }
      ],
      [CONFIG.SHEETS.BUDGET]: [
        { Kategori: 'Infrastruktur Cloud', Planned: '150000000', Actual: '142000000', Status: 'Normal' },
        { Kategori: 'Lisensi Google Workspace', Planned: '80000000', Actual: '85000000', Status: 'Overbudget' },
        { Kategori: 'Biaya Pengembang', Planned: '250000000', Actual: '250000000', Status: 'Normal' }
      ],
      [CONFIG.SHEETS.MILESTONES]: [
        { Milestone: 'System Architecture Blueprint', Target: '2026-04-15', Realisasi: '2026-04-12', Status: 'On Track' },
        { Milestone: 'Prototype Web App Launch', Target: '2026-05-30', Realisasi: '2026-06-05', Status: 'Delayed' },
        { Milestone: 'Integrasi Google Sheets API', Target: '2026-06-25', Realisasi: '', Status: 'On Track' }
      ]
    };

    const mock = defaultMocks[sheetName] || [];
    this.saveMockData(sheetName, mock);
    return mock;
  },

  saveMockData(sheetName, data) {
    localStorage.setItem(`mock_${sheetName}`, JSON.stringify(data));
  },

  saveLocalBackup(sheetName, newRowData) {
    const data = this.getMockData(sheetName);
    data.push(newRowData);
    this.saveMockData(sheetName, data);
  }
};