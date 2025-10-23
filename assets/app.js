/* ValenHub – data locale + KPIs + charts (Chart.js) */

const LS = window.localStorage;
const DATA_KEY = 'vh-data-v1';

// ====== Données démo (si rien en local) ======
const demoData = {
  wealthHistory: [31500, 32200, 33000, 33750, 34100, 34600, 35250, 36000, 36550, 37000, 37450, 37545],
  monthlyChangePct: 6.0,                     // %
  monthlyExpenses: 8135,                     // €
  goal: { target: 52000, current: 37545 },   // €
  expensesByCat: { Logement: 1200, Courses: 620, Transport: 210, Loisirs: 380, Santé: 140, Abonnements: 95 },
  allocation:  { Liquidités: 22, Actions: 48, Crypto: 8, Immobilier: 18, Autres: 4 }
};

// ====== Utils ======
const fmt = new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 });
const pct = (x) => `${x.toFixed(1)} %`;

// ====== Load / Save ======
function loadData() {
  try {
    const raw = LS.getItem(DATA_KEY);
    if (!raw) return demoData;
    return JSON.parse(raw);
  } catch { return demoData; }
}
function saveData(d){ try { LS.setItem(DATA_KEY, JSON.stringify(d)); } catch {} }

// ====== KPIs ======
function updateKPIs(d) {
  const wealth = d.wealthHistory[d.wealthHistory.length - 1] || 0;
  document.getElementById('kpi-wealth').textContent   = fmt.format(wealth);
  document.getElementById('kpi-change').textContent   = pct(d.monthlyChangePct);
  document.getElementById('kpi-expenses').textContent = fmt.format(d.monthlyExpenses);

  const goalPct = Math.max(0, Math.min(100, (d.goal.current / d.goal.target) * 100));
  document.getElementById('kpi-goal').textContent = pct(goalPct);
}

// ====== Charts ======
let wealthChart, expChart, allocChart;

function renderCharts(d) {
  // On retire les skeletons et on montre les canvas
  for (const s of document.querySelectorAll('.skeleton')) s.remove();
  for (const c of document.querySelectorAll('canvas[hidden]')) c.hidden = false;

  // Labels mois (derniers 12)
  const labels = ['M-11','M-10','M-9','M-8','M-7','M-6','M-5','M-4','M-3','M-2','M-1','M'];

  // 1) Wealth line
  const ctxW = document.getElementById('chartWealth').getContext('2d');
  wealthChart?.destroy();
  wealthChart = new Chart(ctxW, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Patrimoine (€)',
        data: d.wealthHistory,
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: v => fmt.format(v) } } }
    }
  });

  // 2) Dépenses barres
  const ctxE = document.getElementById('chartExpenses').getContext('2d');
  expChart?.destroy();
  expChart = new Chart(ctxE, {
    type: 'bar',
    data: {
      labels: Object.keys(d.expensesByCat),
      datasets: [{ label: 'Dépenses (€)', data: Object.values(d.expensesByCat) }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: v => fmt.format(v) } } }
    }
  });

  // 3) Allocation donut
  const ctxA = document.getElementById('chartAllocation').getContext('2d');
  allocChart?.destroy();
  allocChart = new Chart(ctxA, {
    type: 'doughnut',
    data: {
      labels: Object.keys(d.allocation),
      datasets: [{ data: Object.values(d.allocation) }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// ====== Init ======
document.addEventListener('DOMContentLoaded', () => {
  const data = loadData();
  updateKPIs(data);
  renderCharts(data);

  // Petit “reveal” sur les cartes
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('in');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
});
