// Milestone Module
const MilestoneModule = {
  data: [],

  async load() {
    this.data = await SheetsAPI.readSheet(CONFIG.SHEETS.MILESTONES);
    this.render();
  },

  render() {
    const tbody = document.querySelector('#table-milestones tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.data.forEach(item => {
      let badgeClass = 'badge-green';
      if (item.Status === 'Delayed') badgeClass = 'badge-yellow';
      else if (item.Status === 'Critical Delay') badgeClass = 'badge-red';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.Milestone}</strong></td>
        <td>${Utils.formatDate(item.Target)}</td>
        <td>${Utils.formatDate(item.Realisasi)}</td>
        <td><span class="badge ${badgeClass}">${item.Status}</span></td>
        <td>
          <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openEditModal('milestones', '${item.Milestone}')">Edit</button>
          <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--color-red);" onclick="deleteItem('milestones', '${item.Milestone}')">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    this.renderTimelineChart();
  },

  renderTimelineChart() {
    const chartDiv = document.getElementById('chart-milestone-timeline');
    if (!chartDiv || typeof google === 'undefined' || !google.visualization) return;

    try {
      const dataTable = new google.visualization.DataTable();
      dataTable.addColumn('string', 'Milestone');
      dataTable.addColumn('date', 'Mulai');
      dataTable.addColumn('date', 'Selesai');

      // Karena data sheet kita sederhana (hanya target selesai), kita asumsikan pengerjaan milestone berlangsung 30 hari sebelumnya untuk keperluan visualisasi timeline
      this.data.forEach(item => {
        const targetDate = new Date(item.Target);
        if (isNaN(targetDate.getTime())) return;
        
        const startDate = new Date(targetDate.getTime());
        startDate.setDate(startDate.getDate() - 30);

        dataTable.addRow([
          item.Milestone,
          startDate,
          targetDate
        ]);
      });

      const options = {
        timeline: { showRowLabels: true },
        avoidOverlappingGridLines: false
      };

      const chart = new google.visualization.Timeline(chartDiv);
      chart.draw(dataTable, options);
    } catch (e) {
      console.error("Error drawing timeline chart: ", e);
      chartDiv.innerHTML = '<div style="color:var(--color-text-secondary); text-align:center; padding-top:40px;">Gagal memuat timeline. Format tanggal tidak didukung.</div>';
    }
  },

  getFormFields(editData = null) {
    return `
      <div class="form-group">
        <label for="milestone-name">Nama Milestone</label>
        <input type="text" id="milestone-name" class="form-control" value="${editData ? editData.Milestone : ''}" placeholder="Contoh: Deployment ke Production" required ${editData ? 'readonly' : ''}>
      </div>
      <div class="form-group">
        <label for="milestone-target">Tanggal Target</label>
        <input type="date" id="milestone-target" class="form-control" value="${editData ? editData.Target : ''}" required>
      </div>
      <div class="form-group">
        <label for="milestone-realization">Tanggal Realisasi (Opsional)</label>
        <input type="date" id="milestone-realization" class="form-control" value="${editData ? editData.Realisasi : ''}">
      </div>
      <div class="form-group">
        <label for="milestone-status">Status</label>
        <select id="milestone-status" class="form-control">
          <option value="On Track" ${editData && editData.Status === 'On Track' ? 'selected' : ''}>On Track</option>
          <option value="Delayed" ${editData && editData.Status === 'Delayed' ? 'selected' : ''}>Delayed</option>
          <option value="Critical Delay" ${editData && editData.Status === 'Critical Delay' ? 'selected' : ''}>Critical Delay</option>
        </select>
      </div>
    `;
  },

  getFormValues() {
    return {
      Milestone: document.getElementById('milestone-name').value,
      Target: document.getElementById('milestone-target').value,
      Realisasi: document.getElementById('milestone-realization').value,
      Status: document.getElementById('milestone-status').value
    };
  }
};
