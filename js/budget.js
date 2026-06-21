// Budget Module
const BudgetModule = {
  data: [],

  async load() {
    this.data = await SheetsAPI.readSheet(CONFIG.SHEETS.BUDGET);
    this.render();
  },

  render() {
    const tbody = document.querySelector('#table-budget tbody');
    
    let totalPlanned = 0;
    let totalActual = 0;

    if (tbody) {
      tbody.innerHTML = '';
      this.data.forEach(item => {
        const planned = Utils.parseFloat(item.Planned);
        const actual = Utils.parseFloat(item.Actual);
        const variance = planned - actual;
        
        totalPlanned += planned;
        totalActual += actual;

        let badgeClass = 'badge-green';
        if (item.Status === 'Overbudget') badgeClass = 'badge-red';
        else if (item.Status === 'Warning') badgeClass = 'badge-yellow';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${item.Kategori}</strong></td>
          <td>${Utils.formatRupiah(planned)}</td>
          <td>${Utils.formatRupiah(actual)}</td>
          <td style="color: ${variance >= 0 ? 'var(--color-green)' : 'var(--color-red)'}; font-weight: 500;">
            ${Utils.formatRupiah(variance)}
          </td>
          <td><span class="badge ${badgeClass}">${item.Status}</span></td>
          <td>
            <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openEditModal('budget', '${item.Kategori}')">Edit</button>
            <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--color-red);" onclick="deleteItem('budget', '${item.Kategori}')">Hapus</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Update Overview screen
    const overviewBudget = document.getElementById('overview-budget-planned');
    if (overviewBudget) {
      overviewBudget.innerText = Utils.formatRupiah(totalPlanned);
    }

    this.renderBudgetComparisonChart();
  },

  renderBudgetComparisonChart() {
    const chartDiv = document.getElementById('chart-budget-comparison');
    if (!chartDiv || typeof google === 'undefined' || !google.visualization) return;

    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'Kategori');
    dataTable.addColumn('number', 'Planned');
    dataTable.addColumn('number', 'Actual');

    this.data.forEach(item => {
      dataTable.addRow([
        item.Kategori,
        Utils.parseFloat(item.Planned),
        Utils.parseFloat(item.Actual)
      ]);
    });

    const options = {
      title: 'Perbandingan Planned vs Actual Budget',
      hAxis: { title: 'Kategori' },
      vAxis: { format: 'short' },
      colors: ['#3b82f6', '#ef4444'],
      chartArea: { width: '80%', height: '70%' }
    };

    const chart = new google.visualization.ColumnChart(chartDiv);
    chart.draw(dataTable, options);
  },

  getFormFields(editData = null) {
    return `
      <div class="form-group">
        <label for="budget-category">Kategori</label>
        <input type="text" id="budget-category" class="form-control" value="${editData ? editData.Kategori : ''}" placeholder="Contoh: Infrastruktur Server" required ${editData ? 'readonly' : ''}>
      </div>
      <div class="form-group">
        <label for="budget-planned">Planned Budget (Rupiah)</label>
        <input type="number" id="budget-planned" class="form-control" value="${editData ? editData.Planned : '0'}" required>
      </div>
      <div class="form-group">
        <label for="budget-actual">Actual Cost (Rupiah)</label>
        <input type="number" id="budget-actual" class="form-control" value="${editData ? editData.Actual : '0'}" required>
      </div>
      <div class="form-group">
        <label for="budget-status">Status</label>
        <select id="budget-status" class="form-control">
          <option value="Normal" ${editData && editData.Status === 'Normal' ? 'selected' : ''}>Normal</option>
          <option value="Warning" ${editData && editData.Status === 'Warning' ? 'selected' : ''}>Warning</option>
          <option value="Overbudget" ${editData && editData.Status === 'Overbudget' ? 'selected' : ''}>Overbudget</option>
        </select>
      </div>
    `;
  },

  getFormValues() {
    return {
      Kategori: document.getElementById('budget-category').value,
      Planned: document.getElementById('budget-planned').value,
      Actual: document.getElementById('budget-actual').value,
      Status: document.getElementById('budget-status').value
    };
  }
};
