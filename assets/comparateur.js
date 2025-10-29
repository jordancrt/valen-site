<!doctype html><html lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ValenHub — Comparateur</title>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header class="navbar">
  <div class="container nav-container">
    <a class="nav-brand" href="index.html"><img src="assets/icon-192.png" alt=""><span>VALENHUB</span></a>
    <nav><ul class="nav-links">
      <li><a href="index.html">Accueil</a></li>
      <li><a href="dashboard.html">Tableau de bord</a></li>
      <li><a class="active" href="comparateur.html">Comparateur</a></li>
      <li><a href="profil.html">Profil</a></li>
    </ul></nav>
  </div>
</header>

<main class="container" style="padding:24px 0 64px">
  <section class="card" style="display:grid;grid-template-columns:1fr 180px 140px auto;gap:10px;align-items:center">
    <input id="q" class="input" placeholder="Ex: ETF monde, stablecoin, PEA Europe…">
    <select id="type" class="select">
      <option value="">Tous</option><option value="crypto">Crypto</option><option value="etf">ETF</option><option value="plateforme">Plateformes</option>
    </select>
    <select id="sort" class="select">
      <option value="">Tri</option><option value="fee">Frais</option><option value="cap">Taille</option>
    </select>
    <button id="btnSearch" class="btn btn-primary">Comparer</button>
  </section>

  <section class="card" style="margin-top:16px">
    <div class="card-head"><h3>Résultats</h3><span id="count" class="muted"></span></div>
    <div id="grid" class="grid-cards"></div>
  </section>
</main>

<footer class="footer"><div class="container">© 2025 ValenHub — Données locales de démonstration</div></footer>
<script src="assets/comparateur.js"></script>
</body></html>
const $=s=>document.querySelector(s);const q=$('#q'),t=$('#type'),srt=$('#sort'),btn=$('#btnSearch'),grid=$('#grid'),count=$('#count');
let DATA={crypto:[],etf:[],plateforme:[]};
function skel(){grid.innerHTML=Array.from({length:6}).map(()=>`<div class="card" style="height:110px;opacity:.6"></div>`).join('');count.textContent=''}
async function load(){skel();const [c,e,p]=await Promise.all([
  fetch('assets/data/cryptos.json').then(r=>r.json()),fetch('assets/data/etf.json').then(r=>r.json()),fetch('assets/data/platforms.json').then(r=>r.json())
]);DATA.crypto=c;DATA.etf=e;DATA.plateforme=p;search()}
function norm(s){return (s||'').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'')}
function card(item,kind){const add=`<p style="margin-top:8px"><button class="btn btn-small" data-add='${encodeURIComponent(JSON.stringify(item))}'>Ajouter au Dashboard</button></p>`;
 if(kind==='crypto')return `<article class="card"><div class="card-head"><h3>${item.name} <span class="muted">(${item.ticker})</span></h3><span class="badge">CRYPTO</span></div><p class="small muted">Cap ${(item.cap/1e9).toFixed(0)} Md — Risque ${item.risk}</p>${add}</article>`;
 if(kind==='etf')return `<article class="card"><div class="card-head"><h3>${item.name} <span class="muted">(${item.ticker})</span></h3><span class="badge">ETF</span></div><p class="small muted">TER ${item.ter}% — Risque ${item.risk} — ${item.provider}</p>${add}</article>`;
 return `<article class="card"><div class="card-head"><h3>${item.name}</h3><span class="badge">PLATEFORME</span></div><p class="small muted">${item.kind} — Frais ${item.fees} — Confiance ${item.trust}</p>${add}</article>`}
function search(){const needle=norm(q.value),type=t.value;let rows=[];const push=(arr,k)=>arr.forEach(x=>rows.push({...x,__k:k}));
 if(!type||type==='crypto')push(DATA.crypto,'crypto'); if(!type||type==='etf')push(DATA.etf,'etf'); if(!type||type==='plateforme')push(DATA.plateforme,'plateforme');
 if(needle)rows=rows.filter(x=>norm(Object.values(x).join(' ')).includes(needle));
 if(srt.value==='fee')rows.sort((a,b)=>String(a.fees||a.ter||'').localeCompare(String(b.fees||b.ter||'')));
 if(srt.value==='cap')rows.sort((a,b)=>(b.cap||0)-(a.cap||0));
 grid.innerHTML = rows.map(r=>card(r,r.__k)).join('') || `<div class="muted">Aucun résultat.</div>`;
 count.textContent = rows.length?`${rows.length} résultat(s)`:''; bindAdd()}
function bindAdd(){grid.querySelectorAll('button[data-add]').forEach(b=>b.addEventListener('click',e=>{const it=JSON.parse(decodeURIComponent(e.currentTarget.dataset.add));
 const favs=JSON.parse(localStorage.getItem('valenhub-favs')||'[]'); if(!favs.find(x=>x.name===it.name))favs.push(it);
 localStorage.setItem('valenhub-favs',JSON.stringify(favs)); b.textContent='Ajouté ✔';}))}
btn.addEventListener('click',search); q.addEventListener('keydown',e=>{if(e.key==='Enter')search()}); t.addEventListener('change',search); srt.addEventListener('change',search);
load();
