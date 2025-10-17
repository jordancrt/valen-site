// ======== Données simulées ========
const demo = {
  wealthSeries: [15000, 15200, 15500, 15800, 16200, 16800, 17200, 17800, 18500, 19100, 19700, 20500],
  expensesSeries: [
    { label: 'Logement', value: 900 },
    { label: 'Courses', value: 320 },
    { label: 'Transport', value: 150 },
    { label: 'Loisirs', value: 180 },
    { label: 'Santé', value: 60 }
  ],
  allocation: [
    { label: 'Cash', value: 20 },
    { label: 'ETF', value: 50 },
    { label: 'Crypto', value: 15 },
    { label: 'Immobilier', value: 15 }
  ]
};

// ======== Formatage ========
const fmtMoney = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

// ======== KPIs ========
function updateKPIs() {
  const total = demo.wealthSeries.at(-1);
  const prev = demo.wealthSeries.at(-2);
  const variation = total - prev;
  const varPct = (variation / prev) * 100;
  const spend = demo.expensesSeries.reduce((a, b) => a + b.value, 0);

  document.getElementById('kpi-wealth').textContent = fmtMoney(total);
  document.getElementById('kpi-change').textContent = `${variation >= 0 ? '+' : ''}${varPct.toFixed(1)} %`;
  document.getElementById('kpi-expenses').textContent = fmtMoney(spend);
  document.getElementById('kpi-goal').textContent = Math.floor((total / 30000) * 100) + ' %';
}

// ======== Charts ========
function initCharts() {
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  // Wealth
  new Chart(document.getElementById('chartWealth'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        data: demo.wealthSeries,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,0.2)',
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  // Expenses
  new Chart(document.getElementById('chartExpenses'), {
    type: 'bar',
    data: {
      labels: demo.expensesSeries.map(e => e.label),
      datasets: [{
        data: demo.expensesSeries.map(e => e.value),
        backgroundColor: 'rgba(99,102,241,0.8)',
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Allocation
  new Chart(document.getElementById('chartAllocation'), {
    type: 'doughnut',
    data: {
      labels: demo.allocation.map(a => a.label),
      datasets: [{
        data: demo.allocation.map(a => a.value),
        backgroundColor: ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b']
      }]
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      cutout: '60%'
    }
  });
}

// ======== Lazy reveal (apparition fluide) ========
document.addEventListener('DOMContentLoaded', () => {
  updateKPIs();
  initCharts();
});
