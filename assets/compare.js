// assets/compare.js
// ———————————————————————————————
// Comparateur simple (Crypto / ETF / Plateformes)
// Données démo pour tester; tu brancheras une API plus tard.
// ———————————————————————————————

const input = document.getElementById('q');           // champ de recherche
const selectType = document.getElementById('type');   // select (crypto/etf/platform)
const btn = document.getElementById('btn-compare');   // bouton "Comparer"
const zone = document.getElementById('results');      // zone d'affichage

// Données de démonstration (remplaçables par API)
const DATA = {
  crypto: [
    { name: "Bitcoin", symbol: "BTC", cap: 1200000000000, perf24h: 1.8 },
    { name: "Ethereum", symbol: "ETH", cap: 450000000000, perf24h: 2.3 },
    { name: "Solana", symbol: "SOL", cap: 85000000000, perf24h: -0.6 },
  ],
  etf: [
    { name: "S&P 500 ETF", ticker: "VOO", fee: 0.03, div: 1.3 },
    { name: "MSCI World",  ticker: "IWDA", fee: 0.20, div: 1.4 },
    { name: "NASDAQ 100",  ticker: "QQQ", fee: 0.20, div: 0.6 },
  ],
  platform: [
    { name: "Binance", fees: "faibles", kyc: true,  staking: true },
    { name: "Kraken",  fees: "moyens",  kyc: true,  staking: true },
    { name: "TradeRep", fees: "moyens", kyc: true,  staking: false },
  ]
};

// Utilitaire format
const € = n => n.toLocaleString('fr-FR',{style:'currency',currency:'EUR'});

// Rendu de cartes
function render(items, type){
  zone.innerHTML = ''; // reset

  if (!items.length){
    zone.innerHTML = `<p class="muted">Aucun résultat.</p>`;
    return;
  }

  const frag = document.createDocumentFragment();

  items.forEach(it => {
    const card = document.createElement('div');
    card.className = 'card reveal';
    if (type === 'crypto'){
      card.innerHTML = `
        <h3>${it.name} <span class="muted">(${it.symbol})</span></h3>
        <p>Capitalisation : <strong>${€(it.cap)}</strong></p>
        <p>Perf 24h : <strong>${it.perf24h}%</strong></p>
      `;
    } else if (type === 'etf'){
      card.innerHTML = `
        <h3>${it.name} <span class="muted">(${it.ticker})</span></h3>
        <p>Frais annuels : <strong>${it.fee}%</strong></p>
        <p>Dividende : <strong>${it.div}%</strong></p>
      `;
    } else {
      card.innerHTML = `
        <h3>${it.name}</h3>
        <p>Frais : <strong>${it.fees}</strong></p>
        <p>KYC : <strong>${it.kyc ? 'Oui' : 'Non'}</strong> — Staking : <strong>${it.staking ? 'Oui' : 'Non'}</strong></p>
      `;
    }
    frag.appendChild(card);
  });

  zone.appendChild(frag);
}

// Filtre basique par texte
function filterList(type, query){
  const list = DATA[type] || [];
  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(q)));
}

// Évènements
btn.addEventListener('click', () => {
  const type = selectType.value;           // 'crypto' | 'etf' | 'platform'
  const query = input.value.trim();
  const results = filterList(type, query);
  render(results, type);
});

// Enter dans le champ = lancer
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btn.click();
});

// Premier rendu (liste crypto par défaut)
render(DATA.crypto, 'crypto');
