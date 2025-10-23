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
// === Store local minimal (peut être remplacé par IndexedDB plus tard) ===
const VH = {
  load() {
    try { return JSON.parse(localStorage.getItem('vh-data') || '{"accounts":[],"tx":[]}'); }
    catch { return { accounts:[], tx:[] }; }
  },
  save(data) { localStorage.setItem('vh-data', JSON.stringify(data)); },
  addAccount(acc) {
    const db = VH.load();
    db.accounts.push(acc);
    VH.save(db);
  },
  addTransactions(list) {
    const db = VH.load();
    db.tx.push(...list);
    VH.save(db);
  }
};

// === UI helpers ===
function openModal(id){ document.getElementById(id).hidden = false; }
function closeModal(id){ document.getElementById(id).hidden = true; }

// Ouvre/ferme la modale
document.getElementById('btn-add-account')?.addEventListener('click', () => openModal('add-account-modal'));
document.querySelector('#add-account-modal [data-close]')?.addEventListener('click', () => closeModal('add-account-modal'));

// Formulaire manuel
const manualBtn = document.getElementById('btn-add-manual');
const manualForm = document.getElementById('manual-form');
manualBtn?.addEventListener('click', () => { manualForm.hidden = !manualForm.hidden; });

document.getElementById('manual-save')?.addEventListener('click', () => {
  const acc = {
    id: 'acc_' + Math.random().toString(36).slice(2),
    name: document.getElementById('manual-name').value || 'Compte',
    type: document.getElementById('manual-type').value || 'Autre',
    currency: document.getElementById('manual-currency').value || 'EUR',
    balance: parseFloat(document.getElementById('manual-balance').value || '0'),
    source: 'manual',
    updatedAt: new Date().toISOString()
  };
  VH.addAccount(acc);
  recomputeKPIs();
  closeModal('add-account-modal');
});

// Import CSV/OFX (ici: CSV simple pour démarrer)
document.getElementById('file-import')?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();

  // Très simple parseur CSV: date,amount,category,label
  const lines = text.split(/\r?\n/).filter(Boolean);
  const tx = [];
  for (let i=1; i<lines.length; i++) { // saute l'en-tête
    const [date, amount, category, label] = lines[i].split(',');
    if (!date || !amount) continue;
    tx.push({
      id: 'tx_' + Math.random().toString(36).slice(2),
      date, amount: parseFloat(amount), category: category || 'Autre', label: label || ''
    });
  }
  VH.addTransactions(tx);

  // crée un compte “Imports CSV” si besoin
  const db = VH.load();
  if (!db.accounts.find(a => a.source === 'csv')) {
    VH.addAccount({ id:'acc_csv', name:'Imports CSV', type:'Autre', currency:'EUR', balance:0, source:'csv', updatedAt:new Date().toISOString() });
  }
  recomputeKPIs();
  closeModal('add-account-modal');
});

// Bouton “Connexion sécurisée” (agrégateur) — à brancher plus tard
document.getElementById('btn-link-oauth')?.addEventListener('click', async () => {
  alert("Ici on ouvrira le flux de l'agrégateur (OAuth). Pour l'instant, c'est une démo locale.");
  // Exemple futur :
  // const { link_token } = await fetch('/api/create-link-token').then(r=>r.json());
  // openPlaidLink(link_token, async (public_token) => {
  //   await fetch('/api/exchange-public-token', {method:'POST', body:JSON.stringify({public_token})});
  //   await fetch('/api/sync'); // remet à jour le store
  //   recomputeKPIs();
  // });
});

// === Recalcul des KPI (très simple) ===
function recomputeKPIs(){
  const db = VH.load();
  // Patrimoine = somme des soldes + somme des transactions (si on veut les cumuler)
  const balances = db.accounts.reduce((s,a)=>s+(a.balance||0), 0);
  const txSum = db.tx.reduce((s,t)=>s+(t.amount||0), 0);
  const wealth = balances + txSum;

  // Variation mensuelle (naïf) = somme des tx des 30 derniers jours
  const since = Date.now() - 30*24*3600*1000;
  const last30 = db.tx.filter(t => new Date(t.date).getTime() >= since)
                     .reduce((s,t)=>s+(t.amount||0), 0);
  const monthlyChangePct = wealth ? (last30 / Math.max(wealth-last30, 1)) * 100 : 0;

  // Dépenses du mois (montants négatifs)
  const expenses = db.tx.filter(t => new Date(t.date).getTime() >= since && t.amount < 0)
                        .reduce((s,t)=>s+Math.abs(t.amount), 0);

  // Objectif (placeholder)
  const goalPct = Math.min(100, Math.max(0, 72.2 + (Math.random()-0.5)*2)); // démo

  // Injections dans l’UI
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  const fmt = new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' });
  set('kpi-wealth', fmt.format(wealth));
  set('kpi-change', (monthlyChangePct>=0?'+':'') + monthlyChangePct.toFixed(1) + ' %');
  set('kpi-expenses', fmt.format(expenses));
  set('kpi-goal', goalPct.toFixed(1) + ' %');

  // Option : redessiner les charts si tu en as
  if (window.drawCharts) window.drawCharts(db);
}

// Au chargement
document.addEventListener('DOMContentLoaded', recomputeKPIs);
