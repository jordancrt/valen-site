// assets/compare.js
const $ = (s)=>document.querySelector(s);
const results = $("#results");
$("#search").addEventListener("click", run);
$("#q").addEventListener("keydown", e=>{ if(e.key==="Enter") run(); });

async function run(){
  const cat = $("#category").value;
  const q = $("#q").value.trim().toLowerCase();
  results.innerHTML = `<div class="skeleton" style="height:120px"></div>`;

  if(cat==="crypto"){
    const list = await fetchCrypto(q);
    renderCards(list.map(c => ({
      title: `${cap(c.name)} (${c.symbol.toUpperCase()})`,
      lines: [
        `Prix: ${fmt(c.current_price)}€`,
        `Var 24h: ${signed(c.price_change_percentage_24h)}%`,
        `Cap: ${fmt(c.market_cap)}€`
      ],
      link: `https://www.coingecko.com/fr/pi%C3%A8ces/${c.id}`
    })));
  } else if(cat==="etf"){
    // Placeholder simple: à remplacer par Yahoo Finance + proxy
    renderEmpty("Connectons Yahoo Finance (ETF) dans la prochaine étape.");
  } else {
    // Plateformes – tableau statique à enrichir (affiliation)
    renderCards([
      {title:"Binance", lines:["Spot, Futures, Earn"], link:"https://www.binance.com"},
      {title:"Bitget", lines:["Spot, Copy Trading, Earn"], link:"https://www.bitget.com"},
      {title:"Trade Republic", lines:["ETF/Actions, PEA perso plus tard"], link:"https://traderepublic.com"}
    ]);
  }
}

async function fetchCrypto(q){
  // Top 100 EUR
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h";
  const data = await (await fetch(url)).json();
  if(!q) return data;
  const s = q.toLowerCase();
  return data.filter(c => c.name.toLowerCase().includes(s) || c.symbol.toLowerCase().includes(s));
}

function renderCards(items){
  results.innerHTML = items.map(it => `
    <a class="card" href="${it.link}" target="_blank" rel="noopener">
      <h3>${it.title}</h3>
      <p class="muted">${it.lines.join(" · ")}</p>
    </a>
  `).join("");
}
function renderEmpty(msg){ results.innerHTML = `<div class="card"><p>${msg}</p></div>`; }
const fmt = n => new Intl.NumberFormat("fr-FR",{maximumFractionDigits:2}).format(n);
const signed = x => (x>0?"+":"") + fmt(x);
const cap = s => s.charAt(0).toUpperCase()+s.slice(1);
