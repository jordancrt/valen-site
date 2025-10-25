/* ====== ÉTAT & PERSISTANCE ====== */
const STORE_KEY = "valenhub-state-v1";
const now = new Date();

const State = {
  accounts: [],           // [{id,name,type,balance}]
  categories: {},         // { "Alimentation": {budget: 300, spent: 120}, ... }
  history: [],            // [{dateISO, wealth}]
  monthStartWealth: 0,    // base pour variation mensuelle
  goalAmount: 20000,      // objectif simple
};

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {...State};
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(State));
}

/* ====== UTILITAIRES ====== */
const € = (n) => (n||0).toLocaleString("fr-FR",{style:"currency",currency:"EUR"});
const pct = (n) => `${(n||0).toFixed(1).replace(".0","")} %`;
function monthStart() { const d=new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }

/* ====== UI : RÉFÉRENCES ====== */
const elWealth   = document.getElementById("kpi-wealth");
const elDelta    = document.getElementById("kpi-delta");
const elExp      = document.getElementById("kpi-expenses");
const elGoal     = document.getElementById("kpi-goal");
const elAccList  = document.getElementById("accountsList");
const selectRange= document.getElementById("rangeWealth");
const datalistCats = document.getElementById("cats");

/* Modales */
const dlgAccount = document.getElementById("dlg-account");
const dlgSpend   = document.getElementById("dlg-spend");
const dlgBudget  = document.getElementById("dlg-budget");
const dlgInvest  = document.getElementById("dlg-invest");

/* Boutons ouverture modales */
document.getElementById("btn-add").onclick     = () => dlgAccount.showModal();
document.getElementById("open-spend").onclick  = () => { syncAccountsSelects(); dlgSpend.showModal(); };
document.getElementById("open-budget").onclick = () => dlgBudget.showModal();
document.getElementById("open-invest").onclick = () => { syncAccountsSelects(); dlgInvest.showModal(); };

/* Autres boutons */
document.getElementById("btn-reset").onclick = () => { if(confirm("Réinitialiser les données locales ?")) { localStorage.removeItem(STORE_KEY); location.reload(); } };
document.getElementById("btn-demo").onclick  = demoData;
document.getElementById("btn-refresh").onclick = () => { computeAll(); renderAll(); };

/* ====== GESTION DES FORMULAIRES ====== */
document.getElementById("form-account").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const acc = {
    id: crypto.randomUUID(),
    name: String(f.get("name")).trim(),
    type: f.get("type"),
    balance: Number(f.get("balance")||0),
  };
  State.accounts.push(acc);
  save(); computeAll(); renderAll();
  dlgAccount.close();
  e.target.reset();
});

document.getElementById("form-spend").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const cat = String(f.get("category")).trim() || "Autre";
  const amt = Math.abs(Number(f.get("amount")||0));
  const accId= String(f.get("account")||"");

  // met à jour catégorie
  if(!State.categories[cat]) State.categories[cat] = {budget:0, spent:0};
  State.categories[cat].spent += amt;

  // déduit du compte si choisi
  if (accId) {
    const acc = State.accounts.find(a=>a.id===accId);
    if (acc) acc.balance -= amt;
  }

  save(); computeAll(); renderAll();
  dlgSpend.close(); e.target.reset();
});

document.getElementById("form-budget").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const cat = String(f.get("category")).trim();
  const bud = Math.max(0, Number(f.get("budget")||0));
  if(!cat) return;
  if(!State.categories[cat]) State.categories[cat] = {budget:0, spent:0};
  State.categories[cat].budget = bud;
  save(); computeAll(); renderAll();
  dlgBudget.close(); e.target.reset();
});

document.getElementById("form-invest").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const accId= String(f.get("account"));
  const amt = Math.abs(Number(f.get("amount")||0));
  const acc = State.accounts.find(a=>a.id===accId);
  if(acc){ acc.balance += amt; }
  // on considère un dépôt/investissement comme une hausse de patrimoine
  pushHistoryPoint();
  save(); computeAll(); renderAll();
  dlgInvest.close(); e.target.reset();
});

/* Remplir listes de comptes dans les modales */
function syncAccountsSelects(){
  const selects = [
    document.querySelector('#form-spend select[name="account"]'),
    document.querySelector('#form-invest select[name="account"]'),
  ];
  for(const sel of selects){
    sel.innerHTML = '<option value="">—</option>' + State.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  }
}

/* Remplir datalist catégories */
function syncCategoriesDatalist(){
  datalistCats.innerHTML = Object.keys(State.categories).sort().map(c=>`<option value="${c}">`).join('');
}

/* ====== CALCULS KPI ====== */
function totalWealth(){ return State.accounts.reduce((s,a)=>s+(a.balance||0),0); }
function monthDeltaPct(){
  const base = State.monthStartWealth || 0;
  const cur  = totalWealth();
  if(base<=0) return 0;
  return ( (cur - base) / base ) * 100;
}
function monthExpenses(){
  return Object.values(State.categories).reduce((s,c)=>s+(c.spent||0),0);
}
function goalPct(){
  const w = totalWealth();
  if(State.goalAmount<=0) return 0;
  return Math.min(100, (w/State.goalAmount)*100);
}

/* Historique : ajoute un point “aujourd’hui” basé sur le total */
function pushHistoryPoint(){
  const point = { dateISO: new Date().toISOString(), wealth: totalWealth() };
  // garde 36 points max
  State.history.push(point);
  if(State.history.length>36) State.history.shift();
}

/* Initialise monthStartWealth au 1er du mois si vide */
function ensureMonthStart(){
  if(!State.monthStartWealth){
    State.monthStartWealth = totalWealth();
  }
}

/* ====== RENDU UI ====== */
function renderAccounts(){
  if(State.accounts.length===0){
    elAccList.innerHTML = "<li>Aucun compte connecté</li>";
    return;
  }
  elAccList.innerHTML = State.accounts.map(a=>`
    <li class="account-row">
      <span class="acc-name">${a.name}</span>
      <span class="acc-type muted">${a.type}</span>
      <span class="acc-amt">${€(a.balance)}</span>
      <button class="btn btn-ghost btn-small" data-acc="${a.id}">−</button>
    </li>
  `).join('');

  // suppression de compte
  elAccList.querySelectorAll("button[data-acc]").forEach(btn=>{
    btn.onclick = () => {
      const id = btn.dataset.acc;
      State.accounts = State.accounts.filter(a=>a.id!==id);
      save(); computeAll(); renderAll();
    }
  });
}

/* ====== CHARTS ====== */
let chartWealth=null, chartExpenses=null;

function renderWealth(range="1y"){
  const wrap = document.getElementById("chartWealth");
  const sk   = document.getElementById("sk-wealth");
  const ctx  = wrap.getContext("2d");

  // fabrique une série lissée
  const points = [...State.history];
  if(points.length<6){
    // si pas d’historique, génère une courbe douce autour du total actuel
    const base = totalWealth() || 32000;
    for(let i=6;i>=0;i--){
      const noise = (Math.sin(i)*0.015 + Math.random()*0.01) * base;
      points.unshift({dateISO: new Date(Date.now()-i*30*24*3600e3).toISOString(), wealth: Math.max(0, base*(0.9+Math.random()*0.2) + noise)});
    }
  }

  const lastMonths = range==="6m"? 6 : range==="3y"? 36 : 12;
  const sliced = points.slice(-lastMonths);

  const labels = sliced.map(p => {
    const d = new Date(p.dateISO);
    return d.toLocaleDateString("fr-FR",{month:"short"});
  });
  const data   = sliced.map(p => p.wealth);

  if(chartWealth) chartWealth.destroy();
  chartWealth = new Chart(ctx, {
    type: "line",
    data: { labels, datasets:[{
      label: "Patrimoine",
      data, tension:.3, borderWidth:2,
      borderColor:"rgba(167,139,250,.95)", pointRadius:0, fill:true,
      backgroundColor:"rgba(167,139,250,.10)",
    }]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{mode:"index",intersect:false} },
      scales:{ x:{ grid:{display:false}}, y:{ ticks:{ callback:v=>€(v).replace(" €"," €") } } }
    }
  });

  sk.hidden = true; wrap.hidden = false;
}

function renderExpenses(){
  const wrap = document.getElementById("chartExpenses");
  const sk   = document.getElementById("sk-exp");
  const ctx  = wrap.getContext("2d");

  const cats = Object.keys(State.categories);
  const spent= cats.map(c => State.categories[c].spent||0);
  const budget= cats.map(c => State.categories[c].budget||0);

  if(chartExpenses) chartExpenses.destroy();
  chartExpenses = new Chart(ctx, {
    type: "bar",
    data: {
      labels: cats.length? cats : ["Aucune catégorie"],
      datasets:[
        {label:"Dépenses", data: spent, borderWidth:0, backgroundColor:"rgba(255,255,255,.25)"},
        {label:"Budget",   data: budget, borderWidth:1, borderColor:"rgba(167,139,250,.9)", backgroundColor:"rgba(167,139,250,.15)"},
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:"bottom"} },
      scales:{ x:{ grid:{display:false}}, y:{ ticks:{ callback:v=>€(v).replace(" €"," €") } } }
    }
  });

  sk.hidden = true; wrap.hidden = false;
}

/* ====== RENDU KPI & SYNCHRO ====== */
function computeAll(){
  ensureMonthStart();
  // met à jour datalist catégories
  syncCategoriesDatalist();
}

function renderKPIs(){
  const w = totalWealth();
  const d = monthDeltaPct();
  const e = monthExpenses();
  const g = goalPct();

  elWealth.textContent = €(w);
  elDelta.textContent  = pct(d);
  elExp.textContent    = €(e).replace(" €"," €");
  elGoal.textContent   = pct(g);
}

function renderAll(){
  renderAccounts();
  renderKPIs();
  renderWealth(selectRange.value);
  renderExpenses();
}

/* ====== DÉMO ====== */
function demoData(){
  // si déjà des comptes, on n’écrase pas
  if(State.accounts.length===0){
    State.accounts = [
      {id:crypto.randomUUID(), name:"Boursorama", type:"Banque",  balance: 2100},
      {id:crypto.randomUUID(), name:"Binance",    type:"Crypto",  balance: 12500},
      {id:crypto.randomUUID(), name:"PEA",        type:"Trading", balance: 9300},
    ];
  }
  State.categories = {
    "Logement":     {budget: 900, spent: 900},
    "Alimentation": {budget: 350, spent: 290},
    "Transport":    {budget: 120, spent: 95},
    "Loisirs":      {budget: 200, spent: 140},
  };
  State.monthStartWealth = totalWealth() * 0.97; // base pour voir une variation positive
  // Historique fictif
  State.history = [];
  for(let i=11;i>=0;i--){
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const base = totalWealth()* (0.9 + Math.random()*0.2);
    State.history.push({dateISO: d.toISOString(), wealth: Math.round(base)});
  }
  save(); computeAll(); renderAll();
}

/* ====== INIT ====== */
Object.assign(State, load());
computeAll(); renderAll();

/* Changement de plage du graphique */
selectRange.addEventListener("change", ()=> renderWealth(selectRange.value));

/* Journaling simple du patrimoine (une fois à l’ouverture) */
pushHistoryPoint(); save();
