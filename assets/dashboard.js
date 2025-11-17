// ====================
// Récupération du DOM
// ====================
let accounts = JSON.parse(localStorage.getItem("valenhub-accounts") || "[]");

const tableBody      = document.querySelector("#accountsTable tbody");
const totalWealthEl  = document.getElementById("totalWealth");
const monthVarEl     = document.getElementById("monthVariation");
const expensesEl     = document.getElementById("expensesMonth");
const goalEl         = document.getElementById("goalProgress");
const summaryTextEl  = document.getElementById("summaryText");
const chartHintEl    = document.getElementById("chartHint");

const addAccountBtn  = document.getElementById("addAccountBtn");
const modal          = document.getElementById("accountModal");
const modalBackdrop  = document.getElementById("modalBackdrop");
const accNameInput   = document.getElementById("accName");
const accTypeSelect  = document.getElementById("accType");
const accBalanceInput= document.getElementById("accBalance");
const cancelModalBtn = document.getElementById("cancelModal");
const confirmModalBtn= document.getElementById("confirmModal");

const chartCanvas    = document.getElementById("chartWealth");
let chart = null;

// ===============
// Fonctions util
// ===============
function saveAccounts() {
  localStorage.setItem("valenhub-accounts", JSON.stringify(accounts));
}

function euro(v) {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// ===============
// Rendu du tableau
// ===============
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

  // Boutons de suppression
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

// ===============
// KPI + résumé
// ===============
function updateKPI() {
  const total = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  totalWealthEl.textContent = euro(total);

  if (accounts.length === 0 || total === 0) {
    monthVarEl.textContent  = "0%";
    monthVarEl.classList.remove("kpi-pos", "kpi-neg");
    expensesEl.textContent  = "0 €";
    goalEl.textContent      = "0%";
    summaryTextEl.textContent = "Ajoute tes comptes pour voir un résumé intelligent de ta situation.";
    if (chartHintEl) chartHintEl.textContent = "Ajoute au moins un compte pour voir le graphique.";
    return;
  }

  // estimations très simples (juste pour la démo)
  const estimatedVar = 0.023; // +2.3% “virtuel”
  const estimatedExpenses = total * 0.08;
  const progress = Math.min(100, (total / 50000) * 100);

  monthVarEl.textContent = "+" + (estimatedVar * 100).toFixed(1) + "%";
  monthVarEl.classList.add("kpi-pos");
  expensesEl.textContent = euro(estimatedExpenses);
  goalEl.textContent = progress.toFixed(1) + "%";

  summaryTextEl.textContent =
    `Tu suis actuellement ${accounts.length} compte(s), pour un patrimoine total d’environ ${euro(total)}. ` +
    `Tu approches à ${progress.toFixed(1)}% de ton objectif de 50 000 €.`;

  if (chartHintEl) chartHintEl.textContent = "Répartition approximative par compte (non contractuel).";
}

// ===============
// Graphique
// ===============
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

  if (chart) {
    chart.destroy();
  }

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

// ===============
// Modale
// ===============
function openModal() {
  modal.classList.remove("hidden");
  modalBackdrop.classList.remove("hidden");
  accNameInput.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  modalBackdrop.classList.add("hidden");
  accNameInput.value = "";
  accBalanceInput.value = "";
}

if (addAccountBtn) {
  addAccountBtn.addEventListener("click", openModal);
}
if (cancelModalBtn) {
  cancelModalBtn.addEventListener("click", closeModal);
}
if (modalBackdrop) {
  modalBackdrop.addEventListener("click", closeModal);
}

if (confirmModalBtn) {
  confirmModalBtn.addEventListener("click", () => {
    const name = accNameInput.value.trim();
    const type = accTypeSelect.value;
    const balance = parseFloat(accBalanceInput.value.replace(",", ".")) || 0;

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

// fermer avec Echap
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

// ===============
// Initialisation
// ===============
renderAccounts();
renderChart();
