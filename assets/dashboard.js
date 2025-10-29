<!doctype html><html lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ValenHub — Tableau de bord</title>
<link rel="stylesheet" href="assets/style.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
</head>
<body>
<header class="navbar">
  <div class="container nav-container">
    <a class="nav-brand" href="index.html"><img src="assets/icon-192.png" alt=""><span>VALENHUB</span></a>
    <nav><ul class="nav-links">
      <li><a href="index.html">Accueil</a></li>
      <li><a class="active" href="dashboard.html">Tableau de bord</a></li>
      <li><a href="comparateur.html">Comparateur</a></li>
      <li><a href="profil.html">Profil</a></li>
    </ul></nav>
  </div>
</header>

<main class="container" style="padding:24px 0 64px">
  <!-- KPI -->
  <section class="grid-cards">
    <div class="card"><div class="card-head"><h3>Patrimoine</h3></div><div id="kpi-wealth" style="font-size:28px;font-weight:800">—</div></div>
    <div class="card"><div class="card-head"><h3>Variation 30 j</h3></div><div id="kpi-variation" style="font-size:28px;font-weight:800">—</div></div>
    <div class="card"><div class="card-head"><h3>Dépenses du mois</h3></div><div id="kpi-expenses" style="font-size:28px;font-weight:800">—</div></div>
    <div class="card"><div class="card-head"><h3>Objectif</h3></div><div id="kpi-goal" style="font-size:28px;font-weight:800">—</div></div>
  </section>

  <section class="grid-cards" style="margin-top:16px">
    <div class="card">
      <div class="card-head">
        <h3>Évolution du patrimoine</h3>
        <div class="badge">12 mois</div>
      </div>
      <canvas id="chart-wealth" height="280"></canvas>
    </div>

    <div class="card">
      <div class="card-head"><h3>Comptes</h3>
        <div>
          <button id="btnAddAcc" class="btn btn-primary btn-small">Ajouter un compte</button>
          <button id="btnDemo" class="btn btn-small">Démo</button>
          <button id="btnReset" class="btn btn-small">Reset</button>
        </div>
      </div>
      <table id="accountsTable">
        <thead><tr><th>Nom</th><th>Type</th><th>Solde</th><th></th></tr></thead>
        <tbody><tr><td colspan="4" class="muted">Aucun compte</td></tr></tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-head"><h3>Favoris</h3></div>
      <ul id="favList" class="assets" style="margin:0"><li class="muted">Aucun favori</li></ul>
    </div>

    <div class="card">
      <div class="card-head"><h3>Saisie rapide</h3></div>
      <div style="display:grid;grid-template-columns:1fr 150px 150px auto;gap:10px">
        <input id="qCat" class="input" placeholder="Catégorie (ex: Courses)">
        <input id="qAmount" class="input" placeholder="Montant (€)" inputmode="decimal">
        <select id="qType" class="select"><option value="expense">Dépense</option><option value="income">Revenu</option></select>
        <button id="qSave" class="btn btn-primary">Enregistrer</button>
      </div>
      <p class="small muted" style="margin-top:8px">Astuce : ces mouvements alimentent les KPIs, pas les soldes de comptes (tu peux les ajuster manuellement).</p>
    </div>
  </section>
</main>

<footer class="footer"><div class="container">© 2025 ValenHub — <a href="methode.html">Méthodologie</a></div></footer>
<script src="assets/dashboard.js"></script>
</body></html>
(()=>{const K={A:'valenhub.accounts',T:'valenhub.txs',B:'valenhub.budgets',H:'valenhub.history'};
const $=s=>document.querySelector(s),fmt=n=>(n??0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const st={acc:load(K.A,[]),tx:load(K.T,[]),bud:load(K.B,{}),hist:load(K.H,[])},now=new Date();
function load(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))} function saveAll(){save(K.A,st.acc);save(K.T,st.tx);save(K.B,st.bud);save(K.H,st.hist)}
const el={kW:$('#kpi-wealth'),kV:$('#kpi-variation'),kE:$('#kpi-expenses'),kG:$('#kpi-goal'),c:$('#chart-wealth'),tb:$('#accountsTable tbody'),
btnAdd:$('#btnAddAcc'),btnDemo:$('#btnDemo'),btnReset:$('#btnReset'),qCat:$('#qCat'),qAmt:$('#qAmount'),qType:$('#qType'),qSave:$('#qSave'),fav:$('#favList')};
function sMonth(d=new Date()){return new Date(d.getFullYear(),d.getMonth(),1)} function eMonth(d=new Date()){return new Date(d.getFullYear(),d.getMonth()+1,0)}
function inR(d,a,b){return d>=a&&d<=b} function wealth(){return st.acc.reduce((s,a)=>s+(+a.balance||0),0)}
function monthExp(){const f=sMonth(),t=eMonth();return st.tx.filter(x=>x.type==='expense'&&inR(new Date(x.date),f,t)).reduce((s,x)=>s+Math.abs(+x.amount||0),0)}
function nearSnap(d){if(!st.hist.length)return null;let b=st.hist[0],bd=Math.abs(new Date(b.date)-d);for(const h of st.hist){const dd=Math.abs(new Date(h.date)-d);if(dd<bd){b=h;bd=dd}}return b?.wealth??null}
function variation(){const w=wealth(),d=new Date();d.setDate(d.getDate()-30);const p=nearSnap(d)??w;return p?((w-p)/p)*100:0}
function snapshot(){const ts=new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10);const ex=st.hist.find(h=>h.date===ts);const w=wealth();
if(ex)ex.wealth=w;else{st.hist.push({date:ts,wealth:w});st.hist.sort((a,b)=>new Date(a.date)-new Date(b.date));if(st.hist.length>18)st.hist=st.hist.slice(-18)}}
function rKPIs(){el.kW&&(el.kW.textContent=fmt(wealth()));el.kE&&(el.kE.textContent=fmt(monthExp()));const v=variation();el.kV&&(el.kV.textContent=(v>=0?'+':'')+v.toFixed(1)+' %');const g=Math.min(100,(wealth()/50000)*100);el.kG&&(el.kG.textContent=g.toFixed(1)+' %')}
function rAcc(){if(!el.tb)return;el.tb.innerHTML=st.acc.length?st.acc.map((a,i)=>`<tr><td>${a.name}</td><td class="muted">${a.type||'-'}</td><td>${fmt(a.balance)}</td><td><button class="btn btn-small" data-del="${i}">Supprimer</button></td></tr>`).join(''):`<tr><td colspan="4" class="muted">Aucun compte</td></tr>`;
el.tb.querySelectorAll('button[data-del]').forEach(b=>b.addEventListener('click',e=>{const i=+e.currentTarget.dataset.del;st.acc.splice(i,1);snapshot();saveAll();refresh()}))}
let chart;function rChart(){if(!el.c||typeof Chart==='undefined')return;let hist=[...st.hist];if(!hist.length){const w=wealth();for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);hist.push({date:d.toISOString().slice(0,10),wealth:Math.round(w*(0.96+Math.random()*0.1))})}st.hist=hist;save(K.H,st.hist)}
const labels=[],data=[];for(const h of hist.slice(-12)){const d=new Date(h.date);labels.push(d.toLocaleDateString('fr-FR',{month:'short'}));data.push(h.wealth)}
if(chart)chart.destroy();chart=new Chart(el.c.getContext('2d'),{type:'line',data:{labels,datasets:[{label:'Patrimoine',data,fill:true,tension:.35,borderWidth:2}]},options:{plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#cbd5e1'},grid:{display:false}},y:{ticks:{color:'#cbd5e1',callback:v=>fmt(v)},grid:{color:'rgba(255,255,255,.06)'}}}})}
function rFav(){if(!el.fav)return;const fav=JSON.parse(localStorage.getItem('valenhub-favs')||'[]');el.fav.innerHTML=fav.length?fav.map(f=>`<li>${f.name} <span class="muted">${f.ticker||''}</span></li>`).join(''):`<li class="muted">Aucun favori</li>`}
function addAcc(){const name=prompt('Nom du compte ?');if(!name)return;const type=prompt('Type (banque/épargne/PEA/crypto) ?')||'banque';const bal=Number(prompt('Solde initial (€) ?')||'0');st.acc.push({name,type,balance:bal});snapshot();saveAll();refresh()}
function demo(){st.acc=[{name:'Compte courant',type:'banque',balance:2450},{name:'Livret A',type:'épargne',balance:8200},{name:'PEA',type:'trading',balance:12900},{name:'Binance',type:'crypto',balance:2150}];
st.tx=[];st.bud={Logement:900,Nourriture:350,Transport:110,Loisirs:120};st.hist=[];const base=20000;for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);st.hist.push({date:d.toISOString().slice(0,10),wealth:Math.round(base*(0.95+Math.random()*0.15)+i*380)})}saveAll();refresh()}
function resetAll(){if(!confirm('Réinitialiser toutes les données locales ?'))return;st.acc=[];st.tx=[];st.bud={};st.hist=[];saveAll();refresh()}
function quick(){const cat=(el.qCat?.value||'Autre').trim();const amt=Number(el.qAmt?.value||0);const typ=el.qType?.value==='income'?'income':'expense';if(!amt)return;st.tx.push({date:new Date().toISOString(),category:cat,amount:typ==='expense'?-Math.abs(amt):Math.abs(amt),type:typ});save(K.T,st.tx);el.qAmt&&(el.qAmt.value='');refresh()}
function refresh(){rKPIs();rAcc();rChart();rFav()}
el.btnAdd&&el.btnAdd.addEventListener('click',addAcc);el.btnDemo&&el.btnDemo.addEventListener('click',demo);el.btnReset&&el.btnReset.addEventListener('click',resetAll);el.qSave&&el.qSave.addEventListener('click',quick);
snapshot();saveAll();refresh();})();
