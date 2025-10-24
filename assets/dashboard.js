// --- données de démo (localStorage) ---
const LS = window.localStorage;
const DEMO_KEY = "vh-demo-data";

function defaultDemoData() {
  const today = new Date();
  // 12 mois d’historique
  const months = [...Array(12)].map((_, i) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - (11 - i));
    return d.toISOString().slice(0, 7); // YYYY-MM
  });

  // valeurs “patrimoine” (simulées)
  let base = 28000;
  const wealth = months.map(() => {
    base += (Math.random() - 0.3) * 2000;
    return Math.max(10000, Math.round(base));
  });

  // dépenses et variation
  const expenses = Math.round(6000 + Math.random() * 4000);
  const change = ((wealth[wealth.length - 1] - wealth[wealth.length - 2]) / wealth[wealth.length - 2]) * 100;
  const goal = 60 + Math.random() * 30;

  // comptes (pour la légende)
  const accounts = [
    { name: "Compte courant", amount: 3500 },
    { name: "Épargne", amount: 12000 },
    { name: "CTO/PEA", amount: 16000 },
    { name: "Crypto", amount: 2000 }
  ];

  return { months, wealth, expenses, change, goal, accounts };
}

function loadData() {
  const raw = LS.getItem(DEMO_KEY);
  return raw ? JSON.parse(raw) : defaultDemoData();
}

function saveData(data) {
  LS.setItem(DEMO_KEY, JSON.stringify(data));
}

let data = loadData();

// --- KPI ---
function fmtMoney(v) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
}
function fmtPct(v) {
  return `${v.toFixed(1)} %`;
}

function updateKPIs() {
  const last = data.wealth[data.wealth.length - 1];
  document.getElementById("kpi-wealth").textContent = fmtMoney(last);
  document.getElementById("kpi-expenses").textContent = fmtMoney(data.expenses);
  document.getElementById("kpi-change").textContent = fmtPct(data.change);
  document.getElementById("kpi-goal").textContent = fmtPct(data.goal);
}

// --- graphique Chart.js ---
let chart;
function renderChart() {
  const ctx = document.getElementById("chartWealth");
  if (!ctx) return;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.months,
      datasets: [{
        label: "Patrimoine (€)",
        data: data.wealth,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (ctx) => fmtMoney(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          ticks: {
            callback: (v) => fmtMoney(v)
          }
        }
      }
    }
  });
}

// --- légende comptes ---
function renderAccounts() {
  const ul = document.getElementById("accounts-legend");
  if (!ul) return;
  ul.innerHTML = "";
  data.accounts.forEach(a => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.gap = "12px";
    li.innerHTML = `<span class="muted">${a.name}</span><strong>${fmtMoney(a.amount)}</strong>`;
    ul.appendChild(li);
  });
}

// --- actions UI ---
document.getElementById("btn-refresh")?.addEventListener("click", () => {
  // simulate un petit “tick” de marché
  const last = data.wealth[data.wealth.length - 1];
  const next = Math.max(10000, Math.round(last * (1 + (Math.random() - 0.45) * 0.02)));
  data.wealth.push(next);
  data.months.push(new Date().toISOString().slice(0, 7));
  if (data.wealth.length > 12) {
    data.wealth.shift();
    data.months.shift();
  }
  data.change = ((data.wealth[data.wealth.length - 1] - data.wealth[data.wealth.length - 2]) / data.wealth[data.wealth.length - 2]) * 100;
  saveData(data);
  updateKPIs();
  renderChart();
});

document.getElementById("btn-reset")?.addEventListener("click", () => {
  data = defaultDemoData();
  saveData(data);
  updateKPIs();
  renderChart();
  renderAccounts();
});

document.getElementById("btn-add-account")?.addEventListener("click", () => {
  const name = prompt("Nom du compte (ex: Livret A, PEA, Crypto…) :");
  const amountStr = prompt("Montant actuel (€) :");
  const amount = Number(String(amountStr).replace(/[^\d.-]/g, ""));
  if (!name || !Number.isFinite(amount)) return;
  data.accounts.push({ name, amount });
  // on reflète sur le patrimoine
  const last = data.wealth[data.wealth.length - 1] + amount;
  data.wealth[data.wealth.length - 1] = last;
  saveData(data);
  updateKPIs();
  renderChart();
  renderAccounts();
});

// --- init ---
updateKPIs();
renderChart();
renderAccounts();
