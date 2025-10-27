<script>
// --- Sélecteurs
const $q = document.getElementById('q');
const $type = document.getElementById('type');
const $btn = document.getElementById('btnSearch');
const $grid = document.getElementById('grid');
const $count = document.getElementById('count');

// --- Charge les datasets en parallèle
let DATA = { crypto: [], etf: [], plateforme: [] };

async function loadData() {
  const [cryptos, etfs, plats] = await Promise.all([
    fetch('assets/data/cryptos.json').then(r=>r.json()),
    fetch('assets/data/etf.json').then(r=>r.json()),
    fetch('assets/data/platforms.json').then(r=>r.json()),
  ]);
  DATA.crypto = cryptos;
  DATA.etf = etfs;
  DATA.plateforme = plats;
}
function norm(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,''); }

// --- Rendu d’une “carte” résultat
function card(item, t){
  if(t==='crypto'){
    return `
      <div class="card feature">
        <h3>${item.name} <span class="muted">(${item.ticker})</span></h3>
        <p class="muted">Cap.: ${(item.cap/1e9).toFixed(0)} Md€ — Risque: ${item.risk}</p>
        <div class="small">Rendement stable: ${item.yield ? item.yield+'%' : '—'}</div>
      </div>`;
  }
  if(t==='etf'){
    return `
      <div class="card feature">
        <h3>${item.name} <span class="muted">(${item.ticker})</span></h3>
        <p class="muted">Fournisseur: ${item.provider}</p>
        <div class="small">TER: ${item.ter}% — Risque: ${item.risk}</div>
      </div>`;
  }
  // plateforme
  return `
    <div class="card feature">
      <h3>${item.name}</h3>
      <p class="muted">${item.kind}</p>
      <div class="small">Frais: ${item.fees} — Confiance: ${item.trust}</div>
    </div>`;
}

// --- Recherche + tri simple
function search() {
  const t = $type.value;                       // crypto | etf | plateforme
  const needle = norm($q.value);

  let rows = DATA[t] || [];
  if(needle){
    rows = rows.filter(x => norm(Object.values(x).join(' ')).includes(needle));
  }

  // tri par critère pertinent
  if(t==='crypto') rows = rows.sort((a,b)=>(b.cap||0)-(a.cap||0));
  if(t==='etf') rows = rows.sort((a,b)=>(a.ter||0)-(b.ter||0));
  if(t==='plateforme') rows = rows.sort((a,b)=> String(a.fees).localeCompare(String(b.fees)));

  $grid.innerHTML = rows.map(r => card(r,t)).join('') || `<div class="muted">Aucun résultat.</div>`;
  $count.textContent = rows.length ? `${rows.length} résultat(s)` : '';
}

$btn.addEventListener('click', search);
$q.addEventListener('keydown', e=>{ if(e.key==='Enter') search(); });

// Init
loadData().then(search);
</script>
