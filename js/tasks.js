// Tasks Module
const TasksModule = {
  data: [],

  async load() {
    this.data = await SheetsAPI.readSheet(CONFIG.SHEETS.TASKS);
    this.render();
  },

  render() {
    const tbody = document.querySelector('#table-tasks tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    this.data.forEach(task => {
      const progressVal = Utils.parseFloat(task.Progress);
      const progressPercent = Utils.formatPercent(progressVal);
      
      let badgeClass = 'badge-blue';
      if (task.Status === 'Selesai') badgeClass = 'badge-green';
      else if (task.Status === 'Dalam Proses') badgeClass = 'badge-yellow';
      else if (task.Status === 'Belum Mulai') badgeClass = 'badge-red';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${task.ID}</strong></td>
        <td>${task.Nama}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem; width: 150px;">
            <div style="background-color: var(--color-border); border-radius: 9999px; height: 8px; flex-grow: 1; overflow: hidden;">
              <div style="background-color: var(--color-primary); width: ${progressPercent}; height: 100%;"></div>
            </div>
            <span style="font-size: 0.75rem; font-weight: 600;">${progressPercent}</span>
          </div>
        </td>
        <td><span class="badge ${badgeClass}">${task.Status}</span></td>
        <td>${task.PIC}</td>
        <td>
          <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openEditModal('tasks', '${task.ID}')">Edit</button>
          <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--color-red);" onclick="deleteItem('tasks', '${task.ID}')">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  // Get field definitions for Modal Form
  getFormFields(editData = null) {
    return `
      <div class="form-group">
        <label for="task-id">Task ID</label>
        <input type="text" id="task-id" class="form-control" value="${editData ? editData.ID : 'T-' + (Date.now() % 1000)}" required ${editData ? 'readonly' : ''}>
      </div>
      <div class="form-group">
        <label for="task-name">Nama Task</label>
        <input type="text" id="task-name" class="form-control" value="${editData ? editData.Nama : ''}" placeholder="Contoh: Modul KRS Online" required>
      </div>
      <div class="form-group">
        <label for="task-progress">Progress (0.0 - 1.0)</label>
        <input type="number" id="task-progress" class="form-control" step="0.01" min="0" max="1" value="${editData ? editData.Progress : '0.0'}" required>
      </div>
      <div class="form-group">
        <label for="task-status">Status</label>
        <select id="task-status" class="form-control">
          <option value="Belum Mulai" ${editData && editData.Status === 'Belum Mulai' ? 'selected' : ''}>Belum Mulai</option>
          <option value="Dalam Proses" ${editData && editData.Status === 'Dalam Proses' ? 'selected' : ''}>Dalam Proses</option>
          <option value="Selesai" ${editData && editData.Status === 'Selesai' ? 'selected' : ''}>Selesai</option>
        </select>
      </div>
      <div class="form-group">
        <label for="task-pic">PIC (Penanggung Jawab)</label>
        <input type="text" id="task-pic" class="form-control" value="${editData ? editData.PIC : ''}" placeholder="Nama PIC" required>
      </div>
    `;
  },

  // Extract form values
  getFormValues() {
    return {
      ID: document.getElementById('task-id').value,
      Nama: document.getElementById('task-name').value,
      Progress: document.getElementById('task-progress').value,
      Status: document.getElementById('task-status').value,
      PIC: document.getElementById('task-pic').value
    };
  }
};
