// Core Dashboard Controller
document.addEventListener('DOMContentLoaded', () => {
  DashboardController.init();
});

const DashboardController = {
  activeTab: 'overview',
  refreshInterval: null,

  async init() {
    this.setupEventListeners();
    this.startAutoRefresh();
    
    // Load Google Charts & then init data loading
    if (typeof google !== 'undefined') {
      google.charts.load('current', { 
        packages: ['corechart', 'gauge', 'timeline'],
        language: 'id'
      });
      google.charts.setOnLoadCallback(() => this.loadAllModules());
    } else {
      console.warn("Google Charts library not loaded.");
      await this.loadAllModules();
    }
  },

  setupEventListeners() {
    // Navigation Links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = link.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });

    // Refresh Button
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        const statusBadge = document.getElementById('sync-status');
        if (statusBadge) {
          statusBadge.innerText = 'Refreshing...';
          statusBadge.className = 'badge badge-yellow';
        }
        await this.loadAllModules();
        if (statusBadge) {
          statusBadge.innerText = SheetsAPI.isConfigured() ? 'Connected' : 'Offline Mode';
          statusBadge.className = SheetsAPI.isConfigured() ? 'badge badge-green' : 'badge-blue';
        }
      });
    }
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    
    // Update navigation active class
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-tab') === tabId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update tab-content active class
    document.querySelectorAll('.tab-content').forEach(content => {
      if (content.id === `tab-${tabId}`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // Update Title Header
    const titles = {
      overview: 'Dashboard Overview',
      tasks: 'Project Tasks Tracker',
      kpi: 'Key Performance Indicators (KPI)',
      evm: 'Earned Value Management (EVM)',
      risk: 'Risk Mitigation Matrix',
      budget: 'Financial Budget Tracking',
      milestones: 'Project Schedule & Milestones'
    };
    document.getElementById('page-title').innerText = titles[tabId] || 'Dashboard';
    
    // Redraw charts if on relevant tab
    this.triggerChartsRedraw();
  },

  async loadAllModules() {
    try {
      console.log('Loading all dashboard data...');
      
      // Load modules in parallel
      await Promise.all([
        TasksModule.load(),
        KPIModule.load(),
        EVMModule.load(),
        RiskModule.load(),
        BudgetModule.load(),
        MilestoneModule.load()
      ]);

      // Calculate and render Overall Progress Gauge in Overview
      this.renderOverallProgressGauge();

    } catch (error) {
      console.error("Error loading dashboard modules:", error);
    }
  },

  renderOverallProgressGauge() {
    const ringFill = document.getElementById('gauge-ring-fill');
    const ringValue = document.getElementById('gauge-ring-value');
    if (!ringFill || !ringValue) return;

    // Hitung rata-rata progress dari Tasks
    let totalProgress = 0;
    const taskCount = TasksModule.data.length;
    
    if (taskCount > 0) {
      const sum = TasksModule.data.reduce((acc, t) => acc + Utils.parseFloat(t.Progress), 0);
      totalProgress = Math.round((sum / taskCount) * 100);
    }

    // SVG circle circumference math
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (totalProgress / 100) * circumference;

    ringFill.style.strokeDasharray = circumference;
    ringFill.style.strokeDashoffset = circumference;

    // Animate after brief delay
    requestAnimationFrame(() => {
      ringFill.style.strokeDashoffset = offset;
    });

    // Color based on value
    let color = '#f43f5e'; // rose < 50
    if (totalProgress >= 80) color = '#10b981'; // emerald
    else if (totalProgress >= 50) color = '#f59e0b'; // amber
    ringFill.style.stroke = color;

    // Animate number counter
    let current = 0;
    const step = Math.max(1, Math.floor(totalProgress / 30));
    const counter = setInterval(() => {
      current += step;
      if (current >= totalProgress) {
        current = totalProgress;
        clearInterval(counter);
      }
      ringValue.textContent = current;
    }, 20);
  },

  triggerChartsRedraw() {
    if (typeof google === 'undefined' || !google.visualization) return;
    
    if (this.activeTab === 'overview') {
      this.renderOverallProgressGauge();
      const metrics = EVMModule.calculateMetrics();
      if (metrics) {
        EVMModule.renderOverviewPerformanceIndices(metrics.SPI, metrics.CPI);
        EVMModule.renderOverviewBudgetProjection(metrics.BAC, metrics.EAC);
      }
    } else if (this.activeTab === 'evm') {
      EVMModule.renderTrendChart();
    } else if (this.activeTab === 'budget') {
      BudgetModule.renderBudgetComparisonChart();
    } else if (this.activeTab === 'milestones') {
      MilestoneModule.renderTimelineChart();
    }
  },

  startAutoRefresh() {
    // Refresh every 60 seconds
    this.refreshInterval = setInterval(() => {
      console.log('Auto-refreshing dashboard...');
      this.loadAllModules();
    }, 60000);
  }
};

// --- CRUD & Form Helpers ---

const ModuleMap = {
  tasks: TasksModule,
  kpi: KPIModule,
  evm: EVMModule,
  risk: RiskModule,
  budget: BudgetModule,
  milestones: MilestoneModule
};

function openAddModal(moduleKey) {
  const modal = document.getElementById('crud-modal');
  const title = document.getElementById('modal-title');
  const formType = document.getElementById('form-type');
  const formId = document.getElementById('form-id');
  const fieldsContainer = document.getElementById('modal-fields');

  title.innerText = `Tambah Data ${moduleKey.toUpperCase()}`;
  formType.value = moduleKey;
  formId.value = ''; // Empty means ADD

  const moduleInstance = ModuleMap[moduleKey];
  if (moduleInstance) {
    fieldsContainer.innerHTML = moduleInstance.getFormFields();
  }

  modal.classList.add('active');
}

function openEditModal(moduleKey, recordId) {
  const modal = document.getElementById('crud-modal');
  const title = document.getElementById('modal-title');
  const formType = document.getElementById('form-type');
  const formId = document.getElementById('form-id');
  const fieldsContainer = document.getElementById('modal-fields');

  title.innerText = `Edit Data ${moduleKey.toUpperCase()}`;
  formType.value = moduleKey;
  formId.value = recordId;

  const moduleInstance = ModuleMap[moduleKey];
  if (moduleInstance) {
    // Temukan data target
    const targetData = moduleInstance.data.find(item => 
      (item.ID === recordId || item.id === recordId || item.Kategori === recordId || item.Milestone === recordId)
    );
    fieldsContainer.innerHTML = moduleInstance.getFormFields(targetData);
  }

  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('crud-modal');
  modal.classList.remove('active');
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const moduleKey = document.getElementById('form-type').value;
  const formId = document.getElementById('form-id').value;
  const moduleInstance = ModuleMap[moduleKey];

  if (!moduleInstance) return;

  const formData = moduleInstance.getFormValues();
  let success = false;

  const targetSheetName = CONFIG.SHEETS[moduleKey.toUpperCase()];

  if (formId === '') {
    // CREATE
    success = await SheetsAPI.appendRow(targetSheetName, formData);
  } else {
    // UPDATE
    success = await SheetsAPI.updateRow(targetSheetName, formId, formData);
  }

  if (success) {
    closeModal();
    // Reload dan refresh interface
    await DashboardController.loadAllModules();
  } else {
    alert('Gagal memproses data.');
  }
}

async function deleteItem(moduleKey, recordId) {
  if (confirm(`Apakah Anda yakin ingin menghapus data "${recordId}"?`)) {
    const targetSheetName = CONFIG.SHEETS[moduleKey.toUpperCase()];
    const success = await SheetsAPI.deleteRow(targetSheetName, recordId);
    if (success) {
      await DashboardController.loadAllModules();
    } else {
      alert('Gagal menghapus data.');
    }
  }
}
