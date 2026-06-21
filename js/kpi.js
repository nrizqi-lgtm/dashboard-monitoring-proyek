// KPI Module
const KPIModule = {
  data: [],

  async load() {
    this.data = await SheetsAPI.readSheet(CONFIG.SHEETS.KPI);
    this.render();
  },

  render() {
    const cardsContainer = document.getElementById('kpi-cards-container');
    const tbody = document.querySelector('#table-kpi tbody');
    
    if (cardsContainer) {
      cardsContainer.innerHTML = '';
      this.data.forEach(kpi => {
        const val = Utils.parseFloat(kpi.Aktual);
        const target = Utils.parseFloat(kpi.Target);
        
        let badgeClass = 'badge-blue';
        if (kpi.Status === 'On Track') badgeClass = 'badge-green';
        else if (kpi.Status === 'At Risk') badgeClass = 'badge-yellow';
        else if (kpi.Status === 'Critical') badgeClass = 'badge-red';

        const displayVal = kpi.Nama.toLowerCase().includes('rate') || kpi.Nama.toLowerCase().includes('availability') 
          ? Utils.formatPercent(val)
          : `${val} ms`;

        const displayTarget = kpi.Nama.toLowerCase().includes('rate') || kpi.Nama.toLowerCase().includes('availability') 
          ? Utils.formatPercent(target)
          : `${target} ms`;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-header">
            <span class="card-title">${kpi.Nama}</span>
            <span class="badge ${badgeClass}">${kpi.Status}</span>
          </div>
          <div class="card-value">${displayVal}</div>
          <div class="card-desc">Target: ${displayTarget}</div>
        `;
        cardsContainer.appendChild(card);
      });
    }

    if (tbody) {
      tbody.innerHTML = '';
      this.data.forEach(kpi => {
        const isPercent = kpi.Nama.toLowerCase().includes('rate') || kpi.Nama.toLowerCase().includes('availability');
        const tr = document.createElement('tr');
        
        let badgeClass = 'badge-blue';
        if (kpi.Status === 'On Track') badgeClass = 'badge-green';
        else if (kpi.Status === 'At Risk') badgeClass = 'badge-yellow';
        else if (kpi.Status === 'Critical') badgeClass = 'badge-red';

        tr.innerHTML = `
          <td><strong>${kpi.ID}</strong></td>
          <td>${kpi.Nama}</td>
          <td>${isPercent ? Utils.formatPercent(kpi.Target) : kpi.Target}</td>
          <td>${isPercent ? Utils.formatPercent(kpi.Aktual) : kpi.Aktual}</td>
          <td><span class="badge ${badgeClass}">${kpi.Status}</span></td>
          <td>
            <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openEditModal('kpi', '${kpi.ID}')">Edit</button>
            <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--color-red);" onclick="deleteItem('kpi', '${kpi.ID}')">Hapus</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  },

  getFormFields(editData = null) {
    return `
      <div class="form-group">
        <label for="kpi-id">KPI ID</label>
        <input type="text" id="kpi-id" class="form-control" value="${editData ? editData.ID : 'K-' + (Date.now() % 1000)}" required ${editData ? 'readonly' : ''}>
      </div>
      <div class="form-group">
        <label for="kpi-name">Nama Indicator</label>
        <input type="text" id="kpi-name" class="form-control" value="${editData ? editData.Nama : ''}" placeholder="Contoh: Student Attendance Rate" required>
      </div>
      <div class="form-group">
        <label for="kpi-target">Target</label>
        <input type="number" id="kpi-target" class="form-control" step="0.001" value="${editData ? editData.Target : '0.0'}" required>
      </div>
      <div class="form-group">
        <label for="kpi-actual">Realisasi / Aktual</label>
        <input type="number" id="kpi-actual" class="form-control" step="0.001" value="${editData ? editData.Aktual : '0.0'}" required>
      </div>
      <div class="form-group">
        <label for="kpi-status">Status</label>
        <select id="kpi-status" class="form-control">
          <option value="On Track" ${editData && editData.Status === 'On Track' ? 'selected' : ''}>On Track</option>
          <option value="At Risk" ${editData && editData.Status === 'At Risk' ? 'selected' : ''}>At Risk</option>
          <option value="Critical" ${editData && editData.Status === 'Critical' ? 'selected' : ''}>Critical</option>
        </select>
      </div>
    `;
  },

  getFormValues() {
    return {
      ID: document.getElementById('kpi-id').value,
      Nama: document.getElementById('kpi-name').value,
      Target: document.getElementById('kpi-target').value,
      Aktual: document.getElementById('kpi-actual').value,
      Status: document.getElementById('kpi-status').value
    };
  }
};
