// ====== Données stockées localement ======
let accounts = JSON.parse(localStorage.getItem("valenhub-simple-accounts") || "null");

// Si aucun compte encore, on met une petite démo
if (!accounts) {
  accounts = [
    { name: "Compte courant", type: "banque", balance: 3200 },
    { name: "Livret A",       type: "épargne", balance: 5500 },
    { name: "PEA ETF Monde",  type: "invest",  balance: 8000 }
  ];
  saveAccounts();
}

let chart = null;

function saveAccounts() {
  localStorage.setItem("valenhub-simple-accounts", JSON.stringify(accounts));
}

function fmtEUR(v) {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// ====== Rendu des KPI ======
function renderKpis() {
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const count = accounts.length;
  const avg   = count > 0 ? total / count : 0;

  const elTotal = document.getElementById("kpiTotal");
  const elCount = document.getElementById("kpiCount");
  const elAvg   = document.getElementById("kpiAvg");

  if (elTotal) elTotal.textContent = fmtEUR(total);
  if (elCount) elCount.textContent = count.toString();
  if (elAvg)   elAvg.textContent   = fmtEUR(avg);
}

// ====== Rendu du tableau ======
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

// ====== Graphique ======
function renderChart() {
  const canvas = document.getElementById("accountsChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const labels = accounts.map(a => a.name);
  const data   = accounts.map(a => a.balance);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: "rgba(167,139,250,0.8)",
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

// ====== Ajouter un compte (via prompt, simple) ======
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

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  renderKpis();
  renderTable();
  renderChart();
  setupAddAccount();
});
