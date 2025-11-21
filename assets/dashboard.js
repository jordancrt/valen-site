// assets/dashboard.js

// Clé pour le localStorage
const STORAGE_KEY = "valenhub_accounts_v1";

// Données de démo si aucun compte
const demoAccounts = [
  { name: "Compte courant", type: "banque", category: "Liquidités", balance: 2200 },
  { name: "Livret A",        type: "epargne", category: "Liquidités", balance: 3500 },
  { name: "PEA Bourse",      type: "invest", category: "Investissements", balance: 12000 },
  { name: "Portefeuille crypto", type: "crypto", category: "Investissements", balance: 2800 },
  { name: "Crédit auto",     type: "dette", category: "Dettes", balance: -4500 },
];

let accounts = [];
let evolutionChart = null;
let allocationChart = null;

document.addEventListener("DOMContentLoaded", () => {
  // Navigation mobile (déjà dans ton CSS)
  initNav();

  // Charger comptes
  loadAccounts();

  // Rendu initial
  renderDashboard();

  // Modal
  initAccountModal();
});

// ---------------- NAV ----------------
function initNav() {
  const toggle = document.getElementById("navToggle");
  const drawer = document.getElementById("navDrawer");
  const backdrop = document.getElementById("navBackdrop");

  if (!toggle || !drawer || !backdrop) return;

  const close = () => {
    drawer.classList.remove("open");
    backdrop.classList.remove("show");
  };

  toggle.addEventListener("click", () => {
    drawer.classList.toggle("open");
    backdrop.classList.toggle("show");
  });

  backdrop.addEventListener("click", close);
  drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
}

// ------------- STORAGE ----------------
function loadAccounts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      accounts = demoAccounts;
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) {
      accounts = parsed;
    } else {
      accounts = demoAccounts;
    }
  } catch (e) {
    console.error("Erreur de lecture localStorage", e);
    accounts = demoAccounts;
  }
}

function saveAccounts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error("Erreur d’écriture localStorage", e);
  }
}

// ------------- RENDU GÉNÉRAL -------------
function renderDashboard() {
  renderAccountsTable();
  renderBudget();
  renderStats();
  renderCharts();
}

// ------------- TABLEAU COMPTES -------------
function renderAccountsTable() {
  const tbody = document.getElementById("accountsTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!accounts.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "muted small";
    td.textContent = "Aucun compte pour l’instant. Ajoute un compte pour commencer.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  accounts.forEach((acc, index) => {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = acc.name;

    const tdType = document.createElement("td");
    tdType.textContent = acc.type;

    const tdCat = document.createElement("td");
    tdCat.textContent = acc.category || guessCategory(acc.type, acc.balance);

    const tdBal = document.createElement("td");
    tdBal.textContent = formatEuro(acc.balance);
    tdBal.style.textAlign = "right";

    const tdActions = document.createElement("td");
    tdActions.style.textAlign = "right";
    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-small";
    btnDel.textContent = "×";
    btnDel.title = "Supprimer";
    btnDel.addEventListener("click", () => {
      accounts.splice(index, 1);
      saveAccounts();
      renderDashboard();
    });
    tdActions.appendChild(btnDel);

    tr.append(tdName, tdType, tdCat, tdBal, tdActions);
    tbody.appendChild(tr);
  });
}

// Devine “Liquidités / Investissements / Dettes”
function guessCategory(type, balance) {
  if (type === "banque" || type === "epargne") return "Liquidités";
  if (type === "invest" || type === "crypto") return "Investissements";
  if (type === "dette" || balance < 0) return "Dettes";
  return "Autre";
}

// ------------- BUDGET SIMPLE -------------
function renderBudget() {
  const tbody = document.getElementById("budgetTableBody");
  if (!tbody) return;

  // Budget très simple basé sur le patrimoine total
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);
  const base = Math.max(total * 0.03, 800); // 3% ou 800 €

  const categories = [
    { name: "Logement",     ratio: 0.35 },
    { name: "Transport",    ratio: 0.10 },
    { name: "Courses",      ratio: 0.20 },
    { name: "Loisirs",      ratio: 0.15 },
    { name: "Investissement", ratio: 0.15 },
    { name: "Autre",        ratio: 0.05 },
  ];

  tbody.innerHTML = "";
  let totalBudget = 0;

  categories.forEach(cat => {
    const b = base * cat.ratio;
    totalBudget += b;

    const tr = document.createElement("tr");
    const tdCat = document.createElement("td");
    const tdBud = document.createElement("td");
    const tdSpent = document.createElement("td");

    tdCat.textContent = cat.name;
    tdBud.textContent = formatEuro(b);
    tdSpent.textContent = "0,00 €"; // on ne suit pas encore le réel

    tr.append(tdCat, tdBud, tdSpent);
    tbody.appendChild(tr);
  });

  const elTotal = document.getElementById("budgetTotal");
  const elSpent = document.getElementById("budgetSpent");
  const elLeft  = document.getElementById("budgetLeft");

  if (elTotal) elTotal.textContent = formatEuro(totalBudget);
  if (elSpent) elSpent.textContent = "0,00 €";
  if (elLeft)  elLeft.textContent  = formatEuro(totalBudget);
}

// ------------- STATS HAUT -------------
function renderStats() {
  const total  = accounts.reduce((s, a) => s + a.balance, 0);
  const cash   = accounts
    .filter(a => guessCategory(a.type, a.balance) === "Liquidités")
    .reduce((s, a) => s + a.balance, 0);
  const invest = accounts
    .filter(a => guessCategory(a.type, a.balance) === "Investissements")
    .reduce((s, a) => s + a.balance, 0);
  const debt   = accounts
    .filter(a => guessCategory(a.type, a.balance) === "Dettes")
    .reduce((s, a) => s + a.balance, 0);

  setText("statTotal",  formatEuro(total));
  setText("statCash",   formatEuro(cash));
  setText("statInvest", formatEuro(invest));
  setText("statDebt",   formatEuro(debt));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ------------- GRAPHIQUES -------------
function renderCharts() {
  const ctxEvo  = document.getElementById("evolutionChart");
  const ctxAlloc = document.getElementById("allocationChart");

  if (!ctxEvo || !ctxAlloc) return;

  // Nettoyage si graphiques déjà créés
  if (evolutionChart) evolutionChart.destroy();
  if (allocationChart) allocationChart.destroy();

  // Évolution “fake mais cohérente” sur 6 mois
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
  const nowTotal = accounts.reduce((s, a) => s + a.balance, 0);
  const base = nowTotal * 0.7; // on part un peu plus bas
  const evoData = months.map((_, i) => base + (nowTotal - base) * (i / (months.length - 1)));

  evolutionChart = new Chart(ctxEvo.getContext("2d"), {
    type: "line",
    data: {
      labels: months,
      datasets: [{
        label: "Patrimoine (€)",
        data: evoData,
        tension: 0.3,
        borderWidth: 2,
        borderColor: "rgba(167,139,250,1)",
        pointRadius: 3,
        pointBackgroundColor: "rgba(167,139,250,1)",
        fill: true,
        backgroundColor: "rgba(167,139,250,0.15)",
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: "#9BA6B2" },
          grid:  { color: "rgba(148,163,184,0.08)" }
        },
        y: {
          ticks: { color: "#9BA6B2" },
          grid:  { color: "rgba(148,163,184,0.08)" }
        }
      }
    }
  });

  // Allocation par type
  const byCat = {};
  accounts.forEach(a => {
    const cat = guessCategory(a.type, a.balance);
    byCat[cat] = (byCat[cat] || 0) + a.balance;
  });

  const labels = Object.keys(byCat);
  const values = Object.values(byCat);

  allocationChart = new Chart(ctxAlloc.getContext("2d"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "rgba(167,139,250,0.95)",
          "rgba(56,189,248,0.95)",
          "rgba(52,211,153,0.95)",
          "rgba(251,191,36,0.95)",
          "rgba(248,113,113,0.95)",
        ],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#E5E7EB",
            boxWidth: 14,
            boxHeight: 14,
          }
        }
      },
      cutout: "60%"
    }
  });
}

// ------------- MODALE AJOUT COMPTE -------------
function initAccountModal() {
  const btnOpen  = document.getElementById("addAccountBtn");
  const modal    = document.getElementById("accountModal");
  const backdrop = document.getElementById("modalBackdrop");
  const btnCancel = document.getElementById("cancelModal");
  const btnOk     = document.getElementById("confirmModal");

  if (!btnOpen || !modal || !backdrop || !btnCancel || !btnOk) return;

  const open = () => {
    modal.classList.remove("hidden");
    backdrop.classList.remove("hidden");
  };

  const close = () => {
    modal.classList.add("hidden");
    backdrop.classList.add("hidden");
    document.getElementById("accName").value = "";
    document.getElementById("accBalance").value = "";
  };

  btnOpen.addEventListener("click", open);
  btnCancel.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  btnOk.addEventListener("click", () => {
    const name = document.getElementById("accName").value.trim();
    const type = document.getElementById("accType").value;
    const balRaw = document.getElementById("accBalance").value;
    const balance = parseFloat(balRaw.replace(",", "."));

    if (!name || isNaN(balance)) {
      alert("Merci de saisir un nom de compte et un solde valide.");
      return;
    }

    const cat = guessCategory(type, balance);

    accounts.push({ name, type, category: cat, balance });
    saveAccounts();
    renderDashboard();
    close();
  });
}

// ------------- UTILITAIRE FORMAT -------------
function formatEuro(value) {
  const opts = { style: "currency", currency: "EUR", minimumFractionDigits: 2 };
  return new Intl.NumberFormat("fr-FR", opts).format(value);
}
