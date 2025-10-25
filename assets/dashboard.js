let accounts = JSON.parse(localStorage.getItem("valenhub-accounts") || "[]");
const tableBody = document.querySelector("#accountsTable tbody");
const totalWealth = document.getElementById("totalWealth");
const chartCanvas = document.getElementById("chartWealth");
let chart;

// === Fonctions principales ===
function renderAccounts() {
  if (accounts.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" class="muted">Aucun compte ajouté</td></tr>`;
  } else {
    tableBody.innerHTML = accounts
      .map(
        (a, i) => `
        <tr>
          <td>${a.name}</td>
          <td>${a.type}</td>
          <td>${a.balance.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</td>
          <td><button class="delete-btn" onclick="deleteAccount(${i})">✕</button></td>
        </tr>
      `
      )
      .join("");
  }
  updateWealth();
}

function deleteAccount(index) {
  accounts.splice(index, 1);
  saveAccounts();
  renderAccounts();
  renderChart();
}

function saveAccounts() {
  localStorage.setItem("valenhub-accounts", JSON.stringify(accounts));
}

function updateWealth() {
  const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  totalWealth.textContent = total.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
  document.getElementById("monthVariation").textContent =
    accounts.length > 0 ? "+2.3%" : "0%";
  document.getElementById("expensesMonth").textContent =
    accounts.length > 0
      ? (total * 0.08).toFixed(0) + " €"
      : "0 €";
  document.getElementById("goalProgress").textContent =
    accounts.length > 0
      ? Math.min(100, (total / 50000) * 100).toFixed(1) + "%"
      : "0%";
}

// === Chart dynamique ===
function renderChart() {
  const ctx = chartCanvas.getContext("2d");
  const data = accounts.map(a => a.balance);
  const labels = accounts.map(a => a.name);

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Solde des comptes",
          data,
          backgroundColor: [
            "rgba(167, 139, 250, 0.6)",
            "rgba(120, 200, 250, 0.6)",
            "rgba(130, 250, 180, 0.6)",
            "rgba(250, 190, 120, 0.6)",
          ],
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { ticks: { color: "#ccc" }, grid: { color: "rgba(255,255,255,0.05)" } },
        x: { ticks: { color: "#ccc" }, grid: { display: false } },
      },
      plugins: { legend: { display: false } },
    },
  });
}

// === Gestion modale ===
const modal = document.getElementById("accountModal");
document.getElementById("addAccountBtn").onclick = () => modal.classList.remove("hidden");
document.getElementById("cancelModal").onclick = () => modal.classList.add("hidden");
document.getElementById("confirmModal").onclick = () => {
  const name = document.getElementById("accName").value.trim();
  const type = document.getElementById("accType").value;
  const balance = parseFloat(document.getElementById("accBalance").value) || 0;
  if (!name) return alert("Entrez un nom de compte");

  accounts.push({ name, type, balance });
  saveAccounts();
  modal.classList.add("hidden");
  document.getElementById("accName").value = "";
  document.getElementById("accBalance").value = "";
  renderAccounts();
  renderChart();
};

// === Init ===
renderAccounts();
renderChart();
