// assets/dashboard.js

let accounts = JSON.parse(localStorage.getItem("vh-accounts") || "[]");
let chart = null;

document.addEventListener("DOMContentLoaded", () => {
  const nameInput    = document.getElementById("accName");
  const typeSelect   = document.getElementById("accType");
  const balanceInput = document.getElementById("accBalance");
  const addBtn       = document.getElementById("addAccountBtn");

  const tbody        = document.getElementById("accountsTableBody");
  const totalWealth  = document.getElementById("totalWealth");
  const kpiAccounts  = document.getElementById("kpiAccounts");
  const kpiChange    = document.getElementById("kpiChange");
  const accountsCount = document.getElementById("accountsCount");
  const chartHint    = document.getElementById("chartHint");

  const chartCanvas  = document.getElementById("chartWealth");

  function saveAccounts() {
    localStorage.setItem("vh-accounts", JSON.stringify(accounts));
  }

  function formatEUR(v) {
    return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  }

  function renderTable() {
    if (!tbody) return;

    if (accounts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="muted xsmall">
            Aucun compte pour l’instant. Ajoute ton premier compte à gauche.
          </td>
        </tr>
      `;
      accountsCount.textContent = "0 compte";
      return;
    }

    tbody.innerHTML = accounts
      .map((acc, idx) => `
        <tr>
          <td>${acc.name}</td>
          <td>${acc.typeLabel}</td>
          <td>${formatEUR(acc.balance)}</td>
          <td>
            <button class="btn btn-small btn-ghost" data-index="${idx}">Supprimer</button>
          </td>
        </tr>
      `)
      .join("");

    accountsCount.textContent = `${accounts.length} compte${accounts.length > 1 ? "s" : ""}`;
  }

  function renderKpis() {
    const total = accounts.reduce((sum, a) => sum + a.balance, 0);
    totalWealth.textContent = formatEUR(total);
    kpiAccounts.textContent = accounts.length.toString();

    // petite variation “fake” pour donner de la vie
    const variation = accounts.length === 0 ? 0 : 1.5 + Math.random() * 3.5;
    kpiChange.textContent = `+${variation.toFixed(1)}%`;
  }

  function renderChart() {
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext("2d");
    const labels = accounts.map(a => a.name);
    const data   = accounts.map(a => a.balance);

    if (chart) chart.destroy();

    if (accounts.length === 0) {
      chartHint.textContent = "Ajoute quelques comptes pour voir la répartition.";
      return;
    } else {
      chartHint.textContent = "Répartition par compte (données locales).";
    }

    chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            "rgba(167,139,250,0.9)",
            "rgba(56,189,248,0.9)",
            "rgba(52,211,153,0.9)",
            "rgba(251,191,36,0.9)",
            "rgba(248,113,113,0.9)"
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#E5E7EB",
              font: { size: 12 }
            }
          }
        }
      }
    });
  }

  function refreshAll() {
    renderTable();
    renderKpis();
    renderChart();
  }

  // Ajout de compte
  addBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const type = typeSelect.value;
    const balance = parseFloat(balanceInput.value.replace(",", ".")) || 0;

    if (!name) {
      alert("Donne un nom à ton compte 😉");
      return;
    }

    const typeMap = {
      banque: "Banque",
      pea: "PEA / CTO",
      crypto: "Crypto",
      epargne: "Épargne",
      autre: "Autre"
    };

    accounts.push({
      name,
      type,
      typeLabel: typeMap[type] || "Autre",
      balance
    });

    saveAccounts();
    nameInput.value = "";
    balanceInput.value = "";
    refreshAll();
  });

  // Suppression
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-index]");
    if (!btn) return;
    const idx = parseInt(btn.dataset.index, 10);
    if (isNaN(idx)) return;

    if (confirm("Supprimer ce compte ?")) {
      accounts.splice(idx, 1);
      saveAccounts();
      refreshAll();
    }
  });

  // Premier rendu
  refreshAll();
});
