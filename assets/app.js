// -- util --
const LS = window.localStorage;

// Données démo si vide
const seed = {
  wealth: [12000,13000,12500,14000,15500,16000,15800,17000,18200,19000,20500,21200],
  expenses: [
    { label: 'Logement', value: 850 },
    { label: 'Courses', value: 280 },
    { label: 'Transport', value: 120 },
    { label: 'Loisirs', value: 160 },
    { label: 'Santé', value: 60 }
  ],
  allocation: [
    { label: 'Cash', value: 20 },
    { label: 'ETF', value: 55 },
    { label: 'Crypto', value: 10 },
    { label: 'Immobilier', value: 15 }
  ],
  monthSpend: 1470,
  total: 21200,
  goalProgress: 62
};

function fmtEUR(n){ return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n); }

document.addEventListener('DOMContentLoaded', () => {
  // ===== KPIs =====
  document.getElementById('kpi-total').textContent = fmtEUR(seed.total);
  const variation = seed.wealth.at(-1) - seed.wealth.at(-2);
  const varPct = (variation / seed.wealth.at(-2)) * 100;
  document.getElementById('kpi-variation').textContent =
    `${variation >= 0 ? '+' : ''}${fmtEUR(variation)} (${varPct.toFixed(1)}%)`;
  document.getElementById('kpi-expenses').textContent = fmtEUR(seed.monthSpend);
  document.getElementById('kpi-goal').textContent = seed.goalProgress + '%';

  // ===== Charts =====
  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];

  // Wealth (line)
  new Chart(document.getElementById('chartWealth'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        data: seed.wealth,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display:false } },
      scales: {
        x: { grid: { display:false } },
        y: { grid: { color:'rgba(255,255,255,.08)' } }
      }
    }
  });

  // Expenses (bar)
  new Chart(document.getElementById('chartExpenses'), {
    type: 'bar',
    data: {
      labels: seed.expenses.map(e=>e.label),
      datasets: [{ data: seed.expenses.map(e=>e.value), borderWidth:1 }]
    },
    options: {
      plugins: { legend: { display:false } },
      scales: { y: { beginAtZero:true } }
    }
  });

  // Allocation (doughnut)
  new Chart(document.getElementById('chartAllocation'), {
    type: 'doughnut',
    data: {
      labels: seed.allocation.map(a=>a.label),
      datasets: [{ data: seed.allocation.map(a=>a.value) }]
    },
    options: {
      plugins: { legend: { position:'bottom' } },
      cutout: '58%'
    }
  });

  // ===== Form local add =====
  const form = document.getElementById('op-form');
  if (form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const amount = parseFloat(data.amount || '0');
      if (data.type === 'expense') {
        // met à jour dépense mensuelle locale
        seed.monthSpend += Math.abs(amount);
        document.getElementById('kpi-expenses').textContent = fmtEUR(seed.monthSpend);
      } else if (data.type === 'income' || data.type === 'asset') {
        seed.total += Math.abs(amount);
        document.getElementById('kpi-total').textContent = fmtEUR(seed.total);
      }
      form.reset();
    });
  }
});
