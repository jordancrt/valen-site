// assets/dashboard.js
import { exchange, getAccounts, getAccountsDebug } from "./api-wrapper.js";

const el = (sel) => document.querySelector(sel);

// Cible les éléments des KPIs (adapte si tes IDs/classes diffèrent)
const $patrimoine   = el("#kpi-wealth") || el("[data-kpi='wealth']");
const $variation    = el("#kpi-change") || el("[data-kpi='change']");
const $depenses     = el("#kpi-expenses") || el("[data-kpi='expenses']");
const $objectif     = el("#kpi-goal") || el("[data-kpi='goal']");

// Charts (si tu as mis ces <canvas> dans la page)
const $cWealth   = document.getElementById("chartWealth");
const $cExpenses = document.getElementById("chartExpenses");
const $cAlloc    = document.getElementById("chartAllocation");

function fmtMoney(n, currency="EUR") {
  try { return new Intl.NumberFormat('fr-FR', { style:'currency', currency }).format(n); }
  catch { return (Math.round(n*100)/100) + " " + currency; }
}

async function loadDashboard() {
  let data;
  try {
    const token = await exchange("demo");
    data = await getAccounts(token);
  } catch {
    // si l’API protégée n’est pas prête, on bascule sur le debug
    data = await getAccountsDebug();
  }

  // ---- Remplir KPIs (adapter aux champs renvoyés par ton backend) ----
  if ($patrimoine) $patrimoine.textContent = fmtMoney(data.patrimoineTotal ?? 0);
  if ($variation)  $variation.textContent  = (data.variationMensuelle ?? 0).toFixed(1) + " %";
  if ($depenses)   $depenses.textContent   = fmtMoney(data.depensesMois ?? 0);
  if ($objectif)   $objectif.textContent   = (data.objectifAtteint ?? 0).toFixed(1) + " %";

  // ---- Graphique 1 : Évolution du patrimoine ----
  if ($cWealth && data.chart && data.chart.wealth) {
    const ctx = $cWealth.getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: data.chart.wealth.labels,
        datasets: [{ label: "Patrimoine", data: data.chart.wealth.values, tension: .3 }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // ---- Graphique 2 : Dépenses par catégorie ----
  if ($cExpenses && data.chart && data.chart.expenses) {
    const ctx = $cExpenses.getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.chart.expenses.labels,
        datasets: [{ label: "Dépenses", data: data.chart.expenses.values }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // ---- Graphique 3 : Allocation du portefeuille ----
  if ($cAlloc && data.chart && data.chart.allocation) {
    const ctx = $cAlloc.getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.chart.allocation.labels,
        datasets: [{ data: data.chart.allocation.values }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: "60%" }
    });
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
