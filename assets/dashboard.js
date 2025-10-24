// ====== STATE LOCAL ======
const LS = window.localStorage;
const LS_KEY = 'vh-accounts';

let state = {
  accounts: [],   // { id, name, balance }
  expenses: 8135, // démo
  goal: 50000,    // objectif fictif
};

function loadState() {
  try {
    const raw = LS.getItem(LS_KEY);
    if (raw) state.accounts = JSON.parse(raw);
  } catch {}
}

function saveState() {
  try { LS.setItem(LS_KEY, JSON.stringify(state.accounts)); } catch {}
}

function formatCurrency(v) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

// ====== KPI CALC ======
function calcWealth() {
  return state.accounts.reduce((sum,a)=> sum + (Number(a.balance)||0), 0);
}
function calcMonthlyChange(wealth) {
  // démo simple : 3%–6%
  return Math.round((wealth ? 3 + Math.random()*3 : 0) * 10) / 10;
}
function calcGoalProgress(wealth) {
  return Math.max(0, Math.min(100, Math.round((wealth / state.goal) * 100)));
}

// ====== DOM HOOKS ======
const elWealth   = document.getElementById('kpi-wealth');
const elChange   = document.getElementById('kpi-change');
const elExpenses = document.getElementById('kpi-expenses');
const elGoal     = document.getElementById('kpi-goal');
const elAccountsInfo = document.getElementById('accounts-info');

function updateKPIs() {
  const wealth = calcWealth();
  const change = calcMonthlyChange(wealth);
  const goal   = calcGoalProgress(wealth);

  elWealth && (elWealth.textContent = formatCurrency(wealth));
  elChange && (elChange.textContent = `${change} %`);
  elExpenses && (elExpenses.textContent = formatCurrency(state.expenses));
  elGoal && (elGoal.textContent = `${goal} %`);

  // info comptes
  const n = state.accounts.length;
  if (elAccountsInfo) {
    elAccountsInfo.textContent = n
      ? `${n} ${n>1 ? 'comptes' : 'compte'} connectés — patrimoine: ${formatCurrency(wealth)}`
      : `Aucun compte pour le moment.`;
  }

  // refresh chart avec wealth (démo)
  renderWealthChartWith(wealth);
}

// ====== ACTIONS ======
function addAccountFlow() {
  const name = prompt('Nom du compte (ex: Compte courant, Livret A, PEA) :');
  if (!name) return;

  const balStr = prompt('Solde initial en € (ex: 2500) :', '2500');
  const balance = Number(balStr.replace(',', '.'));
  if (Number.isNaN(balance)) return alert('Montant invalide.');

  state.accounts.push({ id: Date.now(), name, balance });
  saveState();
  updateKPIs();
}

function demoSeed() {
  state.accounts = [
    { id: 1, name: 'Courant', balance: 3200 },
    { id: 2, name: 'Livret A', balance: 8200 },
    { id: 3, name: 'PEA', balance: 19700 },
  ];
  saveState();
  updateKPIs();
}

function resetDemo() {
  if (!confirm('Réinitialiser les comptes locaux ?')) return;
  state.accounts = [];
  saveState();
  updateKPIs();
}

function refreshData() {
  // Pour plus tard: appel API -> synchro agrégateur
  updateKPIs();
}

// boutons
document.getElementById('btn-add')?.addEventListener('click', addAccountFlow);
document.getElementById('btn-demo')?.addEventListener('click', demoSeed);
document.getElementById('btn-reset')?.addEventListener('click', resetDemo);
document.getElementById('btn-refresh')?.addEventListener('click', refreshData);

// ====== CHARTS (wealth) ======
let wealthChart;

function renderWealthChartWith(currentWealth) {
  const ctx = document.getElementById('chartWealth');
  if (!ctx) return;

  // labels sur 12 mois (démo)
  const months = Array.from({length:12}, (_,i)=> new Date(Date.now() - (11-i)*30*24*3600*1000))
    .map(d => d.toLocaleDateString('fr-FR',{ month:'short'}));

  // série démo lissée autour du patrimoine actuel
  let value = currentWealth || 30000;
  const data = months.map(() => {
    value = value * (0.98 + Math.random()*0.05);
    return Math.max(0, Math.round(value));
  });

  // enlève le squelette au premier rendu
  ctx.previousElementSibling?.remove();

  if (wealthChart) wealthChart.destroy();
  wealthChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Patrimoine',
        data,
        borderWidth: 2,
        tension: 0.28,
        pointRadius: 0,
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: {
          grid: { display:false },
          ticks: { maxRotation:0, autoSkip:true }
        },
        y: {
          grid: { color:'rgba(255,255,255,0.08)'},
          ticks: { callback: v => formatCurrency(v) }
        }
      },
      interaction: { mode: 'nearest', intersect: false }
    }
  });
}

// ====== INIT ======
function init() {
  loadState();
  updateKPIs();
  // premier rendu si aucun compte
  if (!state.accounts.length) renderWealthChartWith(30000);
  document.getElementById('range-select')?.addEventListener('change', updateKPIs);
}
document.addEventListener('DOMContentLoaded', init);
