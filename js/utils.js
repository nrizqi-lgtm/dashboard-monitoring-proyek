// Utility Helpers for Smart Campus Dashboard
const Utils = {
  // Format Number to Rupiah currency
  formatRupiah(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  },

  // Format percent representation
  formatPercent(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0%';
    return `${(num * (num <= 1 ? 100 : 1)).toFixed(1)}%`;
  },

  // Parse string values safely
  parseFloat(value, defaultValue = 0) {
    if (!value) return defaultValue;
    const cleanValue = String(value).replace(/[^0-9.-]/g, '');
    const result = parseFloat(cleanValue);
    return isNaN(result) ? defaultValue : result;
  },

  // Get status class based on metric/KPI performance
  getPerformanceBadge(val, limits = { green: 0.95, yellow: 0.85 }) {
    const num = parseFloat(val);
    if (num >= limits.green) return 'badge-green';
    if (num >= limits.yellow) return 'badge-yellow';
    return 'badge-red';
  },

  // Standard date formatting
  formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }
};
