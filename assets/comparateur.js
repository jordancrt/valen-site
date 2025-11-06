/* ValenHub – Comparateur
   Fonctionne en 100% front : charge assets/data/*.json et filtre/tri localement.
*/

const els = {
  q:        document.getElementById('q'),
  type:     document.getElementById('type'),
  btn:      document.getElementById('btnSearch'),
  sort:     document.getElementById('sort'),
  chips:    document.getElementById('chips'),
  grid:     document.getElementById('grid'),
  count:    document.getElementById('count'),
  error:    document.getElementById('errorBox'),
  pagin:    document.getElementById('pagin'),
  prev:     document.getElementById('prevPage'),
  next:     document.getElementById('nextPage'),
  pageInfo: document.getElementById('pageInfo'),
};

let DATASET = [];              // données brutes du dataset courant
let RESULTS = [];              // résultats après filtre + tri
let PAGE = 1;
const PER_PAGE = 12;

// --- utilitaires -------------------------------------------------------------

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
const fmt = {
  pct: (v) => (v === undefined || v === null || isNaN(v)) ? '—' : `${(v*100).toFixed(1)}%`,
  fee: (v) => (v === undefined || v === null || isNaN(v)) ? '—' : `${(v*100).toFixed(2)}%`,
  cur: (v) => (v === undefined || v === null || isNaN(v)) ? '—' : v.toLocaleString('fr-FR', { style:'currency', currency:'EUR' }),
  riskBadge: (r) => {
    if (r === undefined || r === null || isNaN(r)) return `<span class="badge">Risque n/d</span>`;
    const label = r <= 2 ? 'Faible' : r <= 4 ? 'Moyen' : 'Élevé';
    return `<span class="badge">Risque ${label}</span>`;
  }
};

function saveState() {
  localStorage.setItem('vh-cmp', JSON.stringify({
    q: els.q.value, type: els.type.value, sort: els.sort.value
  }));
}

function restoreState() {
  try {
    const s = JSON.parse(localStorage.getItem('vh-cmp') || '{}');
    if (s.q) els.q.value = s.q;
    if (s.type) els.type.value = s.type;
    if (s.sort) els.sort.value = s.sort;
  } catch {}
}

// --- chargement datasets -----------------------------------------------------

async function loadDataset(kind) {
  const map = {
    crypto:     'assets/data/cryptos.json',
    etf:        'assets/data/etf.json',
    plateforme: 'assets/data/platforms.json',
    // Raccourci si ton fichier s’appelle "plateforms.json":
    // plateforme: 'assets/data/plateforms.json',
  };
  const url = map[kind] || map.crypto;

  els.error.style.display = 'none';
  els.grid.innerHTML = skeleton(8);

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    // normalisation douce pour avoir des clés communes
    DATASET = (raw || []).map((x) => ({
      // champs génériques
      name:         x.name || x.ticker || x.symbol || 'Sans nom',
      symbol:       x.symbol || x.ticker || '',
      category:     x.category || x.theme || x.sector || '',
      description:  x.description || '',
      // métriques selon type
      perf1y:       safeNum(x.perf1y ?? x.performance_1y ?? x.perf_1y),
      fees:         safeNum(x.fees ?? x.ter ?? x.cost),
      risk:         safeNum(x.risk ?? x.risk_score ?? x.volatility),
      aum:          safeNum(x.aum),
      price:        safeNum(x.price),
      // liens
      url:          x.url || x.link || '',
      exchange:     x.exchange || x.broker || '',
      // pour les plateformes
      makerFee:     safeNum(x.maker_fee),
      takerFee:     safeNum(x.taker_fee),
      trust:        safeNum(x.trust),
      type:         kind,
      _raw:         x,
    }));

    buildChips(kind);
    runSearch(); // applique filtre + tri + rendu
  } catch (e) {
    els.grid.innerHTML = '';
    els.count.textContent = '';
    els.pagin.hidden = true;
    els.error.textContent = `Impossible de charger les données (${e.message}).`;
    els.error.style.display = 'block';
  }
}

function safeNum(v) {
  const n = Number(v);
  return isFinite(n) ? n : undefined;
}

// --- filtres chips -----------------------------------------------------------

function buildChips(kind) {
  const chips = [];
  if (kind === 'crypto') {
    chips.push({k:'stablecoin',label:'Stablecoins'});
    chips.push({k:'layer 1',label:'Layer 1'});
    chips.push({k:'defi',label:'DeFi'});
    chips.push({k:'ai',label:'IA'});
  } else if (kind === 'etf') {
    chips.push({k:'s&p',label:'S&P 500'});
    chips.push({k:'msci',label:'MSCI World'});
    chips.push({k:'emerging',label:'Marchés émergents'});
    chips.push({k:'obligation',label:'Obligations'});
  } else if (kind === 'plateforme') {
    chips.push({k:'frais bas',label:'Frais bas'});
    chips.push({k:'staking',label:'Staking'});
    chips.push({k:'dca',label:'DCA'});
  }
  els.chips.innerHTML = chips.map(c => `<button class="chip" data-q="${c.k}">${c.label}</button>`).join('');
  els.chips.querySelectorAll('.chip').forEach(b => {
    b.addEventListener('click', () => {
      els.q.value = b.dataset.q;
      runSearch();
    });
  });
}

// --- recherche / tri / pagination -------------------------------------------

function runSearch() {
  saveState();
  PAGE = 1;

  const q = norm(els.q.value.trim());
  const type = els.type.value;
  const sort = els.sort.value;

  // filtre texte
  let arr = DATASET.filter((it) => {
    if (!q) return true;
    const hay = norm([it.name, it.symbol, it.category, it.description, it.exchange].join(' '));
    return q.split(/\s+/).every(tok => hay.includes(tok));
  });

  // tri
  arr = sortResults(arr, sort);

  RESULTS = arr;
  renderPage(PAGE);
}

function sortResults(arr, sort) {
  const by = (k, dir='desc') => (a,b) => {
    const va = a[k] ?? -Infinity, vb = b[k] ?? -Infinity;
    return dir === 'desc' ? (vb - va) : (va - vb);
  };

  if (sort === 'perf1y') return arr.sort(by('perf1y','desc'));
  if (sort === 'fees')   return arr.sort(by('fees','asc'));
  if (sort === 'risk')   return arr.sort(by('risk','asc'));

  // pertinence naïve : perf puis frais puis risque
  return arr.sort((a,b) => (b.perf1y??-99)-(a.perf1y??-99) || (a.fees??99)-(b.fees??99) || (a.risk??99)-(b.risk??99));
}

function renderPage(p) {
  const total = RESULTS.length;
  els.count.textContent = total ? `${total} éléments` : 'Aucun résultat';
  els.error.style.display = 'none';

  if (!total) {
    els.grid.innerHTML = '';
    els.pagin.hidden = true;
    return;
  }

  const maxPage = Math.ceil(total / PER_PAGE);
  PAGE = Math.min(Math.max(1, p), maxPage);
  const start = (PAGE - 1) * PER_PAGE;
  const pageItems = RESULTS.slice(start, start + PER_PAGE);

  els.grid.innerHTML = pageItems.map(renderCard).join('');
  els.pagin.hidden = maxPage <= 1;
  els.pageInfo.textContent = `Page ${PAGE} / ${maxPage}`;
  els.prev.disabled = PAGE <= 1;
  els.next.disabled = PAGE >= maxPage;
}

function renderCard(it) {
  // perf pill (couleur selon signe)
  const perf = (it.perf1y !== undefined) ? (it.perf1y*100) : undefined;
  const perfTxt = (perf === undefined) ? '—' : `${perf.toFixed(1)}%`;
  const perfCls = (perf === undefined) ? 'pill--flat' : (perf > 0 ? 'pill--up' : (perf < 0 ? 'pill--down' : 'pill--flat'));

  // colonne “prix / frais / TER” selon type
  const col2 = (() => {
    if (it.type === 'crypto') {
      return `
        <div class="metric">
          <span class="label">Prix</span>
          <strong>${it.price !== undefined ? it.price.toLocaleString('fr-FR') : '—'}</strong>
        </div>
      `;
    }
    if (it.type === 'etf') {
      return `
        <div class="metric">
          <span class="label">TER</span>
          <strong>${fmt.fee(it.fees)}</strong>
        </div>
      `;
    }
    return `
      <div class="metric">
        <span class="label">Frais taker</span>
        <strong>${fmt.fee(it.takerFee)}</strong>
      </div>
    `;
  })();
// --- Helpers viz -------------------------------------------------------------

function sparklineSVG(values=[], w=140, h=36){
  if (!values || !values.length) values = seededSpark('x');
  const min = Math.min(...values), max = Math.max(...values);
  const span = (max - min) || 1;
  const step = (w - 8) / (values.length - 1); // 4px padding latéral

  let d = '';
  values.forEach((v,i)=>{
    const x = 4 + i*step;
    const y = h - 4 - ((v - min) / span) * (h - 8);
    d += (i===0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  });

  // Ligne médiane (axe zéro approximatif)
  const midY = h - 4 - ((0 - min) / span) * (h - 8);

  return `
    <svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      ${isFinite(midY) ? `<path class="axis" d="M 0 ${midY.toFixed(2)} L ${w} ${midY.toFixed(2)}" />` : ''}
      <path d="${d}" />
    </svg>
  `;
}

// Spark pseudo-déterministe pour éviter le “vide”
function seededSpark(seed='seed', n=24){
  let s = 0;
  for (let i=0;i<seed.length;i++) s = (s*131 + seed.charCodeAt(i)) % 9973;
  const arr = [];
  let v = (s % 50) + 50;
  for (let i=0;i<n;i++){
    s = (s*1103515245 + 12345) & 0x7fffffff;
    const delta = ((s % 9) - 4); // -4..+4
    v = Math.max(10, Math.min(190, v + delta));
    arr.push(v);
  }
  return arr;
}
  // colonne catégorie / AUM / maker fee
  const col3 = (() => {
    if (it.type === 'crypto') {
      return `
        <div class="metric">
          <span class="label">Catégorie</span>
          <span>${it.category || '—'}</span>
        </div>
      `;
    }
    if (it.type === 'etf') {
      return `
        <div class="metric">
          <span class="label">Encours (AUM)</span>
          <strong>${it.aum ? it.aum.toLocaleString('fr-FR') + ' €' : '—'}</strong>
        </div>
      `;
    }
    return `
      <div class="metric">
        <span class="label">Frais maker</span>
        <strong>${fmt.fee(it.makerFee)}</strong>
      </div>
    `;
  })();

  // risk bar (0-6 attendu — on clippe)
  const riskVal = (it.risk ?? 0);
  const riskPct = Math.max(0, Math.min(6, riskVal)) / 6 * 100;

  // sparkline (array “spark” sinon on génère stable)
  const sparkArr = it.spark || it.history || it.prices || seededSpark(it.name);
  const sparkSvg = sparklineSVG(sparkArr, 140, 36);

  return `
    <article class="result-card">
      <div class="rc-col-title">
        <div class="rc-name">${it.name} ${it.symbol ? `<span class="muted">· ${it.symbol}</span>`:''}</div>
        <div class="rc-sub">${it.type === 'plateforme' ? (it.exchange || 'Plateforme') : (it.category || '—')}</div>
      </div>

      <div class="metric">
        <span class="label">Perf 1 an</span>
        <span class="pill ${perfCls}">${perfTxt}</span>
      </div>

      ${col2}

      <div class="riskcol">
        <span class="label">Risque</span>
        <div class="riskbar"><span style="width:${riskPct.toFixed(0)}%"></span></div>
      </div>

      <div>${sparkSvg}</div>
    </article>
  `;
}

  // plateformes / courtiers
  return `
    <article class="card result-card reveal">
      <div class="rc-title">
        <h4>${it.name} <span class="muted">${it.exchange || ''}</span></h4>
        ${fmt.riskBadge(it.risk)}
      </div>
      <div class="rc-lines">
        <div><span class="muted small">Frais maker</span><strong>${fmt.fee(it.makerFee)}</strong></div>
        <div><span class="muted small">Frais taker</span><strong>${fmt.fee(it.takerFee)}</strong></div>
        <div><span class="muted small">Confiance</span><strong>${it.trust ?? '—'}</strong></div>
      </div>
      ${it.url ? `<a class="btn btn-ghost" href="${it.url}" target="_blank" rel="noopener">Aller sur la plateforme</a>` : ''}
    </article>
  `;
}

function skeleton(n=8){
  return Array.from({length:n}).map(()=>`
    <article class="card result-card skeleton">
      <div style="height:20px;margin-bottom:12px"></div>
      <div style="height:14px;margin:10px 0"></div>
      <div style="height:14px;margin:10px 0"></div>
      <div style="height:14px;margin:10px 0 4px"></div>
    </article>
  `).join('');
}

// --- events ------------------------------------------------------------------

els.btn.addEventListener('click', runSearch);
els.q.addEventListener('keydown', (e)=>{ if(e.key==='Enter') runSearch(); });
els.type.addEventListener('change', async ()=>{
  saveState();
  await loadDataset(els.type.value);
});
els.sort.addEventListener('change', runSearch);

els.prev.addEventListener('click', ()=> renderPage(PAGE-1));
els.next.addEventListener('click', ()=> renderPage(PAGE+1));

// init
restoreState();
loadDataset(els.type.value);
// ... après DATASET = ... et buildChips(kind);
els.grid.classList.add('results-list'); // <-- ajoute cette ligne
runSearch();
// Anti-rebond universel
function debounce(fn, delay=250){
  let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), delay); };
}
window.addEventListener('touchstart', ()=>{}, {passive:true});
window.addEventListener('scroll', ()=>{}, {passive:true});
function skeleton(n=6){
  return Array.from({length:n}).map(()=>`
    <article class="result-card">
      <div class="skeleton" style="height:16px;width:60%;margin-bottom:8px;"></div>
      <div class="skeleton" style="height:12px;width:40%;margin-bottom:14px;"></div>
      <div class="skeleton" style="height:36px;width:120px;border-radius:10px;"></div>
    </article>
  `).join('');
}
function renderInBatches(items, renderFn, container, batchSize=10){
  container.innerHTML = "";
  let i = 0;
  function step(){
    const frag = document.createDocumentFragment();
    for (let c=0; c<batchSize && i<items.length; c++, i++){
      const div = document.createElement('div');
      div.innerHTML = renderFn(items[i]);
      frag.appendChild(div.firstElementChild);
    }
    container.appendChild(frag);
    if (i < items.length) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const els = {
  q: document.getElementById('q'),
  type: document.getElementById('type'),
  grid: document.getElementById('grid'),
  count: document.getElementById('count'),
  btn: document.getElementById('btnSearch')
};

const CACHE_KEY = 'vh-last-results';

async function fetchData(kind){
  const map = { crypto:'assets/data/cryptos.json', etf:'assets/data/etf.json', plateforme:'assets/data/platforms.json' };
  const url = map[kind] || map.crypto;
  const res = await fetch(url, {cache:'force-cache'});
  return res.json();
}

function renderCard(item){
  const risk = item.risk ?? 'n/d';
  const price = item.price ? `${item.price} €` : '—';
  const perfY = item.perfY ? `${item.perfY}%` : '—';
  return `
  <article class="result-card card">
    <div class="rc-head">
      <h4>${item.name} · <span class="muted">${item.ticker || item.symbol || ''}</span></h4>
      <span class="badge">Risque ${risk}</span>
    </div>
    <div class="rc-grid">
      <div><div class="small muted">Prix</div><div class="big">${price}</div></div>
      <div><div class="small muted">Perf 1 an</div><div class="big">${perfY}</div></div>
      <div><div class="small muted">Catégorie</div><div>${item.category || '—'}</div></div>
    </div>
    <div class="rc-actions">
      <button class="btn btn-secondary">Voir détails</button>
      <button class="btn btn-primary">Ajouter</button>
    </div>
  </article>`;
}

async function runSearch(){
  els.grid.innerHTML = skeleton(8);

  const kind = els.type.value;
  const query = (els.q.value || '').toLowerCase().trim();

  try{
    const data = await fetchData(kind);
    let rows = data;

    if (query){
      const q = query.split(/\s+/);
      rows = data.filter(d => q.every(w =>
        (d.name||'').toLowerCase().includes(w) ||
        (d.symbol||'').toLowerCase().includes(w) ||
        (d.ticker||'').toLowerCase().includes(w) ||
        (d.category||'').toLowerCase().includes(w)
      ));
    }

    els.count.textContent = `${rows.length} élément${rows.length>1?'s':''}`;
    localStorage.setItem(CACHE_KEY, JSON.stringify({kind, query, rows}));

    // Rendu progressif (fluide sur mobile)
    renderInBatches(rows, renderCard, els.grid, 8);

  }catch(e){
    els.grid.innerHTML = `<div class="muted">Erreur de chargement. Réessaie.</div>`;
    console.error(e);
  }
}

// Déclencheurs
els.btn.addEventListener('click', runSearch);
els.q.addEventListener('input', debounce(runSearch, 350));
els.type.addEventListener('change', runSearch);

// Restaure dernier résultat pour instantanéité
(() => {
  const saved = localStorage.getItem(CACHE_KEY);
  if (!saved) return;
  const {kind, query, rows} = JSON.parse(saved);
  if (kind) els.type.value = kind;
  if (query) els.q.value = query;
  els.count.textContent = `${rows.length} élément${rows.length>1?'s':''}`;
  renderInBatches(rows, renderCard, els.grid, 8);
})();
// Anti-rebond universel
function debounce(fn, delay=250){
  let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), delay); };
}
window.addEventListener('touchstart', ()=>{}, {passive:true});
window.addEventListener('scroll', ()=>{}, {passive:true});
