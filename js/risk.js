// Risk Management Module
const RiskModule = {
  data: [],

  async load() {
    this.data = await SheetsAPI.readSheet(CONFIG.SHEETS.RISK);
    this.render();
  },

  getRiskLevel(score) {
    if (score >= 12) return 'High';
    if (score >= 6) return 'Medium';
    return 'Low';
  },

  render() {
    const tbody = document.querySelector('#table-risk tbody');
    const heatmap = document.getElementById('risk-heatmap');
    
    // Hitung level risiko tertinggi untuk Overview screen
    let highestScore = 0;
    let highestLevel = 'Low';

    if (tbody) {
      tbody.innerHTML = '';
      this.data.forEach(item => {
        const likelihood = parseInt(item.Likelihood) || 0;
        const impact = parseInt(item.Impact) || 0;
        const score = likelihood * impact;
        
        if (score > highestScore) {
          highestScore = score;
          highestLevel = this.getRiskLevel(score);
        }

        let badgeClass = 'badge-green';
        const level = this.getRiskLevel(score);
        if (level === 'High') badgeClass = 'badge-red';
        else if (level === 'Medium') badgeClass = 'badge-yellow';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${item.ID}</strong></td>
          <td>${item.Risiko}</td>
          <td>${likelihood}</td>
          <td>${impact}</td>
          <td><span class="badge ${badgeClass}">${score} (${level})</span></td>
          <td>${item.Mitigasi}</td>
          <td>
            <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openEditModal('risk', '${item.ID}')">Edit</button>
            <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--color-red);" onclick="deleteItem('risk', '${item.ID}')">Hapus</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Update Overview screen
    const overviewRisk = document.getElementById('overview-risk-level');
    if (overviewRisk) {
      overviewRisk.innerText = `${highestLevel} (Max: ${highestScore})`;
      overviewRisk.className = 'card-value';
      if (highestLevel === 'High') overviewRisk.style.color = 'var(--color-red)';
      else if (highestLevel === 'Medium') overviewRisk.style.color = 'var(--color-yellow)';
      else overviewRisk.style.color = 'var(--color-green)';
    }

    if (heatmap) {
      this.renderHeatmap(heatmap);
    }
  },

  renderHeatmap(container) {
    container.innerHTML = '';
    
    // Petakan jumlah risiko pada koordinat (Likelihood, Impact)
    // Map key format: "L,I" -> count
    const riskCounts = {};
    this.data.forEach(item => {
      const key = `${item.Likelihood},${item.Impact}`;
      riskCounts[key] = (riskCounts[key] || 0) + 1;
    });

    // Render header row (Likelihood 1 to 5)
    // Left-top corner empty cell
    const emptyCell = document.createElement('div');
    emptyCell.className = 'heatmap-label';
    emptyCell.innerText = 'I \\ L';
    container.appendChild(emptyCell);

    for (let l = 1; l <= 5; l++) {
      const label = document.createElement('div');
      label.className = 'heatmap-label';
      label.innerText = `L-${l}`;
      container.appendChild(label);
    }

    // Render cells row-by-row starting from Impact 5 down to 1
    for (let i = 5; i >= 1; i--) {
      // Row label
      const rowLabel = document.createElement('div');
      rowLabel.className = 'heatmap-label';
      rowLabel.innerText = `I-${i}`;
      container.appendChild(rowLabel);

      for (let l = 1; l <= 5; l++) {
        const score = l * i;
        const count = riskCounts[`${l},${i}`] || 0;
        
        const cell = document.createElement('div');
        let levelClass = 'heatmap-cell-low';
        
        if (score >= 12) levelClass = 'heatmap-cell-high';
        else if (score >= 6) levelClass = 'heatmap-cell-medium';

        cell.className = `heatmap-cell ${levelClass}`;
        cell.innerHTML = `
          <span>${count > 0 ? `<strong>${count}</strong>` : ''}</span>
          <span style="font-size:0.6rem; position:absolute; bottom:2px; right:4px; opacity:0.7;">${score}</span>
        `;
        cell.title = `Likelihood: ${l}, Impact: ${i} (Score: ${score}). Total Risks: ${count}`;
        
        container.appendChild(cell);
      }
    }
  },

  getFormFields(editData = null) {
    return `
      <div class="form-group">
        <label for="risk-id">Risk ID</label>
        <input type="text" id="risk-id" class="form-control" value="${editData ? editData.ID : 'R-' + (Date.now() % 1000)}" required ${editData ? 'readonly' : ''}>
      </div>
      <div class="form-group">
        <label for="risk-title">Definisi Risiko</label>
        <input type="text" id="risk-title" class="form-control" value="${editData ? editData.Risiko : ''}" placeholder="Contoh: Keterlambatan integrasi API" required>
      </div>
      <div class="form-group">
        <label for="risk-likelihood">Likelihood (1 - 5)</label>
        <select id="risk-likelihood" class="form-control">
          ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${editData && parseInt(editData.Likelihood) === n ? 'selected' : n === 3 ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="risk-impact">Impact (1 - 5)</label>
        <select id="risk-impact" class="form-control">
          ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${editData && parseInt(editData.Impact) === n ? 'selected' : n === 3 ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="risk-mitigation">Rencana Mitigasi</label>
        <textarea id="risk-mitigation" class="form-control" placeholder="Rencana mitigasi risiko..." required>${editData ? editData.Mitigasi : ''}</textarea>
      </div>
    `;
  },

  getFormValues() {
    return {
      ID: document.getElementById('risk-id').value,
      Risiko: document.getElementById('risk-title').value,
      Likelihood: document.getElementById('risk-likelihood').value,
      Impact: document.getElementById('risk-impact').value,
      Skor: String(parseInt(document.getElementById('risk-likelihood').value) * parseInt(document.getElementById('risk-impact').value)),
      Mitigasi: document.getElementById('risk-mitigation').value
    };
  }
};
