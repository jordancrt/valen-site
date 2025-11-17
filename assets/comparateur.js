// =======================
// Données simulées (démo)
// =======================
const DATA = [
  {
    name: "Amundi MSCI World",
    ticker: "CW8",
    type: "etf",
    risk: "low",
    pea: true,
    style: ["long"],
    perf5: 0.72,      // 72 %
    fee: 0.0038,      // 0.38 %
    vol: 0.14,        // 14 %
  },
  {
    name: "Lyxor S&P 500",
    ticker: "SP5",
    type: "etf",
    risk: "mid",
    pea: true,
    style: ["long"],
    perf5: 0.85,
    fee: 0.0015,
    vol: 0.18,
  },
  {
    name: "Bitcoin",
    ticker: "BTC",
    type: "crypto",
    risk: "high",
    pea: false,
    style: ["long", "court"],
    perf5: 3.5,
    fee: 0.005,
    vol: 0.80,
  },
  {
    name: "Ethereum",
    ticker: "ETH",
    type: "crypto",
    risk: "high",
    pea: false,
    style: ["long", "court"],
    perf5: 2.2,
    fee: 0.004,
    vol: 0.65,
  },
  {
    name: "Apple",
    ticker: "AAPL",
    type: "action",
    risk: "mid",
    pea: false,
    style: ["long"],
    perf5: 1.10,
    fee: 0.001,
    vol: 0.22,
  },
  {
    name: "BNP Paribas Actions Europe",
    ticker: "BNPEU",
    type: "etf",
    risk: "mid",
    pea: true,
    style: ["long", "dividende"],
    perf5: 0.58,
    fee: 0.007,
    vol: 0.19,
  },
  {
    name: "Livret A (simulation)",
    ticker: "LVA",
    type: "plateforme",
    risk: "low",
    pea: false,
    style: ["court"],
    perf5: 0.08,
    fee: 0,
    vol: 0.01,
  },
  {
    name: "Plateforme crypto CEXX",
    ticker: "CEXX",
    type: "plateforme",
    risk: "high",
    pea: false,
    style: ["court"],
    perf5: 1.5,
    fee: 0.01,
    vol: 0.75,
  }
];

// =======================
// Utilitaires d'affichage
// =======================
function formatPercent(p) {
  const sign = p >= 0 ? "+" : "";
  return sign + (p * 100).toFixed(1) + " %";
}

function formatFee(f) {
  return (f * 100).toFixed(2) + " %";
}

function formatVol(v) {
  return (v * 100).toFixed(0) + " %";
}

function riskLabel(r) {
  if (r === "low") return "Faible";
  if (r === "mid") return "Moyen";
  if (r === "high") return "Élevé";
  return r;
}

// Score très simple : perf - volatilité - frais (juste pour trier)
function scoreOf(item) {
  return item.perf5 - item.vol - item.fee * 2;
}

// =======================
// Récupération des éléments
// =======================
const qInput   = document.getElementById("q");
const typeSel  = document.getElementById("type");
const riskSel  = document.getElementById("risk");
const sortSel  = document.getElementById("sort");
const btnSearch = document.getElementById("btnSearch");
const chips    = document.querySelectorAll(".chip");

const resultsEl = document.getElementById("results");
const countEl   = document.getElementById("count");

let activeChip = null;

// =======================
// Rendu des résultats
// =======================
function renderSkeleton() {
  resultsEl.innerHTML = `
    <div class="skeleton-row"></div>
    <div class="skeleton-row"></div>
    <div class="skeleton-row"></div>
    <div class="skeleton-row"></div>
  `;
  countEl.textContent = "Chargement…";
}

function renderResults(list) {
  if (!list || list.length === 0) {
    resultsEl.innerHTML = `
      <div class="empty-state">
        <p>Aucun résultat ne correspond exactement à tes filtres.</p>
        <p class="muted small">Essaie d’élargir le risque, le type ou de retirer un filtre rapide.</p>
      </div>
    `;
    countEl.textContent = "0 résultat";
    return;
  }

  const html = list.map(item => {
    const perfCls = item.perf5 >= 0 ? "perf up" : "perf down";
    const riskCls = `risk-badge ${item.risk}`;
    const tags = [
      item.type.toUpperCase(),
      item.pea ? "Éligible PEA" : null,
      item.style.includes("dividende") ? "Dividende" : null,
      item.style.includes("long") ? "Long terme" : null,
      item.style.includes("court") ? "Court terme" : null,
    ].filter(Boolean).join(" • ");

    return `
      <div class="result-row">
        <div class="col-asset">
          <div class="asset-name">${item.name}</div>
          <div class="asset-ticker muted small">${item.ticker}</div>
          <div class="asset-tags muted xsmall">${tags}</div>
        </div>
        <div class="col-perf">
          <div class="${perfCls}">${formatPercent(item.perf5)}</div>
          <div class="muted xsmall">sur 5 ans</div>
        </div>
        <div class="col-fee">
          <div>${formatFee(item.fee)}</div>
          <div class="muted xsmall">frais / spread</div>
        </div>
        <div class="col-vol">
          <div>${formatVol(item.vol)}</div>
          <div class="muted xsmall">volatilité</div>
        </div>
        <div class="col-risk">
          <span class="${riskCls}">Risque ${riskLabel(item.risk)}</span>
        </div>
      </div>
    `;
  }).join("");

  resultsEl.innerHTML = html;
  countEl.textContent = `${list.length} résultat${list.length > 1 ? "s" : ""}`;
}

// =======================
// Logique de filtre
// =======================
function getFilteredData() {
  const q      = (qInput.value || "").toLowerCase().trim();
  const type   = typeSel.value;
  const risk   = riskSel.value;
  const sort   = sortSel.value;
  const chip   = activeChip; // pea / dividende / long / court / null

  let list = [...DATA];

  // filtre texte
  if (q) {
    list = list.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.ticker.toLowerCase().includes(q)
    );
  }

  // filtre type
  if (type !== "all") {
    list = list.filter(i => i.type === type);
  }

  // filtre risque
  if (risk !== "all") {
    list = list.filter(i => i.risk === risk);
  }

  // filtre chip
  if (chip === "pea") {
    list = list.filter(i => i.pea);
  } else if (chip === "dividende") {
    list = list.filter(i => i.style.includes("dividende"));
  } else if (chip === "long") {
    list = list.filter(i => i.style.includes("long"));
  } else if (chip === "court") {
    list = list.filter(i => i.style.includes("court"));
  }

  // tri
  if (sort === "score") {
    list.sort((a, b) => scoreOf(b) - scoreOf(a));
  } else if (sort === "perf") {
    list.sort((a, b) => b.perf5 - a.perf5);
  } else if (sort === "fee") {
    list.sort((a, b) => a.fee - b.fee);
  } else if (sort === "vol") {
    list.sort((a, b) => a.vol - b.vol);
  }

  return list;
}

function refresh() {
  const data = getFilteredData();
  renderResults(data);
}

// =======================
// Événements
// =======================
btnSearch.addEventListener("click", () => {
  refresh();
});

[qInput, typeSel, riskSel, sortSel].forEach(el => {
  if (!el) return;
  el.addEventListener("change", refresh);
  el.addEventListener("keyup", e => {
    if (el === qInput && e.key === "Enter") refresh();
  });
});

// Chips (filtres rapides)
chips.forEach(chip => {
  chip.addEventListener("click", () => {
    const value = chip.dataset.chip;
    if (activeChip === value) {
      activeChip = null;
      chip.classList.remove("is-active");
    } else {
      activeChip = value;
      chips.forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
    }
    refresh();
  });
});

// =======================
// Initialisation
// =======================
(function initFromURL(){
  try {
    const params = new URLSearchParams(window.location.search);
    const risk = params.get("risk");
    if (risk === "low" || risk === "mid" || risk === "high") {
      riskSel.value = risk;
    }
  } catch(e) {}
})();

// petit “squelette” au chargement
renderSkeleton();
setTimeout(() => {
  refresh();
}, 500);
