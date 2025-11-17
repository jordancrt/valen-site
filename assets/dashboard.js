// ====================
// Données + DOM
// ====================
let accounts = JSON.parse(localStorage.getItem("valenhub-accounts") || "[]");

// budgets : si rien en mémoire, on crée des catégories par défaut
let budgets = JSON.parse(localStorage.getItem("valenhub-budgets") || "null");
if (!budgets) {
  budgets = [
    { category: "Logement",    budget: 0, spent: 0 },
    { category: "Transport",   budget: 0, spent: 0 },
    { category: "Courses",     budget: 0, spent: 0 },
    { category: "Loisirs",     budget: 0, spent: 0 },
    { category: "Investissement", budget: 0, spent: 0 },
    { category: "Autre",       budget: 0, spent: 0 },
  ];
}

// Comptes
const tableBody      = document.querySelector("#accountsTable tbody");
const totalWealthEl  = document.getElementById("totalWealth");
const monthVarEl     = document.getElementById("monthVariation");
const expensesEl     = document.getElementById("expensesMonth");
const goalEl         = document.getElementById("goalProgress");
const summaryTextEl  = document.getElementById("summaryText");
const chartHintEl    = document.getElementById("chartHint");

// Budget
const budgetTableBody = document.getElementById("budgetTableBody");
const budgetTotalEl   = document.getElementById("budgetTotal");
const budgetSpentEl   = document.getElementById("budgetSpent");
const budgetLeftEl    = document.getElementById("budgetLeft");
const budgetStatusEl  = document.getElementById("budgetStatus");

// Modale comptes
const addAccountBtn   = document.getElementById("addAccountBtn");
const modal           = document.getElementById("accountModal");
const modalBackdrop   = document.getElementById("modalBackdrop");
const accNameInput    = document.getElementById("accName");
const accTypeSelect   = document.getElementById("accType");
const accBalanceInput = document.getElementById("accBalance");
const cancelModalBtn  = document.getElementById("cancelModal");
const confirmModalBtn = document.getElementById("confirmModal");

// Graphique
const chartCanvas     = document.getElementById("chartWealth");
let chart = null;

// ====================
// Utils
// ====================
function saveAccounts() {
  localStorage.setItem("valenhub-accounts", JSON.stringify(accounts));
}
function saveBudgets() {
  localStorage.setItem("valenhub-budgets", JSON.stringify(budgets));
}
function euro(v) {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// ====================
// Comptes : rendu tableau
// ====================
function renderAccounts() {
  if (!tableBody) return;

  if (!accounts || accounts.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="muted small">Aucun compte ajouté pour le moment.</td>
      </tr>
    `;
    updateKPI();
    renderChart();
    return;
  }

  tableBody.innerHTML = accounts
    .map((a, i) => `
      <tr>
        <td>${a.name}</td>
        <td class="muted small">${a.type}</td>
        <td>${euro(a.balance)}</td>
        <td class="cell-actions">
          <button class="delete-btn" data-index="${i}" title="Supprimer">✕</button>
        </td>
      </tr>
    `)
    .join("");

  tableBody.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index, 10);
      accounts.splice(idx, 1);
      saveAccounts();
      renderAccounts();
      renderChart();
    });
  });

  updateKPI();
  renderChart();
}

// ====================
// KPI + résumé
// ====================
function updateKPI() {
  const total = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  if (totalWealthEl) totalWealthEl.textContent = euro(total);

  if (!accounts.length || total === 0) {
    if (monthVarEl) {
      monthVarEl.textContent = "0%";
      monthVarEl.classList.remove("kpi-pos", "kpi-neg");
    }
    if (expensesEl) expensesEl.textContent = "0 €";
    if (goalEl) goalEl.textContent = "0%";
    if (summaryTextEl) {
      summaryTextEl.textContent = "Ajoute tes comptes pour voir un résumé intelligent de ta situation.";
    }
    if (chartHintEl) chartHintEl.textContent = "Ajoute au moins un compte pour voir le graphique.";
    return;
  }

  const estimatedVar = 0.023;
  const estimatedExpenses = total * 0.08;
  const progress = Math.min(100, (total / 50000) * 100);

  if (monthVarEl) {
    monthVarEl.textContent = "+" + (estimatedVar * 100).toFixed(1) + "%";
    monthVarEl.classList.add("kpi-pos");
  }
  if (expensesEl) expensesEl.textContent = euro(estimatedExpenses);
  if (goalEl) goalEl.textContent = progress.toFixed(1) + "%";

  if (summaryTextEl) {
    summaryTextEl.textContent =
      `Tu suis actuellement ${accounts.length} compte(s), pour un patrimoine total d’environ ${euro(total)}. ` +
      `Tu approches à ${progress.toFixed(1)}% de ton objectif de 50 000 €.`;
  }
  if (chartHintEl) chartHintEl.textContent = "Répartition approximative par compte (non contractuel).";
}

// ====================
// Graphique
// ====================
function renderChart() {
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext("2d");

  if (!accounts || accounts.length === 0) {
    if (chart) {
      chart.destroy();
      chart = null;
    }
    return;
  }

  const labels = accounts.map(a => a.name);
  const data   = accounts.map(a => a.balance);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Répartition",
        data,
        backgroundColor: [
          "rgba(167,139,250,0.8)",
          "rgba(56,189,248,0.8)",
          "rgba(52,211,153,0.8)",
          "rgba(251,191,36,0.8)",
          "rgba(248,113,113,0.8)"
        ],
        borderColor: "rgba(15,23,42,1)",
        borderWidth: 2,
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: { color: "#E5E7EB", font: { size: 11 } }
        }
      }
    }
  });
}

// ====================
// Budget du mois
// ====================
function renderBudget() {
  if (!budgetTableBody || !budgets) return;

  budgetTableBody.innerHTML = budgets.map((b, i) => `
    <tr>
      <td>${b.category}</td>
      <td>
        <input
          type="number"
          step="0.01"
          class="budget-input"
          data-index="${i}"
          data-field="budget"
          value="${b.budget}"
        >
      </td>
      <td>
        <input
          type="number"
          step="0.01"
          class="budget-input"
          data-index="${i}"
          data-field="spent"
          value="${b.spent}"
        >
      </td>
    </tr>
  `).join("");

  budgetTableBody.querySelectorAll(".budget-input").forEach(input => {
    input.addEventListener("input", () => {
      const idx   = parseInt(input.dataset.index, 10);
      const field = input.dataset.field;
      const val   = parseFloat((input.value || "0").replace(",", ".")) || 0;
      budgets[idx][field] = val;
      saveBudgets();
      updateBudgetTotals();
    });
  });

  updateBudgetTotals();
}

function updateBudgetTotals() {
  if (!budgetTotalEl || !budgetSpentEl || !budgetLeftEl) return;

  const totalBudget = budgets.reduce((s,b) => s + (Number(b.budget) || 0), 0);
  const totalSpent  = budgets.reduce((s,b) => s + (Number(b.spent)  || 0), 0);
  const left        = totalBudget - totalSpent;

  budgetTotalEl.textContent = euro(totalBudget);
  budgetSpentEl.textContent = euro(totalSpent);
  budgetLeftEl.textContent  = euro(left);

  if (!budgetStatusEl) return;
  if (totalBudget === 0 && totalSpent === 0) {
    budgetStatusEl.textContent = "Pas encore défini";
    budgetStatusEl.className = "badge";
    return;
  }

  if (left >= 0) {
    budgetStatusEl.textContent = "Dans le budget";
    budgetStatusEl.className = "badge badge-ok";
  } else {
    budgetStatusEl.textContent = "Budget dépassé";
    budgetStatusEl.className = "badge badge-alert";
  }
}

// ====================
// Modale comptes
// ====================
function openModal() {
  if (!modal || !modalBackdrop) return;
  modal.classList.remove("hidden");
  modalBackdrop.classList.remove("hidden");
  accNameInput.focus();
}
function closeModal() {
  if (!modal || !modalBackdrop) return;
  modal.classList.add("hidden");
  modalBackdrop.classList.add("hidden");
  if (accNameInput)    accNameInput.value = "";
  if (accBalanceInput) accBalanceInput.value = "";
}

if (addAccountBtn)   addAccountBtn.addEventListener("click", openModal);
if (cancelModalBtn)  cancelModalBtn.addEventListener("click", closeModal);
if (modalBackdrop)   modalBackdrop.addEventListener("click", closeModal);

if (confirmModalBtn) {
  confirmModalBtn.addEventListener("click", () => {
    const name    = accNameInput.value.trim();
    const type    = accTypeSelect.value;
    const balance = parseFloat((accBalanceInput.value || "0").replace(",", ".")) || 0;

    if (!name) {
      alert("Merci de donner un nom à ton compte (ex : Compte courant, PEA, Crypto…).");
      return;
    }

    accounts.push({ name, type, balance });
    saveAccounts();
    closeModal();
    renderAccounts();
    renderChart();
  });
}

// Fermer modale avec Échap
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

// ====================
// Init
// ====================
renderAccounts();
renderChart();
renderBudget();
/* ============================
   🎯 CAMEMBERT — Répartition du patrimoine
   ============================ */

function updatePieChart() {
    const canvas = document.getElementById("pieChart");
    if (!canvas) return; // Pas sur cette page

    const ctx = canvas.getContext("2d");

    // On récupère les comptes depuis ton localStorage
    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");

    // Si aucun compte → on affiche rien
    if (accounts.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Données graphiques
    const labels = accounts.map(acc => acc.name);
    const values = accounts.map(acc => Number(acc.balance));

    // Détruit l'ancien graphe s'il existe
    if (window.pieChartInstance) {
        window.pieChartInstance.destroy();
    }

    // Crée le nouveau graphe
    window.pieChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    "#8b5cf6",
                    "#3b82f6",
                    "#10b981",
                    "#f59e0b",
                    "#ef4444"
                ],
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: "white",
                        font: { size: 14 }
                    }
                }
            }
        }
    });
}

// Mise à jour automatique du camembert à chaque changement
window.addEventListener("load", updatePieChart);
window.addEventListener("storage", updatePieChart);
