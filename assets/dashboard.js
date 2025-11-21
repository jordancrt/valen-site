// Données démo basiques (tu pourras les remplacer plus tard par du vrai input utilisateur)
let demoAccounts = JSON.parse(localStorage.getItem("valenhub-demo-accounts") || "null");

if (!demoAccounts) {
  demoAccounts = [
    { name: "Compte courant", type: "liquidites", balance: 3200 },
    { name: "Livret A",       type: "liquidites", balance: 5700 },
    { name: "PEA ETF Monde",  type: "invest",     balance: 8400 },
    { name: "Crypto (ETH/BTC)", type: "invest",   balance: 2600 },
    { name: "Crédit auto",    type: "dette",      balance: -4200 }
  ];
  localStorage.setItem("valenhub-demo-accounts", JSON.stringify(demoAccounts));
}

// Budget démo très simple
const demoBudget = [
  { cat: "Logement",   budget: 900, spent: 780 },
  { cat: "Courses",    budget: 350, spent: 260 },
  { cat: "Transport",  budget: 120, spent: 95  },
  { cat: "Loisirs",    budget: 150, spent: 80  }
];

let lineChart = null;
let donutChart = null;

// Format monétaire
function fmtEUR(v) {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// ==== KPIs ====
function updateKpis() {
  const total = demoAccounts.reduce((s,a) => s + a.balance, 0);
  const cash  = demoAccounts.filter(a => a.type === "liquidites")
                            .reduce((s,a) => s + a.balance, 0);
  const invest= demoAccounts.filter(a => a.type === "invest")
                            .reduce((s,a) => s + a.balance, 0);
  const debt  = demoAccounts.filter(a => a.type === "dette")
                            .reduce((s,a) => s + a.balance, 0);

  const elTotal  = document.getElementById("kpiTotal");
  const elCash   = document.getElementById("kpiCash");
  const elInvest = document.getElementById("kpiInvest");
  const elDebt   = document.getElementById("kpiDebt");

  if (elTotal)  elTotal.textContent  = fmtEUR(total);
  if (elCash)   elCash.textContent   = fmtEUR(cash);
  if (elInvest) elInvest.textContent = fmtEUR(invest);
  if (elDebt)   elDebt.textContent   = fmtEUR(debt);
}

// ==== Courbe simple : 6 mois de patrimoine ====
function buildLineChart() {
  const canvas = document.getElementById("wealthLine");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const total = demoAccounts.reduce((s,a) => s + a.balance, 0);

  // On fabrique une histoire simple : 6 points qui tournent autour du total actuel
  const base = total || 15000;
  const values = [
    base * 0.82,
    base * 0.88,
    base * 0.91,
    base * 0.96,
    base * 1.02,
    base
  ].map(v => Math.round(v));

  const labels = ["M-5","M-4","M-3","M-2","M-1","Maintenant"];

  if (lineChart) lineChart.destroy();

  lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: "rgba(167,139,250,1)",
        backgroundColor: "rgba(167,139,250,0.18)",
        tension: 0.3,
        fill: true,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "rgba(236, 252, 203, 1)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display:false },
        tooltip: {
          callbacks: {
            label: ctx => fmtEUR(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: {
          ticks: { color:"#A0AEC0" },
          grid: { display:false }
        },
        y: {
          ticks: {
            color:"#A0AEC0",
            callback: value => fmtEUR(value)
          },
          grid: { color:"rgba(148,163,184,0.16)" }
        }
      }
    }
  });
}

// ==== Donut répartition actifs ====
function buildDonutChart() {
  const canvas = document.getElementById("wealthDonut");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const sumCash   = demoAccounts.filter(a => a.type === "liquidites").reduce((s,a)=>s+a.balance,0);
  const sumInvest = demoAccounts.filter(a => a.type === "invest").reduce((s,a)=>s+a.balance,0);
  const sumDebt   = demoAccounts.filter(a => a.type === "dette").reduce((s,a)=>s+a.balance,0);

  const labels = [];
  const data   = [];
  const colors = [];

  if (sumCash)   { labels.push("Liquidités");     data.push(sumCash);   colors.push("rgba(56,189,248,0.9)"); }
  if (sumInvest) { labels.push("Investissements");data.push(sumInvest); colors.push("rgba(167,139,250,0.9)"); }
  if (sumDebt)   { labels.push("Dettes");         data.push(Math.abs(sumDebt)); colors.push("rgba(248,113,113,0.95)"); }

  if (donutChart) donutChart.destroy();

  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive:true,
      maintainAspectRatio:false,
      plugins: {
        legend: {
          position:"bottom",
          labels: { color:"#E5E7EB", font:{ size:12 } }
        }
      },
      cutout: "64%"
    }
  });
}

// ==== Modales ====
function openModal(id){
  const m = document.getElementById(id);
  const backdrop = document.getElementById("modalBackdrop");
  if (!m || !backdrop) return;
  m.classList.remove("hidden");
  backdrop.classList.remove("hidden");
}
function closeModal(id){
  const m = document.getElementById(id);
  const backdrop = document.getElementById("modalBackdrop");
  if (!m || !backdrop) return;
  m.classList.add("hidden");
  backdrop.classList.add("hidden");
}

// Remplit la table des comptes (dans la modale)
function renderAccountsTable() {
  const tbody = document.getElementById("accountsTableBody");
  if (!tbody) return;
  if (!demoAccounts.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="muted">Aucun compte pour le moment.</td></tr>`;
    return;
  }
  tbody.innerHTML = demoAccounts.map(a => `
    <tr>
      <td>${a.name}</td>
      <td>${a.type}</td>
      <td>${fmtEUR(a.balance)}</td>
    </tr>
  `).join("");
}

// Remplit le budget démo
function renderBudget() {
  const tbody = document.getElementById("budgetTableBody");
  const elTotal = document.getElementById("budgetTotal");
  const elSpent = document.getElementById("budgetSpent");
  const elLeft  = document.getElementById("budgetLeft");
  if (!tbody || !elTotal || !elSpent || !elLeft) return;

  tbody.innerHTML = demoBudget.map(row => `
    <tr>
      <td>${row.cat}</td>
      <td>${fmtEUR(row.budget)}</td>
      <td>${fmtEUR(row.spent)}</td>
    </tr>
  `).join("");

  const total = demoBudget.reduce((s,r)=>s+r.budget,0);
  const spent = demoBudget.reduce((s,r)=>s+r.spent,0);
  const left  = total - spent;

  elTotal.textContent = fmtEUR(total);
  elSpent.textContent = fmtEUR(spent);
  elLeft.textContent  = fmtEUR(left);
}

// Ajouter un compte démo rapide
function addDemoAccount() {
  demoAccounts.push({
    name: "Nouveau compte",
    type: "invest",
    balance: 1000
  });
  localStorage.setItem("valenhub-demo-accounts", JSON.stringify(demoAccounts));
  updateKpis();
  buildLineChart();
  buildDonutChart();
  renderAccountsTable();
}

// ==== INIT ====
document.addEventListener("DOMContentLoaded", () => {
  updateKpis();
  buildLineChart();
  buildDonutChart();

  // Boutons modales
  const btnAcc   = document.getElementById("btnAccounts");
  const btnBud   = document.getElementById("btnBudget");
  const btnHist  = document.getElementById("btnHistory");
  const demoBtn  = document.getElementById("btnAddDemoAccount");
  const backdrop = document.getElementById("modalBackdrop");
  const closes   = document.querySelectorAll(".modal-close, [data-close]");

  if (btnAcc) btnAcc.addEventListener("click", () => {
    renderAccountsTable();
    openModal("accountsModal");
  });

  if (btnBud) btnBud.addEventListener("click", () => {
    renderBudget();
    openModal("budgetModal");
  });

  if (btnHist) btnHist.addEventListener("click", () => {
    // pour l'instant, on se contente d’ouvrir les comptes
    renderAccountsTable();
    openModal("accountsModal");
  });

  if (demoBtn) demoBtn.addEventListener("click", addDemoAccount);

  if (backdrop) backdrop.addEventListener("click", () => {
    closeModal("accountsModal");
    closeModal("budgetModal");
  });

  closes.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = btn.dataset.close;
      if (id) closeModal(id);
      else {
        closeModal("accountsModal");
        closeModal("budgetModal");
      }
    });
  });
});
