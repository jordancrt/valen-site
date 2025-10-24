/* =========== Données & stockage local (démo) =========== */
const LS_KEY = "vh-demo-data";

const defaultData = {
  wealthHistory: [32000, 33000, 34200, 34700, 35500, 36500, 37545],
  monthChangePct: 6.0,
  expensesMonth: 8135,
  goalPct: 72.2,
  expensesByCat: [
    { label: "Logement", value: 2200 },
    { label: "Alimentation", value: 780 },
    { label: "Transports", value: 410 },
    { label: "Loisirs", value: 350 },
    { label: "Impôts & charges", value: 3095 },
    { label: "Autres", value: 1300 },
  ],
  allocation: [
    { label: "Actions & fonds", value: 45 },
    { label: "Immobilier", value: 30 },
    { label: "Crypto", value: 8 },
    { label: "Épargne", value: 12 },
    { label: "Autres", value: 5 },
  ],
  accounts: [
    { name: "Compte courant", type: "Banque", amount: 3450 },
    { name: "Broker", type: "Titres", amount: 22450 },
    { name: "Livret A", type: "Épargne", amount: 7200 },
    { name: "Wallet", type: "Crypto", amount: 445 },
  ],
};

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
}
function saveData(d) {
  localStorage.setItem(LS_KEY, JSON.stringify(d));
}

/* =========== Formatage =========== */
const fmtEUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const fmtPct = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });

/* =========== UI: KPIs & listes =========== */
function sumAccounts(accounts) {
  return accounts.reduce((t, a) => t + (Number(a.amount) || 0), 0);
}
function updateKPIs(data) {
  const wealth = data.wealthHistory.at(-1) ?? sumAccounts(data.accounts);
  document.getElementById("kpi-wealth").textContent = fmtEUR.format(wealth);
  document.getElementById("kpi-variation").textContent = fmtPct.format((data.monthChangePct || 0) / 100);
  document.getElementById("kpi-expenses").textContent = fmtEUR.format(data.expensesMonth || 0);
  document.getElementById("kpi-goal").textContent = fmtPct.format((data.goalPct || 0) / 100);
}
function renderAccounts(data) {
  const ul = document.getElementById("accountsList");
  ul.innerHTML = "";
  if (!data.accounts?.length) {
    ul.innerHTML = `<li class="muted">Aucun compte pour l’instant.</li>`;
    return;
  }
  for (const acc of data.accounts) {
    const li = document.createElement("li");
    li.className = "account-row";
    li.innerHTML = `
      <span class="acc-name">${acc.name}</span>
      <span class="acc-type">${acc.type}</span>
      <span class="acc-amt">${fmtEUR.format(Number(acc.amount) || 0)}</span>
      <button class="btn btn-ghost" title="Supprimer">✕</button>
    `;
    li.querySelector("button").onclick = () => {
      data.accounts = data.accounts.filter(a => a !== acc);
      saveData(data);
      hydrate(data, true);
    };
    ul.appendChild(li);
  }
}

/* =========== Charts =========== */
let chartWealth, chartExpenses, chartAllocation;

function showCanvas(id) {
  const cv = document.getElementById(id);
  if (!cv) return cv;
  cv.hidden = false;
  const sk = cv.closest(".skeleton");
  if (sk) sk.classList.remove("skeleton");
  return cv;
}

function drawWealth(data) {
  const cv = showCanvas("chartWealth");
  if (!cv) return;
  const labels = ["M-6", "M-5", "M-4", "M-3", "M-2", "M-1", "M"];
  chartWealth?.destroy();
  chartWealth = new Chart(cv, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Patrimoine (€)",
        data: data.wealthHistory,
        tension: 0.35,
        fill: true,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => fmtEUR.format(v).replace(/\u00A0/g, " ") } }
      }
    }
  });
}

function drawExpenses(data) {
  const cv = showCanvas("chartExpenses");
  if (!cv) return;
  chartExpenses?.destroy();
  chartExpenses = new Chart(cv, {
    type: "bar",
    data: {
      labels: data.expensesByCat.map(x => x.label),
      datasets: [{
        label: "Dépenses (€)",
        data: data.expensesByCat.map(x => x.value),
        borderRadius: 8,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => fmtEUR.format(v).replace(/\u00A0/g, " ") } }
      }
    }
  });
}

function drawAllocation(data) {
  const cv = showCanvas("chartAllocation");
  if (!cv) return;
  chartAllocation?.destroy();
  chartAllocation = new Chart(cv, {
    type: "doughnut",
    data: {
      labels: data.allocation.map(x => x.label),
      datasets: [{
        data: data.allocation.map(x => x.value),
      }]
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      cutout: "60%",
    }
  });
}

/* =========== Actions =========== */
function addAccountFlow(data) {
  const name = prompt("Nom du compte (ex: Banque A, Broker, Wallet)…");
  if (!name) return;
  const type = prompt("Type (Banque, Titres, Crypto, Épargne, Autres)…") || "Autres";
  const amt = Number(prompt("Montant (en €)") || 0);
  data.accounts.push({ name, type, amount: amt });

  // on met à jour la répartition (simple heuristique de démo)
  const mapTypeToAlloc = {
    "Banque": "Épargne",
    "Titres": "Actions & fonds",
    "Crypto": "Crypto",
    "Épargne": "Épargne",
    "Autres": "Autres",
  };
  const bucket = mapTypeToAlloc[type] || "Autres";
  const total = data.allocation.reduce((t, x) => t + x.value, 0);
  // on ajuste légèrement le bucket lié
  const idx = data.allocation.findIndex(x => x.label === bucket);
  if (idx >= 0) data.allocation[idx].value = Math.min(100, data.allocation[idx].value + 2);
  // normalisation rapide (pour garder ~100%)
  const newTotal = data.allocation.reduce((t, x) => t + x.value, 0);
  data.allocation.forEach(x => x.value = +(x.value * 100 / newTotal).toFixed(1));

  // on pousse le patrimoine courant
  const old = data.wealthHistory.at(-1) ?? 0;
  data.wealthHistory = [...data.wealthHistory.slice(-6), old + amt];

  saveData(data);
  hydrate(data, true);
}

function resetDemo() {
  const d = structuredClone(defaultData);
  saveData(d);
  hydrate(d, true);
}

function hydrate(data, animate = false) {
  updateKPIs(data);
  renderAccounts(data);
  drawWealth(data);
  drawExpenses(data);
  drawAllocation(data);

  // petit reveal
  if (animate) {
    document.querySelectorAll(".reveal").forEach(el => {
      el.classList.remove("reveal");
      void el.offsetWidth; // reflow
      el.classList.add("reveal");
    });
  }
}

/* =========== Boot =========== */
document.addEventListener("DOMContentLoaded", () => {
  const data = loadData();
  hydrate(data);

  document.getElementById("btn-add-account").onclick = () => addAccountFlow(data);
  document.getElementById("btn-refresh").onclick = () => hydrate(loadData(), true);
  document.getElementById("btn-reset").onclick = () => {
    if (confirm("Réinitialiser la démo locale ?")) resetDemo();
  };
});
