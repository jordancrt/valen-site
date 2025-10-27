/* assets/dashboard.js
   ValenHub/ValenCompare — Dashboard local-first
   - Comptes + transactions + budgets (localStorage)
   - KPIs auto
   - Courbe d’évolution (12 derniers points)
   - Fonctions robustes (ne plantent pas si un élément manque)
*/

(() => {
  // ---------- Stockage ----------
  const LS_KEYS = {
    accounts: 'valenhub.accounts',
    txs:      'valenhub.txs',
    budgets:  'valenhub.budgets',
    history:  'valenhub.history' // snapshots mensuels
  };

  const now = new Date();

  const state = {
    accounts: load(LS_KEYS.accounts, []),
    txs:      load(LS_KEYS.txs, []),
    budgets:  load(LS_KEYS.budgets, {}), // { "Logement": 900, "Nourriture": 350, ... }
    history:  load(LS_KEYS.history, [])  // [{date:"2025-01-01", wealth: 31500}, ...]
  };

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function saveAll() {
    save(LS_KEYS.accounts, state.accounts);
    save(LS_KEYS.txs,      state.txs);
    save(LS_KEYS.budgets,  state.budgets);
    save(LS_KEYS.history,  state.history);
  }

  // ---------- Sélecteurs (optionnels) ----------
  const $ = s => document.querySelector(s);
  const el = {
    kWealth:    $('#kpi-wealth'),
    kVar:       $('#kpi-variation'),
    kExp:       $('#kpi-expenses'),
    kGoal:      $('#kpi-goal'),
    chart:      $('#chart-wealth'),
    tBody:      $('#accountsTable tbody'),
    // actions
    bRefresh:   $('#btnRefresh'),
    bDemo:      $('#btnDemo'),
    bReset:     $('#btnReset'),
    bAddAcc:    $('#btnAddAcc'),
    // saisie rapide
    qCat:       $('#qCat'),
    qAmount:    $('#qAmount'),
    qType:      $('#qType'),
    qSave:      $('#qSave'),
  };

  // ---------- Utilitaires ----------
  const fmtEUR = n => (n ?? 0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
  function startOfMonth(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function endOfMonth(d = new Date())   { return new Date(d.getFullYear(), d.getMonth()+1, 0); }

  // ---------- Agrégats ----------
  function totalWealth() {
    return state.accounts.reduce((s,a) => s + (Number(a.balance)||0), 0);
  }

  function monthExpenses(d = new Date()) {
    const from = startOfMonth(d), to = endOfMonth(d);
    return state.txs
      .filter(t => t.type==='expense' && inRange(new Date(t.date), from, to))
      .reduce((s,t) => s + Math.abs(Number(t.amount)||0), 0);
  }

  function monthVariation() {
    // variation = (wealth_now - wealth_30j_avant) / wealth_30j_avant
    const nowVal = totalWealth();
    const thirty = new Date(); thirty.setDate(thirty.getDate()-30);
    const past = closestSnapshot(thirty) ?? nowVal;
    if (!past) return 0;
    return ((nowVal - past) / past) * 100;
  }

  function inRange(d, from, to) { return d >= from && d <= to; }

  function closestSnapshot(date) {
    if (!state.history.length) return null;
    let best = state.history[0], bestDiff = Math.abs(new Date(best.date)-date);
    for (const h of state.history) {
      const diff = Math.abs(new Date(h.date) - date);
      if (diff < bestDiff) { best = h; bestDiff = diff; }
    }
    return best?.wealth ?? null;
  }

  function snapshotMonthly() {
    // garde max 18 points
    const stamp = new Date(now.getFullYear(), now.getMonth(), 1);
    const iso = stamp.toISOString().slice(0,10);
    const exists = state.history.find(h => h.date === iso);
    const w = totalWealth();
    if (exists) { exists.wealth = w; }
    else {
      state.history.push({ date: iso, wealth: w });
      state.history.sort((a,b)=> new Date(a.date)-new Date(b.date));
      if (state.history.length > 18) state.history = state.history.slice(-18);
    }
  }

  // ---------- Rendu KPIs ----------
  function renderKPIs() {
    const wealth = totalWealth();
    const exp = monthExpenses();
    const variation = monthVariation();
    const goalPct = Math.min(100, (wealth/50000)*100); // objectif démo: 50k€

    if (el.kWealth) el.kWealth.textContent = fmtEUR(wealth);
    if (el.kExp)    el.kExp.textContent    = fmtEUR(exp);
    if (el.kVar)    el.kVar.textContent    = (variation>=0?'+':'') + variation.toFixed(1) + ' %';
    if (el.kGoal)   el.kGoal.textContent   = goalPct.toFixed(1) + ' %';
  }

  // ---------- Rendu comptes ----------
  function renderAccounts() {
    if (!el.tBody) return;
    el.tBody.innerHTML = state.accounts.length
      ? state.accounts.map((a,i)=>`
        <tr>
          <td>${a.name}</td>
          <td class="muted">${a.type||'-'}</td>
          <td>${fmtEUR(a.balance)}</td>
          <td><button class="btn btn-ghost" data-del="${i}">Supprimer</button></td>
        </tr>`).join('')
      : `<tr><td colspan="4" class="muted">Aucun compte</td></tr>`;

    el.tBody.querySelectorAll('button[data-del]').forEach(b=>{
      b.addEventListener('click', e=>{
        const i = Number(e.currentTarget.dataset.del);
        state.accounts.splice(i,1);
        snapshotMonthly();
        saveAll();
        refreshAll();
      });
    });
  }

  // ---------- Graph ----------
  let chart;
  function renderChart() {
    if (!el.chart || typeof Chart === 'undefined') return;

    const labels = [];
    const data   = [];
    const hist = [...state.history];

    // Assure au moins quelques points (sinon on simule une base plate)
    if (!hist.length) {
      const w = totalWealth();
      for (let i=11;i>=0;i--){
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        hist.push({ date: d.toISOString().slice(0,10), wealth: w*(0.95 + 0.1*Math.random()) });
      }
      state.history = hist;
      save(LS_KEYS.history, state.history);
    }

    for (const h of hist.slice(-12)) {
      const d = new Date(h.date);
      labels.push(d.toLocaleDateString('fr-FR',{ month:'short'}));
      data.push(h.wealth);
    }

    if (chart) chart.destroy();
    chart = new Chart(el.chart.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Patrimoine',
          data,
          cubicInterpolationMode: 'monotone',
          borderWidth: 2,
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        plugins: { legend: { display:false } },
        scales: {
          x: { ticks:{ color:'#cbd5e1' }, grid:{ display:false } },
          y: { ticks:{ color:'#cbd5e1', callback:v=>fmtEUR(v) }, grid:{ color:'rgba(255,255,255,.06)'} }
        }
      }
    });
  }

  // ---------- Actions ----------
  function addAccountUI() {
    // Si tu as un vrai modal dans le HTML, branche-le ici.
    // Sinon on utilise des prompts simples.
    const name = prompt('Nom du compte (ex: Compte courant, Binance, PEA) ?');
    if (!name) return;
    const type = prompt('Type (banque/crypto/trading/épargne) ?') || 'banque';
    const balance = Number(prompt('Solde initial (€) ?') || '0');

    state.accounts.push({ name, type, balance });
    snapshotMonthly();
    saveAll();
    refreshAll();
  }

  function addQuickTx() {
    if (!el.qCat || !el.qAmount || !el.qType) return;
    const cat = (el.qCat.value||'Autre').trim();
    const amt = Number(el.qAmount.value||0);
    const typ = el.qType.value==='income' ? 'income' : 'expense';
    if (!amt) return;

    state.txs.push({ date: new Date().toISOString(), category:cat, amount: typ==='expense' ? -Math.abs(amt) : Math.abs(amt), type:typ });
    save(LS_KEYS.txs, state.txs);
    // on n’ajuste pas automatiquement les soldes des comptes (ça dépend de l’UX souhaitée)
    refreshAll();
    el.qAmount.value='';
  }

  function loadDemo() {
    state.accounts = [
      { name:'Compte courant', type:'banque', balance: 2450 },
      { name:'Livret A',       type:'épargne', balance: 8200 },
      { name:'PEA',            type:'trading', balance: 12900 },
      { name:'Binance',        type:'crypto',  balance: 2150 }
    ];
    state.txs = [];
    state.budgets = { Logement: 900, Nourriture: 350, Transport: 110, Loisirs: 120 };
    // historique synthétique
    const base = 20000;
    state.history = [];
    for (let i=11;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const drift = 1 + (Math.random()*0.12 - 0.02);
      state.history.push({ date: d.toISOString().slice(0,10), wealth: Math.round(base*drift + i*400) });
    }
    saveAll();
    refreshAll();
  }

  function hardReset() {
    if (!confirm('Réinitialiser toutes les données locales ?')) return;
    state.accounts = [];
    state.txs = [];
    state.budgets = {};
    state.history = [];
    saveAll();
    refreshAll();
  }

  function refreshAll() {
    renderKPIs();
    renderAccounts();
    renderChart();
  }

  // ---------- Bind des boutons (si présents) ----------
  el.bRefresh && el.bRefresh.addEventListener('click', refreshAll);
  el.bAddAcc  && el.bAddAcc.addEventListener('click', addAccountUI);
  el.bDemo    && el.bDemo.addEventListener('click', loadDemo);
  el.bReset   && el.bReset.addEventListener('click', hardReset);
  el.qSave    && el.qSave.addEventListener('click', addQuickTx);

  // ---------- Démarrage ----------
  snapshotMonthly();
  saveAll();
  refreshAll();
})();
