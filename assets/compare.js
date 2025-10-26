/* ===============================
   ValenCompare – Comparateur simple
   IDs attendus dans la page :
   #q (input), #type (select), #btnSearch (button),
   #grid (container résultats), #count (span compteur)
   =============================== */

const el = {
  q: document.getElementById("q"),
  type: document.getElementById("type"),
  btn: document.getElementById("btnSearch"),
  grid: document.getElementById("grid"),
  count: document.getElementById("count"),
};

// --- Petites données locales (démo) ---
// Tu pourras remplacer ces tableaux par des appels API plus tard.
const DATA = {
  crypto: [
    { name: "Bitcoin", ticker: "BTC", cap: 1300, change24h: -0.8, fees: "—", note: "Réseau le plus sûr" },
    { name: "Ethereum", ticker: "ETH", cap: 480, change24h: 1.2, fees: "—", note: "Smart contracts" },
    { name: "Solana", ticker: "SOL", cap: 85, change24h: 3.9, fees: "—", note: "TPS élevé" },
    { name: "USDT (Tether)", ticker: "USDT", cap: 110, change24h: 0.0, fees: "—", note: "Stablecoin" },
    { name: "USDC", ticker: "USDC", cap: 35, change24h: 0.0, fees: "—", note: "Stablecoin" },
  ],
  etf: [
    { name: "SPDR S&P 500", ticker: "SPY", expense: 0.09, ytd: 14.2, provider: "State Street" },
    { name: "Vanguard S&P 500", ticker: "VOO", expense: 0.03, ytd: 14.1, provider: "Vanguard" },
    { name: "iShares Core MSCI World", ticker: "IWDA", expense: 0.20, ytd: 12.3, provider: "BlackRock" },
    { name: "Lyxor MSCI EMU", ticker: "MSE", expense: 0.25, ytd: 10.6, provider: "Amundi" },
  ],
  plateforme: [
    { name: "Binance", type: "Exchange", fees: "0.1% spot", custody: "CEX", kyc: true, note: "Liquidité élevée" },
    { name: "Kraken", type: "Exchange", fees: "0.16/0.26%", custody: "CEX", kyc: true, note: "Réputation solide" },
    { name: "Trade Republic", type: "Courtier", fees: "1 € / ordre", custody: "Broker", kyc: true, note: "ETF plan" },
    { name: "DEGIRO", type: "Courtier", fees: "faibles", custody: "Broker", kyc: true, note: "Frais agressifs" },
  ],
};

// --- Utils ---
const fmt = {
  k: (n) => (n >= 1000 ? (n / 1000).toFixed(1) + " T€" : n.toFixed(0) + " Md€"),
  pct: (n) => `${(n >= 0 ? "+" : "")}${n.toFixed(1)}%`,
};

// --- Rendu des cartes ---
function renderItems(type, items) {
  el.grid.innerHTML = "";
  if (!items.length) {
    el.grid.innerHTML = `<div class="card" style="grid-column:1/-1"><p class="muted">Aucun résultat pour cette recherche.</p></div>`;
    el.count.textContent = "";
    return;
  }
  el.count.textContent = `${items.length} résultat${items.length > 1 ? "s" : ""}`;

  const frags = document.createDocumentFragment();

  items.forEach((it) => {
    const card = document.createElement("article");
    card.className = "card reveal";
    card.style.padding = "14px 16px";

    if (type === "crypto") {
      card.innerHTML = `
        <div class="card-head" style="margin-bottom:6px">
          <h3 style="margin:0">${it.name} <span class="muted">• ${it.ticker}</span></h3>
          <span class="badge" style="font-size:12px; padding:4px 8px; border-radius:999px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08)">${fmt.pct(it.change24h)}</span>
        </div>
        <p class="muted" style="margin:4px 0 10px">Capitalisation ~ ${fmt.k(it.cap)}</p>
        <p class="small" style="opacity:.9">${it.note}</p>
      `;
    } else if (type === "etf") {
      card.innerHTML = `
        <div class="card-head" style="margin-bottom:6px">
          <h3 style="margin:0">${it.name} <span class="muted">• ${it.ticker}</span></h3>
          <span class="badge" style="font-size:12px; padding:4px 8px; border-radius:999px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08)">${it.provider}</span>
        </div>
        <ul class="assets" style="margin:0">
          <li><span>Frais annuels</span><strong>${it.expense.toFixed(2)}%</strong></li>
          <li><span>Perf YTD</span><strong>${fmt.pct(it.ytd)}</strong></li>
        </ul>
      `;
    } else {
      // plateforme
      card.innerHTML = `
        <div class="card-head" style="margin-bottom:6px">
          <h3 style="margin:0">${it.name} <span class="muted">• ${it.type}</span></h3>
        </div>
        <ul class="assets" style="margin:0">
          <li><span>Frais</span><strong>${it.fees}</strong></li>
          <li><span>Garde</span><strong>${it.custody}</strong></li>
          <li><span>KYC</span><strong>${it.kyc ? "Oui" : "Non"}</strong></li>
        </ul>
        <p class="small" style="opacity:.9; margin-top:6px">${it.note || ""}</p>
      `;
    }

    frags.appendChild(card);
  });

  el.grid.appendChild(frags);
}

// --- Recherche / filtrage ---
function search() {
  const type = el.type.value || "crypto";
  const q = (el.q.value || "").trim().toLowerCase();

  // source
  let items = DATA[type] ? [...DATA[type]] : [];

  // filtre texte
  if (q) {
    items = items.filter((it) =>
      Object.values(it).some((v) => String(v).toLowerCase().includes(q))
    );
  }

  // tri léger « pertinent »
  if (type === "crypto") {
    // tri par cap décroissante
    items.sort((a, b) => (b.cap || 0) - (a.cap || 0));
  } else if (type === "etf") {
    // tri par frais croissants
    items.sort((a, b) => (a.expense || 0) - (b.expense || 0));
  } else {
    // plateformes : tri par nom
    items.sort((a, b) => a.name.localeCompare(b.name));
  }

  renderItems(type, items);
}

// --- Écoutes ---
el.btn?.addEventListener("click", search);
el.q?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") search();
});
el.type?.addEventListener("change", search);

// --- Premier rendu (état par défaut) ---
search();
