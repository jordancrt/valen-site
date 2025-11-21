// =========================
//  Données locales
// =========================

// Comptes
let accounts = JSON.parse(localStorage.getItem("valenhub-simple-accounts") || "null");
if (!accounts) {
  // petit exemple par défaut
  accounts = [
    { name: "Compte courant", type: "banque",  balance: 3200 },
    { name: "Livret A",       type: "épargne", balance: 5500 },
    { name: "PEA ETF Monde",  type: "invest",  balance: 8000 }
  ];
  saveAccounts();
}

// Budget
let budgets = JSON.parse(localStorage.getItem("valenhub-simple-budget") || "[]");

let chart = null;

// =========================
//  Helpers
// =========================
function saveAccounts() {
  localStorage.setItem("valenhub-simple-accounts", JSON.stringify(accounts));
}
function saveBudgets() {
  localStorage.setItem("valenhub-simple-budget", JSON.stringify(budgets));
}
function fmtEUR(v) {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// =========================
//  KPI (en haut à gauche)
// =========================
function renderKpis() {
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const count = accounts.length;
  const avg   = count > 0 ? total / count : 0;

  const elTotal = document.getElementById("kpiTotal");
  const elCount = document.getElementById("kpiCount");
  const elAvg   = document.getElementById("kpiAvg");

  if (elTotal) elTotal.textContent = fmtEUR(total);
  if (elCount) elCount.textContent = String(count);
  if (elAvg)   elAvg.textContent   = fmtEUR(avg);
}

// =========================
//  Tableau des comptes
// =========================
function renderTable() {
  const tbody = document.getElementById("accountsTbody");
  if (!tbody) return;

  if (!accounts.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="muted">Aucun compte pour le moment.</td></tr>`;
    return;
  }

  tbody.innerHTML = accounts.map(acc => `
    <tr>
      <td>${acc.name}</td>
      <td>${acc.type}</td>
      <td>${fmtEUR(acc.balance)}</td>
    </tr>
  `).join("");
}

// =========================
//  Graphique simple
// =========================
function renderChart() {
  const canvas = document.getElementById("accountsChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const labels = accounts.map(a => a.name);
  const data   = accounts.map(a => a.balance);

  if (chart) chart.destroy();

  if (!labels.length) {
    // pas de comptes -> pas de graph
    return;
  }

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: "rgba(167,139,250,0.85)",
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#cbd5f5" },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: "#cbd5f5",
            callback: value => fmtEUR(value)
          },
          grid: { color: "rgba(148,163,184,0.25)" }
        }
      }
    }
  });
}

// =========================
//  Budget du mois
// =========================
function renderBudget() {
  const tbody = document.getElementById("budgetTbody");
  if (!tbody) return;

  if (!budgets.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="muted">Aucune catégorie de budget pour le moment.</td></tr>`;
    renderBudgetSummary();
    return;
  }

  tbody.innerHTML = budgets.map(b => `
    <tr>
      <td>${b.label}</td>
      <td>${fmtEUR(b.planned)}</td>
      <td>${fmtEUR(b.spent)}</td>
    </tr>
  `).join("");

  renderBudgetSummary();
}

function renderBudgetSummary() {
  const total  = budgets.reduce((s, b) => s + b.planned, 0);
  const spent  = budgets.reduce((s, b) => s + b.spent, 0);
  const left   = total - spent;

  const elTotal = document.getElementById("budgetTotal");
  const elSpent = document.getElementById("budgetSpent");
  const elLeft  = document.getElementById("budgetLeft");

  if (elTotal) elTotal.textContent = fmtEUR(total);
  if (elSpent) elSpent.textContent = fmtEUR(spent);
  if (elLeft)  elLeft.textContent  = fmtEUR(left);
}

// =========================
//  Ajout via boutons
// =========================
function setupAddAccount() {
  const btn = document.getElementById("addAccountBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const name = prompt("Nom du compte (ex : Compte courant, Livret A, PEA...)");
    if (!name) return;

    const type = prompt("Type (banque, épargne, invest, crypto, autre)");
    const rawBalance = prompt("Solde en € (ex : 1500.50)");
    const balance = parseFloat((rawBalance || "0").replace(",", "."));

    if (isNaN(balance)) {
      alert("Solde invalide.");
      return;
    }

    accounts.push({ name, type: type || "autre", balance });
    saveAccounts();
    renderKpis();
    renderTable();
    renderChart();
  });
}

function setupAddBudget() {
  const btn = document.getElementById("addBudgetBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const label = prompt("Nom de la catégorie (ex : Logement, Courses, Loisirs…)");
    if (!label) return;

    const rawPlanned = prompt("Budget prévu en € (ex : 500)");
    const rawSpent   = prompt("Déjà dépensé en € (tu peux mettre 0)");

    const planned = parseFloat((rawPlanned || "0").replace(",", "."));
    const spent   = parseFloat((rawSpent   || "0").replace(",", "."));

    if (isNaN(planned) || isNaN(spent)) {
      alert("Valeurs invalides.");
      return;
    }

    budgets.push({ label, planned, spent });
    saveBudgets();
    renderBudget();
  });
}

// =========================
//  INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  renderKpis();
  renderTable();
  renderChart();
  renderBudget();
  setupAddAccount();
  setupAddBudget();
});
