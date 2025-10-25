// ====== ValenHub Dashboard (robuste) ======
const LS_KEY = "valenhub-accounts";

// Helpers
const € = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const qs = (sel) => document.querySelector(sel);

// State
let accounts = [];
let chart;

// Hooks DOM (tous optionnels mais on vérifie leur présence)
const tb = qs("#accountsTable tbody");
const elTotal = qs("#totalWealth");
const elVar = qs("#monthVariation");
const elExp = qs("#expensesMonth");
const elGoal = qs("#goalProgress");
const cvWealth = qs("#chartWealth");

const btnAdd = qs("#addAccountBtn");
const dlg = qs("#accountModal");
const inpName = qs("#accName");
const selType = qs("#accType");
const inpBal = qs("#accBalance");
const btnCancel = qs("#cancelModal");
const btnConfirm = qs("#confirmModal");

// Charger depuis localStorage
function load() {
  try {
    accounts = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (!Array.isArray(accounts)) accounts = [];
  } catch {
    accounts = [];
  }
}

// Sauvegarder
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(accounts));
}

// Rendu de la table
function renderAccounts() {
  if (!tb) return;

  if (!accounts.length) {
    tb.innerHTML = `<tr><td colspan="4" class="muted">Aucun compte ajouté</td></tr>`;
    return;
  }

  tb.innerHTML = accounts.map((a, i) => `
    <tr>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.type)}</td>
      <td>${€ .format(a.balance)}</td>
      <td><button class="delete-btn" data-del="${i}" title="Supprimer">✕</button></td>
    </tr>
  `).join("");

  // Attach delete handlers
  tb.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.del);
      accounts.splice(i, 1);
      save();
      updateAll();
    });
  });
}

// Calculs KPI simples
function computeKPIs() {
  const total = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  // Variation mensuelle (exemple : 0 si pas d'historique réel)
  // Tu pourras brancher une vraie variation plus tard
  const variationPct = accounts.length ? 2.3 : 0;

  // Dépenses du mois (exemple simple)
  const expenses = accounts.length ? Math.max(0, total * 0.08) : 0;

  // Objectif (ex. 50 000 €)
  const goalPct = Math.min(100, (total / 50000) * 100);

  return { total, variationPct, expenses, goalPct };
}

// Afficher KPI
function renderKPIs() {
  const { total, variationPct, expenses, goalPct } = computeKPIs();

  if (elTotal) elTotal.textContent = € .format(total);
  if (elVar)   elVar.textContent   = `${variationPct.toFixed(1)} %`;
  if (elExp)   elExp.textContent   = € .format(expenses);
  if (elGoal)  elGoal.textContent  = `${goalPct.toFixed(1)} %`;
}

// Graphique
function renderChart() {
  if (!cvWealth || typeof Chart === "undefined") return;

  const labels = accounts.length ? accounts.map(a => a.name) : ["Aucun compte"];
  const data    = accounts.length ? accounts.map(a => a.balance) : [0];

  const ctx = cvWealth.getContext("2d");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Solde des comptes",
        data,
        backgroundColor: [
          "rgba(167,139,250,0.65)",
          "rgba(120,200,250,0.65)",
          "rgba(130,250,180,0.65)",
          "rgba(250,190,120,0.65)",
          "rgba(255,120,140,0.65)",
        ],
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          ticks: { color: "#cfd8e3" },
          grid: { color: "rgba(255,255,255,.06)" },
        },
        x: {
          ticks: { color: "#cfd8e3" },
          grid: { display: false },
        }
      }
    }
  });
}

// MàJ globale
function updateAll() {
  save();
  renderAccounts();
  renderKPIs();
  renderChart();
}

// Modale
function openModal()  { if (dlg) dlg.classList.remove("hidden"); }
function closeModal() {
  if (dlg) dlg.classList.add("hidden");
  if (inpName) inpName.value = "";
  if (inpBal)  inpBal.value  = "";
  if (selType) selType.value = "Banque";
}

// Ajouter un compte
function addAccount() {
  const name = (inpName?.value || "").trim();
  const type = (selType?.value || "Banque").trim();
  const balance = parseFloat(inpBal?.value || "0") || 0;

  if (!name) {
    alert("Entrez un nom de compte.");
    return;
  }

  accounts.push({ name, type, balance });
  updateAll();
  closeModal();
}

// Démo / Reset (si tu veux des boutons : data-action="demo/reset/refresh")
function seedDemo() {
  accounts = [
    { name: "Compte courant", type: "Banque", balance: 2450.35 },
    { name: "Livret A",       type: "Épargne", balance: 8200.00 },
    { name: "Binance",        type: "Crypto",  balance: 1350.30 },
    { name: "Bourse CTO",     type: "Bourse",  balance: 9600.10 },
  ];
  updateAll();
}
function resetAll() {
  accounts = [];
  updateAll();
}
function refreshNow() {
  // Ici tu pourrais recharger depuis une API. Pour l’instant : recalcul simple.
  updateAll();
}

// Sécurité XSS minimale
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => (
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]
  ));
}

// Branchements
function wire() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-action]");
    if (!a) return;
    const act = a.getAttribute("data-action");
    if (act === "demo")    seedDemo();
    if (act === "reset")   resetAll();
    if (act === "refresh") refreshNow();
  });

  btnAdd?.addEventListener("click", openModal);
  btnCancel?.addEventListener("click", closeModal);
  btnConfirm?.addEventListener("click", addAccount);
}

// Init
(function init(){
  load();
  wire();
  renderAccounts();
  renderKPIs();
  renderChart();
})();
