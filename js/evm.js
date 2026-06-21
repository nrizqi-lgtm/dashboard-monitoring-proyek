// Earned Value Management (EVM) Module
const EVMModule = {
  data: [],

  async load() {
    this.data = await SheetsAPI.readSheet(CONFIG.SHEETS.EVM);
    this.render();
  },

  calculateMetrics() {
    if (this.data.length === 0) return null;
    
    // Ambil baris data terbaru sebagai acuan status saat ini
    const latest = this.data[this.data.length - 1];
    
    const PV = Utils.parseFloat(latest.PV);
    const EV = Utils.parseFloat(latest.EV);
    const AC = Utils.parseFloat(latest.AC);
    
    // BAC adalah total planned budget (kita ambil dari nilai PV maksimal atau total budget)
    // Untuk penyederhanaan, BAC adalah PV akhir
    const BAC = Math.max(...this.data.map(d => Utils.parseFloat(d.PV)), 480000000); 

    const SV = EV - PV;
    const CV = EV - AC;
    const SPI = PV > 0 ? (EV / PV) : 0;
    const CPI = AC > 0 ? (EV / AC) : 0;
    const EAC = CPI > 0 ? (BAC / CPI) : BAC;

    return { PV, EV, AC, BAC, SV, CV, SPI, CPI, EAC };
  },

  render() {
    const metrics = this.calculateMetrics();
    const tbody = document.querySelector('#table-evm-summary tbody');
    
    if (!metrics) return;

    // Update Overview screen metrics if elements exist
    const overviewSV = document.getElementById('overview-sv');
    if (overviewSV) {
      overviewSV.innerText = Utils.formatRupiah(metrics.SV);
      overviewSV.style.color = metrics.SV >= 0 ? 'var(--color-green)' : 'var(--color-red)';
    }

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td><strong>Planned Value (PV)</strong></td>
          <td>${Utils.formatRupiah(metrics.PV)}</td>
          <td>Anggaran yang direncanakan untuk diselesaikan hingga saat ini.</td>
        </tr>
        <tr>
          <td><strong>Earned Value (EV)</strong></td>
          <td>${Utils.formatRupiah(metrics.EV)}</td>
          <td>Nilai pekerjaan yang benar-benar terselesaikan secara aktual.</td>
        </tr>
        <tr>
          <td><strong>Actual Cost (AC)</strong></td>
          <td>${Utils.formatRupiah(metrics.AC)}</td>
          <td>Biaya aktual yang telah dikeluarkan untuk pekerjaan yang selesai.</td>
        </tr>
        <tr>
          <td><strong>Schedule Variance (SV)</strong></td>
          <td style="color: ${metrics.SV >= 0 ? 'var(--color-green)' : 'var(--color-red)'}; font-weight: bold;">
            ${Utils.formatRupiah(metrics.SV)}
          </td>
          <td>Selisih jadwal (EV - PV). Nilai positif berarti mendahului jadwal.</td>
        </tr>
        <tr>
          <td><strong>Cost Variance (CV)</strong></td>
          <td style="color: ${metrics.CV >= 0 ? 'var(--color-green)' : 'var(--color-red)'}; font-weight: bold;">
            ${Utils.formatRupiah(metrics.CV)}
          </td>
          <td>Selisih biaya (EV - AC). Nilai positif berarti di bawah anggaran.</td>
        </tr>
        <tr>
          <td><strong>Schedule Performance Index (SPI)</strong></td>
          <td><span class="badge ${Utils.getPerformanceBadge(metrics.SPI)}">${metrics.SPI.toFixed(2)}</span></td>
          <td>Efisiensi Jadwal (EV / PV). SPI &ge; 1.0 berarti on-schedule/ahead.</td>
        </tr>
        <tr>
          <td><strong>Cost Performance Index (CPI)</strong></td>
          <td><span class="badge ${Utils.getPerformanceBadge(metrics.CPI)}">${metrics.CPI.toFixed(2)}</span></td>
          <td>Efisiensi Biaya (EV / AC). CPI &ge; 1.0 berarti hemat anggaran.</td>
        </tr>
        <tr>
          <td><strong>Estimate at Completion (EAC)</strong></td>
          <td><strong>${Utils.formatRupiah(metrics.EAC)}</strong></td>
          <td>Proyeksi total biaya akhir proyek berdasarkan performa saat ini.</td>
        </tr>
      `;
    }

    this.renderTrendChart();
    this.renderOverviewPerformanceIndices(metrics.SPI, metrics.CPI);
    this.renderOverviewBudgetProjection(metrics.BAC, metrics.EAC);
  },

  renderTrendChart() {
    const chartDiv = document.getElementById('chart-evm-trend');
    if (!chartDiv || typeof google === 'undefined' || !google.visualization) return;

    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'Tanggal');
    dataTable.addColumn('number', 'PV');
    dataTable.addColumn('number', 'EV');
    dataTable.addColumn('number', 'AC');

    this.data.forEach(row => {
      dataTable.addRow([
        Utils.formatDate(row.Tanggal),
        Utils.parseFloat(row.PV),
        Utils.parseFloat(row.EV),
        Utils.parseFloat(row.AC)
      ]);
    });

    const options = {
      title: 'Tren Nilai Kumulatif Proyek (EVM)',
      curveType: 'function',
      legend: { position: 'bottom' },
      colors: ['#3b82f6', '#22c55e', '#ef4444'],
      chartArea: { width: '85%', height: '70%' },
      vAxis: { format: 'short' }
    };

    const chart = new google.visualization.LineChart(chartDiv);
    chart.draw(dataTable, options);
  },

  renderOverviewPerformanceIndices(spi, cpi) {
    const chartDiv = document.getElementById('chart-performance-indices');
    if (!chartDiv || typeof google === 'undefined' || !google.visualization) return;

    const dataTable = google.visualization.arrayToDataTable([
      ['Metrik', 'Indeks Performa', { role: 'style' }],
      ['SPI (Jadwal)', spi, spi >= 1 ? '#22c55e' : '#ef4444'],
      ['CPI (Biaya)', cpi, cpi >= 1 ? '#22c55e' : '#ef4444']
    ]);

    const options = {
      title: 'Indeks Kinerja (Target >= 1.0)',
      legend: { position: 'none' },
      hAxis: { minValue: 0, maxValue: 1.5, ticks: [0, 0.5, 1.0, 1.5] },
      chartArea: { width: '70%', height: '70%' }
    };

    const chart = new google.visualization.BarChart(chartDiv);
    chart.draw(dataTable, options);
  },

  renderOverviewBudgetProjection(bac, eac) {
    const chartDiv = document.getElementById('chart-budget-projection');
    if (!chartDiv || typeof google === 'undefined' || !google.visualization) return;

    const dataTable = google.visualization.arrayToDataTable([
      ['Tipe', 'Rupiah', { role: 'style' }],
      ['BAC (Anggaran Awal)', bac, '#64748b'],
      ['EAC (Perkiraan Akhir)', eac, eac <= bac ? '#22c55e' : '#ef4444']
    ]);

    const options = {
      title: 'Proyeksi Biaya Penyelesaian Proyek',
      legend: { position: 'none' },
      vAxis: { format: 'short' },
      chartArea: { width: '70%', height: '70%' }
    };

    const chart = new google.visualization.ColumnChart(chartDiv);
    chart.draw(dataTable, options);
  },

  getFormFields(editData = null) {
    return `
      <div class="form-group">
        <label for="evm-id">EVM Data ID</label>
        <input type="text" id="evm-id" class="form-control" value="${editData ? editData.ID : 'E-' + (Date.now() % 1000)}" required ${editData ? 'readonly' : ''}>
      </div>
      <div class="form-group">
        <label for="evm-pv">Planned Value (PV)</label>
        <input type="number" id="evm-pv" class="form-control" value="${editData ? editData.PV : '0'}" required>
      </div>
      <div class="form-group">
        <label for="evm-ev">Earned Value (EV)</label>
        <input type="number" id="evm-ev" class="form-control" value="${editData ? editData.EV : '0'}" required>
      </div>
      <div class="form-group">
        <label for="evm-ac">Actual Cost (AC)</label>
        <input type="number" id="evm-ac" class="form-control" value="${editData ? editData.AC : '0'}" required>
      </div>
      <div class="form-group">
        <label for="evm-date">Tanggal Rekam</label>
        <input type="date" id="evm-date" class="form-control" value="${editData ? editData.Tanggal : new Date().toISOString().split('T')[0]}" required>
      </div>
    `;
  },

  getFormValues() {
    return {
      ID: document.getElementById('evm-id').value,
      PV: document.getElementById('evm-pv').value,
      EV: document.getElementById('evm-ev').value,
      AC: document.getElementById('evm-ac').value,
      Tanggal: document.getElementById('evm-date').value
    };
  }
};
